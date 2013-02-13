describe('documentUtils', function() {
    var documentUtils, global;
    beforeEach(function() {
        global = {
            document: {
                getElementsByTagName: jasmine.createSpy('getElementsByTagName').andReturn([{
                    src: 'uitest.js'
                }])
            }
        };
        documentUtils = uitest.require({
            global: global
        }, ["documentUtils"]).documentUtils;
    });

    describe('serializeDocType', function() {
        function doctype(html) {
            return documentUtils.serializeDocType(testutils.createFrame(html).win.document);
        }
        it('should return empty string if no doctype is given', function() {
            expect(doctype('<html></html>')).toBe('');
        });
        it('should serialize html5 doctype', function() {
            expect(doctype('<!DOCTYPE html><html></html>')).toBe('<!DOCTYPE html>');
        });
    });

    describe('rewriteDocument', function() {
        function rewrite(html) {
            var frame = testutils.createFrame('<html></html>').win;
            documentUtils.rewriteDocument(frame, html);
            return frame.document;
        }
        it('should replace the document, including the root element and doctype', function() {
            var doc = rewrite('<!DOCTYPE html><html test="true"></html>');
            expect(doc.documentElement.getAttribute("test")).toBe("true");
            expect(doc.doctype.name).toBe('html');
        });
    });

    describe('serializeHtmlBeforeLastScript', function() {
        it('should return the part of the html before the last script', function() {
            var doc = testutils.createFrame('<html><head>asdf<script someAttr></script></head></html>').win.document;
            expect(documentUtils.serializeHtmlBeforeLastScript(doc)).toBe('<html><head></head><body>asdf');
        });
    });

    describe('replaceScripts', function() {
        var callback;
        beforeEach(function() {
            callback = jasmine.createSpy('callback');
        });
        it('should replace url scripts', function() {
            var someReplacement = 'someReplacement';
            callback.andReturn(someReplacement);
            var result = documentUtils.replaceScripts('<script src="a"></script>', callback);
            expect(callback.callCount).toBe(1);
            expect(callback).toHaveBeenCalledWith('<script src="a">', 'a', '');
        });
        it('should replace inline scripts', function() {
            var someReplacement = 'someReplacement';
            callback.andReturn(someReplacement);
            var result = documentUtils.replaceScripts('<script>a</script>', callback);
            expect(callback.callCount).toBe(1);
            expect(callback).toHaveBeenCalledWith('<script>', '', 'a');
        });
        it('should replace scripts if the result is not undefined', function() {
            var someReplacement = 'someReplacement';
            callback.andReturn(someReplacement);
            expect(documentUtils.replaceScripts('<script>a</script>', callback)).toBe(someReplacement);
        });
        it('should not replace scripts if the result is undefined', function() {
            var input = '<script>a</script>';
            expect(documentUtils.replaceScripts(input, callback)).toBe(input);
        });
        it('should replace multiple inline scripts', function() {
            documentUtils.replaceScripts('<script>a</script><script>b</script>', callback);
            expect(callback.callCount).toBe(2);
            expect(callback.argsForCall[0]).toEqual(['<script>', '', 'a']);
            expect(callback.argsForCall[1]).toEqual(['<script>', '', 'b']);
        });
        it('should replace multi line inline scripts', function() {
            var content = 'a\r\nb';
            documentUtils.replaceScripts('<script>' + content + '</script>', callback);
            expect(callback).toHaveBeenCalledWith('<script>', '', content);
        });
    });

    describe('loadAndEvalScriptSync', function() {
        var xhr, win;
        beforeEach(function() {
            xhr = {
                open: jasmine.createSpy('open'),
                send: jasmine.createSpy('send')
            };
            win = {
                XMLHttpRequest: jasmine.createSpy('xhr').andReturn(xhr),
                "eval": jasmine.createSpy('eval')
            };
        });

        function simulateXhrResponse(response) {
            xhr.readyState = 4;
            xhr.status = 200;
            xhr.responseText = response;
            xhr.onreadystatechange();
        }
        function simulateFileXhrResponse(response) {
            xhr.readyState = 4;
            xhr.status = 0;
            xhr.responseText = response;
            xhr.onreadystatechange();
        }
        it('should use a sync xhr', function() {
            documentUtils.loadAndEvalScriptSync(win, 'someUrl');
            expect(xhr.open).toHaveBeenCalledWith('GET', 'someUrl', false);
            expect(xhr.send).toHaveBeenCalled();
        });
        it('should call eval with the xhr result', function() {
            /*jshint evil:true */
            documentUtils.loadAndEvalScriptSync(win, 'someUrl');
            simulateXhrResponse('someResponse');
            expect(win['eval']).toHaveBeenCalledWith('someResponse//@ sourceURL=someUrl');
        });
        it('should work with file based xhr', function() {
            /*jshint evil:true */
            documentUtils.loadAndEvalScriptSync(win, 'someUrl');
            simulateFileXhrResponse('someResponse');
            expect(win['eval']).toHaveBeenCalled();
        });
        it('should allow the preProcessCalback to change the xhr result', function() {
            /*jshint evil:true */
            var preProcessCalback = jasmine.createSpy('preProcessCalback');
            preProcessCalback.andReturn('someProcessedResponse');
            documentUtils.loadAndEvalScriptSync(win, 'someUrl', preProcessCalback);
            simulateXhrResponse('someResponse');
            expect(win['eval']).toHaveBeenCalledWith('someProcessedResponse');
        });
    });

    describe('makeAbsoluteUrl', function() {
        it('should not change urls with a leading slash', function() {
            expect(documentUtils.makeAbsoluteUrl('/someUrl', 'base')).toBe('/someUrl');
        });
        it('should not change urls with a protocol', function() {
            expect(documentUtils.makeAbsoluteUrl('http://someUrl', 'base')).toBe('http://someUrl');
        });
        it('should change relative change urls with a base that contains no slash', function() {
            expect(documentUtils.makeAbsoluteUrl('someUrl', 'base')).toBe('/someUrl');
        });
        it('should change relative change urls with a base that contains a single slash', function() {
            expect(documentUtils.makeAbsoluteUrl('someUrl', '/base')).toBe('/someUrl');
        });
        it('should change relative change urls with a base that contains two or more slashes', function() {
            expect(documentUtils.makeAbsoluteUrl('someUrl', '/base/file')).toBe('/base/someUrl');
        });
    });

    describe('uitestUrl', function() {
        function test(someUrl, shouldMatch) {
            global.document.getElementsByTagName.andReturn([{src: someUrl}]);
            if (shouldMatch) {
                expect(documentUtils.uitestUrl()).toBe(someUrl);
            } else {
                expect(function() {
                    documentUtils.uitestUrl();
                }).toThrow();
            }
        }

        it('should use the right regex', function() {
            test('uitest.js', true);
            test('uitest-v1.0.js', true);
            test('uitestutils.js', false);
            test('uitest/some.js', false);
            test('uitest.js/some.js', false);
            // Note: This test is required for our CI, as we load every file of uitest.js individually!
            test('simpleRequire.js', true);
        });
    });
});