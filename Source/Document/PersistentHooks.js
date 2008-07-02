var relativeHRefHook = {
    onDomSerialization: function (dom) {
        var thiz = this;
        
        Dom.workOn("//@xlink:href", dom, function (href) {
            var hrefValue = href.nodeValue;
            if (!hrefValue.match(/^file:\/\/.*$/)) return;
            
            var relativePath = thiz.uriToRelative(hrefValue);
            if (relativePath) {
                href.nodeValue = relativePath;
            }
        });
        var xpath = "//svg:g[@p:type='Shape' and @p:def='Evolus.Common:Bitmap']//p:property[@name='imageData']";
        Dom.workOn(xpath, dom, function (property) {
            var imageData = ImageData.fromString(property.textContent);
            if (!imageData.data.match(/^file:\/\/.*$/)) return;
            
            var relativePath = thiz.uriToRelative(imageData.data);
            if (relativePath) {
                imageData.data = relativePath;
                Dom.empty(property);
                property.appendChild(property.ownerDocument.createCDATASection(imageData.toString()));
            }
        });
    },
    onPageLoad: function (page) {
        var thiz = this;
        
        Dom.workOn("//@xlink:href", page.contentNode, function (href) {
            var hrefValue = href.nodeValue;
            if (hrefValue.match(/^[a-z]+:\/\/.*$/)) return;
            
            var uri = thiz.relativeToURI(hrefValue);
            if (uri) {
                href.nodeValue = uri;
            }
        });
        var xpath = "//svg:g[@p:type='Shape' and @p:def='Evolus.Common:Bitmap']//p:property[@name='imageData']";
        Dom.workOn(xpath, page.contentNode, function (property) {
            var imageData = ImageData.fromString(property.textContent);
            if (imageData.data.match(/^[a-z]+:.*$/)) return;
            
            imageData.data = thiz.relativeToURI(imageData.data);
            Dom.empty(property);
            property.appendChild(property.ownerDocument.createCDATASection(imageData.toString()));
        });
    },
    uriToRelative: function (absoluteFileURI) {
        var file = XMLDocumentPersister.currentFile.parent;
        try {
            var hrefFile = fileHandler.getFileFromURLSpec(absoluteFileURI).QueryInterface(Components.interfaces.nsILocalFile);
            return hrefFile.getRelativeDescriptor(file);
        } catch (e) {
            return null;
        }
    },
    relativeToURI: function (relativeFileURI) {
        var file = XMLDocumentPersister.currentFile.parent;
        
        var hrefFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
        hrefFile.setRelativeDescriptor(file, relativeFileURI);
        
        if (!hrefFile.exists()) return null;
        
        return ImageData.ios.newFileURI(hrefFile).spec;
    }
}

XMLDocumentPersister.hooks.push(relativeHRefHook);
