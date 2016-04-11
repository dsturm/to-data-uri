var vscode = require('vscode');
var url = require('url');
var fs = require('fs');
var mimetype = require('mimetype');



function toUrl(uri) {
    return url.parse(uri.toString());
}


function findMimeType(fileUrl) {
    return mimetype.lookup(fileUrl.pathname);
}


function inlineFile(fileUrl, editor) {
    if (fileUrl.protocol == 'file:') {
        fs.readFile(fileUrl.pathname, 'binary', function (err, imageData) {
            if (!err) {
                var mimeType = findMimeType(fileUrl);
                var base64Image = new Buffer(imageData, 'binary').toString('base64');
                var dataUri = 'data:' + mimeType + ';base64,' + base64Image;

                editor.edit(function (builder) {
                    builder.replace(editor.selection, dataUri);
                });
            }
        });
    }
}


function hasWorkspaceFolder(editor) {
    return vscode.workspace.rootPath ? true : false;
}


function createItem(uri) {
    var length = vscode.workspace.rootPath.length;
    return {
        label: uri.path.substr(length),
        description: null,
        uri: uri
    };
}


function computeItems(uris) {
    var items = [];
    for (var i = 0; i < uris.length; i++) {
        items.push(createItem(uris[i]));
    }
    return items;
}


function activate(context) {

    var disposable = vscode.commands.registerCommand('extension.toDataURI', function () {
        
        var editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        
        var text = editor.document.getText(editor.selection);
        if (!text) {
            return;
        }
        
        var imageSrc = url.parse(text);
        
        if (hasWorkspaceFolder()) {
            var prefix = imageSrc.pathname.startsWith('/') ? '**' : '**/';
            vscode.workspace.findFiles(prefix + text, null, 10, null).then(function(uris) {
                var innerDisposable;
                if (!uris || uris.length == 0) {
                    innerDisposable = vscode.window.showInformationMessage('Can\'t find the image file in your workspace.');
                    context.subscriptions.push(innerDisposable);
                    return;
                }
                if (uris.length == 1) {
                    inlineFile(toUrl(uris[0]), editor);
                    return;
                }
                var items = computeItems(uris);
                vscode.window.showQuickPick(items, { placeHolder: 'Which file do you want to inline?'}).then(function(selectedItem) {
                    if (selectedItem) {
                        inlineFile(toUrl(selectedItem.uri), editor);
                    }
                });
            });
            
        } else {
            // look for image file relative to the opened file
            var resolved = url.resolve(editor.document.uri.toString(), imageSrc.format());
            inlineFile(url.parse(resolved), editor);
        }
       
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;



function deactivate() {
}
exports.deactivate = deactivate;