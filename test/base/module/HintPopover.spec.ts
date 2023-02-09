/**
 * HintPopover.spec.js
 * (c) 2015~ Summernote Team
 * summernote may be freely distributed under the MIT license./
 */
import chai from 'chai';
import chaidom from 'test/chaidom';
import Context from 'src/js/Context';
import range from 'src/js/core/range';
import {Options} from 'src/js/core/types';
import env from 'src/js/core/env';
import key from 'src/js/core/key';
import 'src/styles/bs4/summernote-bs4';
import spies from "chai-spies";
import Summernote from "src/js/class";
import Editor from "src/js/module/Editor";
import func from "src/js/core/func";

chai.use(chaidom);
chai.use(spies);

describe('HintPopover', () => {
    const expect = chai.expect;
    let noteEl: HTMLElement;
    let editor: Editor;
    let context: Context;
    let editableEl: HTMLElement;

    function expectContents(context: Context, markup: string) {
        expect(context.layoutInfo.editableEl.innerHTML).to.equalsIgnoreCase(markup);
    }

    describe('Single word hint', () => {
        beforeEach(function() {
            document.body.innerHTML = ''; // important !
            noteEl = func.makeElement('<div><p>hello world</p></div>');
            document.body.appendChild(noteEl);

            const options = {
                ...Summernote.meta.options,
                hint: {
                    mentions: ['jayden', 'sam', 'alvin', 'david'],
                    match: /\B#(\w*)$/,
                    search: function(keyword, callback) {
                        callback(this.mentions.filter(function(item: string) {
                            return item.indexOf(keyword) === 0;
                        }));
                    },
                    content: function(item) {
                        return '#' + item;
                    },
                },
            } as Options;

            context = new Context(noteEl, options);
            editor = context.modules.editor as Editor;
            editableEl = context.layoutInfo.editableEl;

            // [workaround]
            //  - Safari does not popup hintpopover
            //  - IE8-11 can't create range in headless mode
            if (env.isMSIE || env.isSafari) {
                this.skip();
            }
        });

        it('should not be shown without matches', () => {
            editableEl.dispatchEvent(new Event('keyup'));
            expect(document.querySelector<HTMLElement>('.note-hint-popover').style.display).to.equals('none');
        });

        it('should be shown when it matches the given condition', (done) => {
            const textNode = editableEl.querySelector('p').firstChild;
            editor.setLastRange(range.create(textNode, 5, textNode, 5).select());
            editor.insertText(' #');
            editableEl.dispatchEvent(new Event('keyup'));

            setTimeout(() => {
                expect(document.querySelector<HTMLElement>('.note-hint-popover').style.display).to.equals('block');
                done();
            }, 10);
        });

        it('should select the best matched item with the given condition', (done) => {
            const textNode = editableEl.querySelector('p').firstChild;
            editor.setLastRange(range.create(textNode, 5, textNode, 5).select());
            editor.insertText(' #al');
            editableEl.dispatchEvent(new Event('keyup'));

            setTimeout(() => {
                // alvin should be activated
                const itemEl = document.querySelector('.note-hint-popover .note-hint-item');
                expect(itemEl.textContent).to.equals('alvin');
                expect(itemEl.classList.contains('active')).to.be.true;
                done();
            }, 10);
        });

        it('should be replaced with the selected hint', (done) => {
            const textNode = editableEl.querySelector('p').firstChild;
            editor.setLastRange(range.create(textNode, 5, textNode, 5).select());
            editor.insertText(' #');
            editableEl.dispatchEvent(new Event('keyup'));

            const onChange = chai.spy();
            noteEl.addEventListener('summernote.change', onChange);

            setTimeout(() => {
                noteEl.dispatchEvent(new CustomEvent('summernote.keydown', {
                    detail: [new KeyboardEvent('keydown', {keyCode: key.code.ENTER})],
                }));

                setTimeout(() => {
                    expectContents(context, '<p>hello #jayden world</p>');
                    expect(onChange).to.have.been.called.once;
                    done();
                }, 10);
            }, 10);
        });

        it('should move selection by pressing arrow key', (done) => {
            const textNode = editableEl.querySelector('p').firstChild;
            editor.setLastRange(range.create(textNode, 5, textNode, 5).select());
            editor.insertText(' #');
            editableEl.dispatchEvent(new Event('keyup'));

            setTimeout(() => {
                noteEl.dispatchEvent(new CustomEvent('summernote.keydown', {
                    detail: [new KeyboardEvent('keydown', {keyCode: key.code.DOWN})],
                }));
                noteEl.dispatchEvent(new CustomEvent('summernote.keydown', {
                    detail: [new KeyboardEvent('keydown', {keyCode: key.code.ENTER})],
                }));

                setTimeout(() => {
                    expectContents(context, '<p>hello #sam world</p>');
                    done();
                }, 10);
            }, 10);
        });
    });

    describe('Multiple words hint', () => {
        beforeEach(function() {
            document.body.innerHTML = ''; // important !
            noteEl = func.makeElement('<div><p>hello world</p></div>');
            document.body.appendChild(noteEl);

            const options = {
                ...Summernote.meta.options,
                hintMode: 'words',
                hintSelect: 'next',
                hint: {
                    mentions: [
                        {
                            name: 'Jayden Smith',
                            url: 'http://example.org/person/jayden-smith',
                        },
                        {
                            name: 'Peter Pan',
                            url: 'http://example.org/person/peter-pan',
                        },
                        {
                            name: 'Lorca',
                            url: 'http://example.org/person/lorca',
                        },
                        {
                            name: 'David Summer',
                            url: 'http://example.org/person/david-summer',
                        },
                    ],
                    match: /\B@([a-z ]*)/i,
                    search: function(keyword, callback) {
                        callback(this.mentions.filter(function(item: {name: string; url: string}) {
                            return item.name.toLowerCase().indexOf(keyword.toLowerCase()) === 0;
                        }));
                    },
                    template: function(item) {
                        return item.name;
                    },
                    content: function(item) {
                        const anchor: HTMLAnchorElement = func.makeElement('<a></a>');

                        anchor.href = item.url;
                        anchor.textContent = '@' + item.name;

                        return anchor;
                    },
                },
            } as Options;

            context = new Context(noteEl, options);
            editor = context.modules.editor as Editor;
            editableEl = context.layoutInfo.editableEl;

            // [workaround]
            //  - Safari does not popup hintpopover
            //  - IE8-11 can't create range in headless mode
            if (env.isMSIE || env.isSafari) {
                this.skip();
            }
        });

        it('should select the best matched item with the given condition', (done) => {
            const textNode = editableEl.querySelector('p').firstChild;
            editor.setLastRange(range.create(textNode, 5, textNode, 5).select());
            editor.insertText(' @David S');
            editableEl.dispatchEvent(new Event('keyup'));

            setTimeout(() => {
                // David Summer should be activated
                const itemEl = document.querySelector('.note-hint-popover .note-hint-item');
                expect(itemEl.textContent).to.equals('David Summer');
                expect(itemEl.classList.contains('active')).to.be.true;
                done();
            }, 10);
        });

        it('should render hint result with given content', (done) => {
            const textNode = editableEl.querySelector('p').firstChild;
            editor.setLastRange(range.create(textNode, 5, textNode, 5).select());
            editor.insertText(' @David S');
            editableEl.dispatchEvent(new Event('keyup'));

            setTimeout(() => {
                // alvin should be activated
                noteEl.dispatchEvent(new CustomEvent('summernote.keydown', {
                    detail: [new KeyboardEvent('keydown', {keyCode: key.code.ENTER})],
                }));

                setTimeout(() => {
                    expectContents(context, '<p>hello <a href="http://example.org/person/david-summer">@David Summer</a> world</p>');
                    done();
                }, 10);
            }, 10);
        });
    });
});
