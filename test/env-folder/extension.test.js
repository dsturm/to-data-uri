var assert = require('assert');
var url = require('url');
var vscode = require('vscode');
var toDataUri = require('../../extension');


function log(document, range) {
    // console.log('SNIPPET: ' + document.getText(range));
}

suite('window was opened on workspace', function () {

    var activeDocument = null;

    suiteSetup(function (done) {
        var filePath = vscode.workspace.rootPath + '/page.html';
        vscode.workspace.openTextDocument(filePath).then(function (textDocument) {
            activeDocument = textDocument;
            done();
        });
    });


    suiteTeardown(function (done) {
        vscode.commands.executeCommand('workbench.files.action.closeAllFiles').then(function () {
            done();
        })
    });


    test('no selection', function (done) {
        var range = new vscode.Range(new vscode.Position(2, 18), new vscode.Position(2, 18));
        log(activeDocument, range);
        toDataUri.getFiles(activeDocument, range).then(function (uris) {
            assert.equal(uris, null, 'no file uri should be returned');
            done();
        });
    });


    test('cannot inline remote files', function (done) {
        var range = new vscode.Range(new vscode.Position(2, 18), new vscode.Position(2, 65));
        log(activeDocument, range);
        toDataUri.getFiles(activeDocument, range).catch(function (reason) {
            assert.ok(reason, 'remote files should be rejected');
            done();
        });
    });


    test('file does not exist in workspace', function (done) {
        var range = new vscode.Range(new vscode.Position(3, 18), new vscode.Position(3, 30));
        log(activeDocument, range);
        toDataUri.getFiles(activeDocument, range).then(function (uris) {
            assert.ok(uris, 'should be an array');
            assert.equal(uris.length, 0, 'no file uri should be returned');
            done();
        });
    });


    test('multiple choices', function (done) {
        var range = new vscode.Range(new vscode.Position(4, 18), new vscode.Position(4, 29));
        log(activeDocument, range);
        toDataUri.getFiles(activeDocument, range).then(function (uris) {
            assert.ok(uris, 'should be an array');
            assert.equal(uris.length, 3, 'should be three file uris to choose from');
            done();
        });
    });


    test('single choice', function (done) {
        var range = new vscode.Range(new vscode.Position(5, 18), new vscode.Position(5, 33));
        log(activeDocument, range);
        toDataUri.getFiles(activeDocument, range).then(function (uris) {
            assert.ok(uris, 'should be an array');
            assert.equal(uris.length, 1, 'should be a single file uri proposal');
            done();
        });
    });

});


suite('compare data uris', function () {

    suiteSetup(function (done) {
        done();
    });


    suiteTeardown(function (done) {
        vscode.commands.executeCommand('workbench.files.action.closeAllFiles').then(function () {
            done();
        })
    });


    test('compare png', function (done) {
        var expected;
        var filePath = vscode.workspace.rootPath + '/expected/inlined-picture-png';
        vscode.workspace.openTextDocument(filePath)
            .then(function (textDocument) {
                expected = textDocument.getText();
                var fileUrl = url.parse(vscode.workspace.rootPath + '/picture.png');
                return toDataUri.convertFile(fileUrl);
            })
            .then(function (actual) {
                assert.equal(expected, actual, 'png convertation did not produce expected result');
                done();
            })
    });
    
    
    test('compare ico', function (done) {
        var expected;
        var filePath = vscode.workspace.rootPath + '/expected/inlined-icon-ico';
        vscode.workspace.openTextDocument(filePath)
            .then(function (textDocument) {
                expected = textDocument.getText();
                var fileUrl = url.parse(vscode.workspace.rootPath + '/icon.ico');
                return toDataUri.convertFile(fileUrl);
            })
            .then(function (actual) {
                assert.equal(expected, actual, 'ico convertation did not produce expected result');
                done();
            })
    });
});



