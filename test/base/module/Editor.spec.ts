/**
 * Editor.spec.js
 * (c) 2015~ Summernote Team
 * summernote may be freely distributed under the MIT license./
 */

import chai from 'chai';
import spies from 'chai-spies';
import chaidom from 'test/chaidom';
import env from 'src/js/core/env';
import range from 'src/js/core/range';
import Context from 'src/js/Context';
import 'src/styles/bs5/summernote-bs5';
import Summernote from "src/js/class";
import Editor from "src/js/module/Editor";
import func from "src/js/core/func";

describe('Editor', () => {
    const expect = chai.expect;
    chai.use(spies);
    chai.use(chaidom);

    let editor: Editor;
    let context: Context;
    let editableEl: HTMLElement;

    function expectContents(context: Context, markup: string) {
        expect(context.layoutInfo.editableEl.innerHTML).to.equalsIgnoreCase(markup);
    }

    function expectContentsChain(context: Context, markup: string, next: () => void) {
        setTimeout(() => {
            expect(context.layoutInfo.editableEl.innerHTML).to.equalsIgnoreCase(markup);
            next();
        }, 10);
    }

    function expectContentsAwait(context: Context, markup: string, done: DoneFn) {
        expect(context.layoutInfo.editableEl.innerHTML).await(done).to.equalsIgnoreCase(markup);
    }

    function expectToHaveBeenCalled(context: Context, customEvent: string, handler: () => void) {
        const noteEl = context.layoutInfo.noteEl;
        const spy = chai.spy();
        noteEl.addEventListener(customEvent, spy);
        handler();
        expect(spy).to.have.been.called();
    }

    beforeEach(function() {
        document.body.innerHTML = ''; // important !
        const options = {...Summernote.meta.options};
        options.historyLimit = 5;
        context = new Context(func.makeElement('<div><p>hello</p></div>'), options);

        editor = context.modules.editor as Editor;
        editableEl = context.layoutInfo.editableEl;

        // [workaround]
        //  - IE8-11 can't create range in headless mode
        if (env.isMSIE) {
            this.skip();
        }
    });

    describe('initialize', () => {
        it('should bind custom events', (done) => {
            [
                'keydown', 'keyup', 'blur', 'mousedown', 'mouseup', 'scroll', 'focusin', 'focusout',
            ].forEach((eventName) => {
                expectToHaveBeenCalled(context, 'summernote.' + eventName, () => {
                    editableEl.dispatchEvent(new Event(eventName));
                });
            });

            expectToHaveBeenCalled(context, 'summernote.change', () => {
                editor.insertText('hello');
                done();
            });
        });
    });

    describe('undo and redo', () => {
        it('should control history', (done) => {
            editor.insertText(' world');
            setTimeout(() => {
                expectContents(context, '<p>hello world</p>');
                editor.undo();
                setTimeout(() => {
                    expectContents(context, '<p>hello</p>');
                    editor.redo();
                    setTimeout(() => {
                        expectContents(context, '<p>hello world</p>');
                        done();
                    }, 10);
                }, 10);
            }, 10);
        });

        it('should be limited by option.historyLimit value', (done) => {
            editor.insertText(' world');
            editor.insertText(' world');
            editor.insertText(' world');
            editor.insertText(' world');
            editor.insertText(' world');
            setTimeout(() => {
                expectContents(context, '<p>hello world world world world world</p>');
                editor.undo();
                editor.undo();
                editor.undo();
                setTimeout(() => {
                    expectContents(context, '<p>hello world world</p>');
                    editor.undo();
                    editor.undo();
                    editor.undo();
                    setTimeout(() => {
                        expectContents(context, '<p>hello world</p>');
                        done();
                    }, 10);
                }, 10);
            }, 10);
        });
    });

    describe('tab', () => {
        it('should insert tab', (done) => {
            editor.tab();
            expectContentsAwait(context, '<p>hello&nbsp;&nbsp;&nbsp;&nbsp;</p>', done);
        });
    });

    describe('insertParagraph', () => {
        it('should insert paragraph', (done) => {
            editor.insertParagraph();
            setTimeout(() => {
                expectContents(context, '<p>hello</p><p><br></p>');
                editor.insertParagraph();
                setTimeout(() => {
                    expectContents(context, '<p>hello</p><p><br></p><p><br></p>');
                    done();
                }, 10);
            }, 10);
        });
    });

    describe('insertImage', () => {
        it('should insert image', () => {
            const source = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAGCAYAAADgzO9IAAAAF0lEQVQYGWP8////fwYsgAmLGFiIHhIAT+oECGHuN2UAAAAASUVORK5CYII=';
            return editor.insertImage(source, 'image').then(() => {
                expect(editableEl.querySelector('img').getAttribute('src')).to.equalsIgnoreCase(source);
            });
        });
    });

    describe('insertOrderedList and insertUnorderedList', () => {
        it('should toggle paragraph to list', (done) => {
            editor.insertOrderedList();
            expectContentsChain(context, '<ol><li>hello</li></ol>', () => {
                editor.insertUnorderedList();
                expectContentsChain(context, '<ul><li>hello</li></ul>', () => {
                    editor.insertUnorderedList();
                    expectContentsChain(context, '<p>hello</p>', () => {
                        done();
                    });
                });
            });
        });
    });

    describe('indent and outdent', () => {
        // [workaround] style is different by browser
        it('should indent and outdent paragraph', (done) => {
            editor.indent();
            expectContentsChain(context, '<p style="margin-left: 25px;">hello</p>', () => {
                editor.outdent();
                expect(editableEl.querySelector('p').style.marginLeft).await(done).to.be.empty;
            });
        });

        it('should indent and outdent list', (done) => {
            editor.insertOrderedList();
            expectContentsChain(context, '<ol><li>hello</li></ol>', () => {
                editor.indent();
                expectContentsChain(context, '<ol><li><ol><li>hello</li></ol></li></ol>', () => {
                    editor.indent();
                    expectContentsChain(context, '<ol><li><ol><li><ol><li>hello</li></ol></li></ol></li></ol>', () => {
                        editor.outdent();
                        expectContentsChain(context, '<ol><li><ol><li>hello</li></ol></li></ol>', () => {
                            editor.outdent();
                            expectContentsChain(context, '<ol><li>hello</li></ol>', () => {
                                done();
                            });
                        });
                    });
                });
            });
        });
    });

    describe('setLastRange', () => {
        it('should set last range', (done) => {
            document.body.click();
            editor.setLastRange();

            expect(editor.lastRange.sc).await(done).to.equal(editor.editableEl.lastChild);
        });

        it('should set last range without content', (done) => {
            context.layoutInfo.editableEl.innerHTML = '';
            document.body.click();
            editor.setLastRange();

            expect(editor.lastRange.sc).await(done).to.equal(editor.editableEl);
        });
    });

    describe('insertNode', () => {
        it('should insert node', (done) => {
            editor.insertNode(func.makeElement('<span> world</span>'));
            expectContentsAwait(context, '<p>hello<span> world</span></p>', done);
        });

        it('should be limited', (done) => {
            const options = {...Summernote.meta.options};
            options.maxTextLength = 5;
            context = new Context(func.makeElement('<div><p>hello</p></div>'), options);
            editor = context.modules.editor as Editor;

            editor.insertNode(func.makeElement('<span> world</span>'));
            expectContentsAwait(context, '<p>hello</p>', done);
        });

        it('should insert node in last focus', (done) => {
            document.body.appendChild(editableEl);
            context.invoke('editor.focus');

            setTimeout(() => {
                const textNode = editableEl.querySelector('p').firstChild;
                editor.setLastRange(range.create(textNode, 0, textNode, 0).select());

                setTimeout(() => {
                    editor.insertNode(func.makeElement('<span> world</span>'));
                    setTimeout(() => {
                        document.body.focus();
                        editor.insertNode(func.makeElement('<span> hello</span>'));
                        setTimeout(() => {
                            expectContentsAwait(context, '<p><span> world</span><span> hello</span>hello</p>', done);
                        }, 10);
                    }, 10);
                }, 10);
            }, 10);
        });
    });

    describe('insertText', () => {
        it('should insert text', (done) => {
            editor.insertText(' world');
            expectContentsAwait(context, '<p>hello world</p>', done);
        });

        it('should be limited', (done) => {
            const options = {...Summernote.meta.options};
            options.maxTextLength = 5;
            context = new Context(func.makeElement('<div><p>hello</p></div>'), options);
            editor = context.modules.editor as Editor;

            editor.insertText(' world');
            expectContentsAwait(context, '<p>hello</p>', done);
        });

        it('should insert text in last focus', (done) => {
            document.body.appendChild(editableEl);
            context.invoke('editor.focus');

            const textNode = editableEl.querySelector('p').firstChild;
            editor.setLastRange(range.create(textNode, 0, textNode, 0).select());

            setTimeout(() => {
                editor.insertText(' world');
                setTimeout(() => {
                    document.body.focus();
                    setTimeout(() => {
                        editor.insertText(' summernote');
                        setTimeout(() => {
                            expectContentsAwait(context, '<p> world summernotehello</p>', done);
                        }, 10);
                    }, 10);
                }, 10);
            }, 10);
        });
    });

    describe('pasteHTML', () => {
        it('should paste html', (done) => {
            editor.pasteHTML('<span> world</span>');
            expectContentsAwait(context, '<p>hello<span> world</span></p>', done);
        });

        it('should not add empty paragraph when pasting paragraphs', (done) => {
            editor.pasteHTML('<p><span>whatever</span><br></p><p><span>it has</span><br></p>');
            expectContentsAwait(context, '<p>hello</p><p><span>whatever</span><br></p><p><span>it has</span><br></p>', done);
        });

        it('should not add empty paragraph when pasting a node that is not isInline', (done) => {
            editor.pasteHTML('<ul><li>list</li></ul><hr><p>paragraph</p><table><tr><td>table</td></tr></table><p></p><blockquote>blockquote</blockquote><data>data</data>');
            expectContentsAwait(context, '<p>hello</p><ul><li>list</li></ul><hr><p>paragraph</p><table><tbody><tr><td>table</td></tr></tbody></table><p></p><blockquote>blockquote</blockquote><data>data</data>', done);
        });

        it('should not call change event more than once per paste event', () => {
            const generateLargeHtml = () => {
                let html = '<div>';
                for (let i = 0; i < 1000; i++) {
                    html += '<p>HTML element #' + i + '</p>';
                }
                html += '</div>';
                return html;
            };
            const noteEl = context.layoutInfo.noteEl;
            const spy = chai.spy();
            noteEl.addEventListener('summernote.change', spy);
            const html = generateLargeHtml();
            editor.pasteHTML(html);
            expect(spy).to.have.been.called.once;
        });

        it('should be limited', (done) => {
            const options = {...Summernote.meta.options};
            options.maxTextLength = 5;
            context = new Context(func.makeElement('<div><p>hello</p></div>'), options);
            editor = context.modules.editor as Editor;

            editor.pasteHTML('<span> world</span>');
            expectContentsAwait(context, '<p>hello</p>', done);
        });
    });

    describe('insertHorizontalRule', () => {
        it('should insert horizontal rule', (done) => {
            editor.insertHorizontalRule();
            expectContentsAwait(context, '<p>hello</p><hr><p><br></p>', done);
        });
    });

    describe('insertTable', () => {
        it('should insert table', (done) => {
            const markup = [
                '<p>hello</p>',
                '<table class="table table-bordered"><tbody>',
                '<tr><td><br></td><td><br></td></tr>',
                '<tr><td><br></td><td><br></td></tr>',
                '</tbody></table>',
                '<p><br></p>',
            ].join('');
            editor.insertTable('2x2');
            expectContentsAwait(context, markup, done);
        });
    });

    describe('empty', () => {
        it('should make contents empty', (done) => {
            editor.empty();
            expect(editor.isEmpty()).await(done).to.be.true;
        });
    });

    describe('styleWithCSS', () => {
        it('should style with tag when it is false (default)', (done) => {
            document.body.appendChild(editableEl);
            range.createFromNode(editableEl.querySelector('p')).normalize().select();
            editor.bold();
            expectContentsAwait(context, '<p><b>hello</b></p>', done);
        });

        it('should style with CSS when it is true', (done) => {
            const options = {...Summernote.meta.options};
            options.styleWithCSS = true;

            document.body.innerHTML = '';

            const divEl = func.makeElement('<div><p>hello</p></div>');
            document.body.appendChild(divEl);

            context = new Context(divEl, options);
            editor = context.modules.editor as Editor;
            editableEl = context.layoutInfo.editableEl;
            document.body.appendChild(editableEl);

            range.createFromNode(editableEl.querySelector('p')).normalize().select();
            editor.bold();
            expectContentsAwait(context, '<p><span style="font-weight: bold;">hello</span></p>', done);
        });
    });

    describe('formatBlock', () => {
        it('should apply formatBlock', (done) => {
            document.body.appendChild(editableEl);

            const textNode = editableEl.querySelector('p').firstChild;
            editor.setLastRange(range.create(textNode, 0, textNode, 0).select());

            setTimeout(() => {
                editor.formatBlock('h1');
                expectContentsAwait(context, '<h1>hello</h1>', done);
            }, 10);
        });

        it('should toggle all paragraph even with empty paragraph', (done) => {
            const codes = [
                '<p><br></p>',
                '<p>endpoint</p>',
            ];

            context.invoke('code', codes.join(''));
            document.body.appendChild(editableEl);

            const pEls: HTMLElement[] = [].slice.call(editableEl.querySelectorAll('p'));

            const startNode = pEls[0];
            const endNode = pEls[pEls.length - 1];

            // all p tags is wrapped
            range.create(startNode, 0, endNode, 1).normalize().select();

            editor.insertUnorderedList();
            expectContentsAwait(context, '<ul><li><br></li><li>endpoint</li></ul>', done);
        });

        it('should apply multi formatBlock', (done) => {
            const codes = [
                '<p><a href="http://summernote.org">hello world</a></p>',
                '<p><a href="http://summernote.org">hello world</a></p>',
                '<p><a href="http://summernote.org">hello world</a></p>',
            ];

            context.invoke('code', codes.join(''));
            document.body.appendChild(editableEl);

            const pEls: HTMLElement[] = [].slice.call(editableEl.querySelectorAll('p'));

            const startNode = pEls[0];
            const endNode = pEls[pEls.length - 1];

            // all p tags is wrapped
            range.create(startNode, 0, endNode, 1).normalize().select();

            editor.formatBlock('h3');

            const nodeName = editableEl.firstChild.nodeName;
            expect(nodeName).to.equalsIgnoreCase('h3');

            // p -> h3, p is none
            expect(editableEl.querySelectorAll('p').length).await(done).to.equals(0);
        });

        it('should apply custom className in formatBlock', (done) => {
            const targetEl = func.makeElement('<h4 class="customH4Class"></h4>');
            document.body.appendChild(editableEl);
            range.createFromNode(editableEl.querySelector('p')).normalize().select();
            editor.formatBlock('h4', targetEl);

            // start <p>hello</p> => <h4 class="h4">hello</h4>
            expectContentsAwait(context, '<h4 class="customH4Class">hello</h4>', done);
        });

        it('should find exact target in formatBlock', (done) => {
            const targetEl = func.makeElement('<a class="dropdown-item" href="#" data-value="h6" role="listitem" aria-label="h6"><h6 class="customH6Class">H6</h6></a>');
            document.body.appendChild(editableEl);
            range.createFromNode(editableEl.querySelector('p')).normalize().select();
            editor.formatBlock('h6', targetEl);

            // start <p>hello</p> => <h6 class="h6">hello</h6>
            expectContentsAwait(context, '<h6 class="customH6Class">hello</h6>', done);
        });

        it('should replace existing class in formatBlock if target has class', (done) => {
            const target1El = func.makeElement('<p class="old"></p>');
            document.body.appendChild(editableEl);
            range.createFromNode(editableEl.querySelector('p')).normalize().select();
            editor.formatBlock('p', target1El);
            const target2El = func.makeElement('<p class="new"></p>');
            editor.formatBlock('p', target2El);

            // start <p class="old">hello</p> => <p class="new">hello</p>
            expectContentsAwait(context, '<p class="new">hello</p>', done);
        });

        it('should remove existing class in formatBlock if target has no class', (done) => {
            const target1El = func.makeElement('<p class="customClass" />');
            document.body.appendChild(editableEl);
            range.createFromNode(editableEl.querySelector('p')).normalize().select();
            editor.formatBlock('p', target1El);
            const target2El = func.makeElement('<p />');
            editor.formatBlock('p', target2El);

            // start <p class="customClass">hello</p> => <p>hello</p>
            expectContentsAwait(context, '<p class="">hello</p>', done);
        });

        it('should add fontSize to block', (done) => {
            document.body.appendChild(editableEl);
            context.invoke('editor.focus');

            setTimeout(() => {
                const textNode = editableEl.querySelector('p').firstChild;
                editor.setLastRange(range.create(textNode, 0, textNode, 0).select());

                setTimeout(() => {
                    editor.fontSize(20);
                    expectContents(context, '<p><span style="font-size: 20px;">﻿</span>hello</p>');
                    done();
                });
            });
        });
    });

    describe('createLink', () => {
        it('should create normal link', (done) => {
            const text = 'hello';
            const pNode = editableEl.querySelector('p');
            const textNode = pNode.childNodes[0] as Text;
            const startIndex = textNode.wholeText.indexOf(text);
            const endIndex = startIndex + text.length;

            range.create(textNode, startIndex, textNode, endIndex).normalize().select();

            // check creation normal link
            editor.createLink({
                url: 'http://summernote.org',
                text: 'summernote',
            });

            expectContentsAwait(context, '<p>hello<a href="http://summernote.org">summernote</a></p>', done);
        });

        it('should create a link with range', (done) => {
            const text = 'hello';
            const pNode = editableEl.querySelector('p');
            const textNode = pNode.childNodes[0] as Text;
            const startIndex = textNode.wholeText.indexOf(text);
            const endIndex = startIndex + text.length;

            const rng = range.create(textNode, startIndex, textNode, endIndex);

            editor.createLink({
                url: 'http://summernote.org',
                text: 'summernote',
                range: rng,
            });

            expectContentsAwait(context, '<p><a href="http://summernote.org">summernote</a></p>', done);
        });

        it('should create a link with isNewWindow', (done) => {
            const text = 'hello';
            const pNode = editableEl.querySelector('p');
            const textNode = pNode.childNodes[0] as Text;
            const startIndex = textNode.wholeText.indexOf(text);
            const endIndex = startIndex + text.length;

            const rng = range.create(textNode, startIndex, textNode, endIndex);

            editor.createLink({
                url: 'http://summernote.org',
                text: 'summernote',
                range: rng,
                isNewWindow: true,
            });

            expectContentsAwait(context, '<p><a href="http://summernote.org" target="_blank">summernote</a></p>', done);
        });

        it('should create a relative link without scheme', (done) => {
            const text = 'hello';
            const pNode = editableEl.querySelector('p');
            const textNode = pNode.childNodes[0] as Text;
            const startIndex = textNode.wholeText.indexOf(text);
            const endIndex = startIndex + text.length;

            const rng = range.create(textNode, startIndex, textNode, endIndex);

            editor.createLink({
                url: '/relative/url',
                text: 'summernote',
                range: rng,
                isNewWindow: true,
            });

            expectContentsAwait(context, '<p><a href="/relative/url" target="_blank">summernote</a></p>', done);
        });

        it('should modify a link', (done) => {
            context.invoke('code', '<p><a href="http://summernote.org">hello world</a></p>');

            const anchorNode = editableEl.querySelector('a');
            const rng = range.createFromNode(anchorNode);

            editor.createLink({
                url: 'http://wow.summernote.org',
                text: 'summernote wow',
                range: rng,
            });

            expectContentsAwait(context, '<p><a href="http://wow.summernote.org">summernote wow</a></p>', done);
        });

        it('should be limited when creating a link', (done) => {
            const options = {...Summernote.meta.options};
            options.maxTextLength = 5;
            context = new Context(func.makeElement('<div><p>hello</p></div>'), options);
            editor = context.modules.editor as Editor;

            editor.createLink({
                url: 'http://summernote.org',
                text: 'summernote',
            });
            expectContentsAwait(context, '<p>hello</p>', done);
        });

        it('should be limited when modifying a link', (done) => {
            const options = {...Summernote.meta.options};
            options.maxTextLength = 5;
            context = new Context(func.makeElement('<p><a href="http://summernote.org">hello</a></p>'), options);

            const editableEl = context.layoutInfo.editableEl;
            const anchorNode = editableEl.querySelector('a');
            const rng = range.createFromNode(anchorNode);
            editor = context.modules.editor as Editor;

            editor.createLink({
                url: 'http://summernote.org',
                text: 'hello world',
                range: rng,
            });

            expectContentsAwait(context, '<a href="http://summernote.org">hello</a>', done);
        });
    });
});
