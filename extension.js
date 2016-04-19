"use strict";

var vscode = require('vscode');
var url = require('url');
var fs = require('fs');
var mimetype = require('mimetype');
var util = require('util');


function toUrl(uri) {
    return url.parse('string' === typeof (uri) ? uri : uri.toString());
}


function findMimeType(fileUrl) {
    return mimetype.lookup(fileUrl.pathname);
}


function convertFile(fileUrl) {
    return new Promise(function (resolve, reject) {
        fs.readFile(fileUrl.pathname, 'binary', function (err, imageData) {
            if (err) {
                return reject(err);
            }
            var mimeType = findMimeType(fileUrl);
            var base64Image = new Buffer(imageData, 'binary').toString('base64');
            var dataUri = 'data:' + mimeType + ';base64,' + base64Image;
            return resolve(dataUri);
        });
    });
}


function inlineFile(fileUrl) {
    return convertFile(fileUrl).then(function (fileData) {
        if (fileData) {
            var editor = vscode.window.activeTextEditor;
            editor.edit(function (builder) {
                builder.replace(editor.selection, fileData);
            });
        }
    });
}


function hasWorkspaceFolder(editor) {
    return vscode.workspace.rootPath ? true : false;
}


function getTextRange() {
    var editor = vscode.window.activeTextEditor;
    var result = {};
    if (editor) {
        result = { document: editor.document, range: editor.selection };
    }
    return result;
}


function getFiles(document, textRange) {
    var text = document.getText(textRange);
    if (!text) {
        return Promise.resolve(null);
    }

    var imageSrc = url.parse(text);
    if (imageSrc.protocol && 'file:' != imageSrc.protocol) {
        return Promise.reject({ message: 'Can\'t inline remote files yet.' });
    }

    if (hasWorkspaceFolder()) {
        var prefix = imageSrc.pathname.startsWith('/') ? '**' : '**/';
        return Promise.resolve(vscode.workspace.findFiles(prefix + text, null, 10, null));
    }

    // not in workspace so look for image file relative to the opened file
    var resolved = toUrl(url.resolve(document.uri.toString(), imageSrc.format()));
    return Promise.resolve(resolved);
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


function showMessage(message, context) {
    var innerDisposable = vscode.window.showInformationMessage(message);
    context.subscriptions.push(innerDisposable);
}


function activate(context) {

    var disposable = vscode.commands.registerCommand('extension.toDataURI', function () {

        var textRange = getTextRange();
        getFiles(textRange.document, textRange.range)
            .then(function (uris) {
                if (util.isArray(uris)) {

                    if (uris.length === 0) {
                        let message = "Can't find the selected image file in your workspace.";
                        let fileName = textRange.document.getText(textRange.range);
                        if (fileName) {
                            message = "Can't find the file '" + fileName + "' in your workspace.";
                        }
                        showMessage(message, context);
                        return;
                    }

                    if (uris.length === 1) {
                        inlineFile(toUrl(uris[0]));
                        return;
                    }

                    let items = computeItems(uris);
                    vscode.window.showQuickPick(items, { placeHolder: 'Which file do you want to inline?' }).then(function (selectedItem) {
                        if (selectedItem) {
                            inlineFile(toUrl(selectedItem.uri));
                        }
                    });
                    return;
                }

                if (uris) {
                    inlineFile(uris).catch(function(reason) {
                        let message = reason.message;
                        if (message) {
                            if (message.indexOf('no such file or directory') > 0) {
                                message = "Can't find the selected image file.";
                                let fileName = textRange.document.getText(textRange.range);
                                if (fileName) {
                                    message = "Can't find the file '" + fileName + "'.";
                                }
                            }
                        } else {
                            message = reason;
                        }
                        showMessage(message, context);
                    });
                } else {
                    showMessage('Before running this command, select the value of the src attribute of a html img element.', context);
                }
            })
            .catch(function (reason) {
                showMessage(reason.message ? reason.message : reason, context);
            });

    });
    context.subscriptions.push(disposable);
}


function deactivate() {
}


exports.getFiles = getFiles;
exports.convertFile = convertFile;
exports.activate = activate;
exports.deactivate = deactivate;