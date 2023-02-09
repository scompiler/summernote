/**
 * range.spec.js
 * (c) 2013~ Alan Hong
 * summernote may be freely distributed under the MIT license./
 */

import chai from 'chai';
import chaidom from 'test/chaidom';
import dom from 'src/js/core/dom';
import range from 'src/js/core/range';
import func from "src/js/core/func";

const expect = chai.expect;
chai.use(chaidom);

describe('base:core.range', () => {
    describe('nodes', () => {
        describe('1 depth', () => {
            let paraEls: HTMLElement[];

            before(() => {
                const contEl = func.makeElement('<div class="note-editable"><p>para1</p><p>para2</p></div>');
                paraEls = [].slice.call(contEl.querySelectorAll('p')) as HTMLElement[];
            });

            it('should return array of two paragraphs', () => {
                const rng = range.create(paraEls[0].firstChild, 0, paraEls[1].firstChild, 1);
                expect(rng.nodes(dom.isPara, { includeAncestor: true })).to.have.length(2);
            });

            it('should return array of a paragraph', () => {
                const rng = range.create(paraEls[0].firstChild, 0, paraEls[0].firstChild, 0);
                expect(rng.nodes(dom.isPara, { includeAncestor: true })).to.have.length(1);
            });
        });

        describe('multi depth', () => {
            it('should return array of a paragraph', () => {
                const contEl = func.makeElement('<div class="note-editable"><p>p<b>ar</b>a1</p><p>para2</p></div>');
                const bEls = [].slice.call(contEl.querySelectorAll('b')) as HTMLElement[];
                const rng = range.create(bEls[0].firstChild, 0, bEls[0].firstChild, 0);

                expect(rng.nodes(dom.isPara, { includeAncestor: true })).to.have.length(1);
            });
        });

        describe('on list, on heading', () => {
            it('should return array of list paragraphs', () => {
                const contEl = func.makeElement('<div class="note-editable"><ul><li>para1</li><li>para2</li></ul></div>');
                const liEls = [].slice.call(contEl.querySelectorAll('li')) as HTMLElement[];
                const rng = range.create(liEls[0].firstChild, 0, liEls[1].firstChild, 1);

                expect(rng.nodes(dom.isPara, { includeAncestor: true })).to.have.length(2);
            });

            it('should return array of list paragraphs', () => {
                const contEl = func.makeElement('<div class="note-editable"><h1>heading1</h1><h2>heading2</h2></div>');
                const h1El = contEl.querySelector('h1');
                const h2El = contEl.querySelector('h2');
                const rng = range.create(h1El.firstChild, 0, h2El.firstChild, 1);

                expect(rng.nodes(dom.isPara, { includeAncestor: true })).to.have.length(2);
            });
        });
    });

    describe('commonAncestor', () => {
        let contEl: HTMLElement;
        before(() => {
            contEl = func.makeElement('<div><span><b>b</b><u>u</u></span></div>');
        });

        it('should return <span> for <b>|b</b> and <u>u|</u>', () => {
            const spanEl = contEl.querySelector('span');
            const bEl = contEl.querySelector('b');
            const uEl = contEl.querySelector('u');

            const rng = range.create(bEl.firstChild, 0, uEl.firstChild, 1);
            expect(rng.commonAncestor()).to.deep.equal(spanEl);
        });

        it('should return b(#textNode) for <b>|b|</b>', () => {
            const bEl = contEl.querySelector('b');

            const rng = range.create(bEl.firstChild, 0, bEl.firstChild, 1);
            expect(rng.commonAncestor()).to.deep.equal(bEl.firstChild);
        });
    });

    describe('expand', () => {
        it('should return <b>|b</b> ~ <u>u|</u> for <b>|b</b> with isAnchor', () => {
            const contEl = func.makeElement('<div><a><b>b</b><u>u</u></a></div>');
            const anchorEl = contEl.querySelector('a');
            const bEl = contEl.querySelector('b');

            const rng = range.create(bEl.firstChild, 0, bEl.firstChild, 0).expand(dom.isAnchor);
            expect(rng.sc).to.deep.equal(anchorEl);
            expect(rng.so).to.equal(0);
            expect(rng.ec).to.deep.equal(anchorEl);
            expect(rng.eo).to.equal(2);
        });
    });

    describe('collapse', () => {
        it('should return <u>u|</u> for <b>|b</b> ~ <u>u|</u>', () => {
            const contEl = func.makeElement('<div><b>b</b><u>u</u></div>');
            const bEl = contEl.querySelector('b');
            const uEl = contEl.querySelector('u');

            const rng = range.create(bEl.firstChild, 0, uEl.firstChild, 1).collapse();
            expect(rng.sc).to.deep.equal(uEl.firstChild);
            expect(rng.so).to.equal(1);
            expect(rng.ec).to.deep.equal(uEl.firstChild);
            expect(rng.eo).to.equal(1);
        });
    });

    describe('normalize', () => {
        let contEl: HTMLElement;
        before(() => {
            contEl = func.makeElement('<div><p><b>b</b><u>u</u><s>s</s></p></div>');
        });

        it('should return <b>|b</b> ~ <u>u|</u> for |<b>b</b> ~ <u>u</u>|', () => {
            const pEl = contEl.querySelector('p');
            const bEl = contEl.querySelector('b');
            const uEl = contEl.querySelector('u');

            const rng = range.create(pEl, 0, pEl, 2).normalize();
            expect(rng.sc).to.deep.equal(bEl.firstChild);
            expect(rng.so).to.equal(0);
            expect(rng.ec).to.deep.equal(uEl.firstChild);
            expect(rng.eo).to.equal(1);
        });

        it('should return <b>b|</b><u>u</u> for <b>b</b>|<u>u</u>', () => {
            const pEl = contEl.querySelector('p');
            const bEl = contEl.querySelector('b');

            const rng = range.create(pEl, 1, pEl, 1).normalize();
            expect(rng.sc).to.deep.equal(bEl.firstChild);
            expect(rng.so).to.equal(1);
            expect(rng.ec).to.deep.equal(bEl.firstChild);
            expect(rng.eo).to.equal(1);
        });

        it('should return <b>b</b><u>|u|</u><s>s</s> for <b>b|</b><u>u</u><s>|s</s>', () => {
            const bEl = contEl.querySelector('b');
            const uEl = contEl.querySelector('u');
            const sEl = contEl.querySelector('s');

            const rng = range.create(bEl.firstChild, 1, sEl.firstChild, 0).normalize();
            expect(rng.sc).to.deep.equal(uEl.firstChild);
            expect(rng.so).to.equal(0);
            expect(rng.ec).to.deep.equal(uEl.firstChild);
            expect(rng.eo).to.equal(1);
        });

        it('should return <b>b|</b><u>u</u><s>s</s> for <b>b|</b><u>u</u><s>s</s>', () => {
            const bEl = contEl.querySelector('b');

            const rng = range.create(bEl.firstChild, 1, bEl.firstChild, 1).normalize();
            expect(rng.sc).to.deep.equal(bEl.firstChild);
            expect(rng.so).to.equal(1);
            expect(rng.ec).to.deep.equal(bEl.firstChild);
            expect(rng.eo).to.equal(1);
        });
    });

    describe('normalize (block mode)', () => {
        it('should return <p>text</p><p>|<br></p> for <p>text</p><p>|<br></p>', () => {
            const contEl = func.makeElement('<div><p>text</p><p><br></p></div>');
            const pEl = [].slice.call(contEl.querySelectorAll('p')) as HTMLElement[];

            const rng = range.create(pEl[1], 0, pEl[1], 0).normalize();
            expect(rng.sc).to.deep.equal(pEl[1]);
            expect(rng.so).to.equal(0);
            expect(rng.ec).to.deep.equal(pEl[1]);
            expect(rng.eo).to.equal(0);
        });

        it('should return <p>text</p><p>|text</p> for <p>text</p><p>|text</p>', () => {
            const contEl = func.makeElement('<div><p>text</p><p>text</p></div>');
            const pEl = [].slice.call(contEl.querySelectorAll('p')) as HTMLElement[];

            const rng = range.create(pEl[1], 0, pEl[1], 0).normalize();
            expect(rng.sc).to.deep.equal(pEl[1].firstChild);
            expect(rng.so).to.equal(0);
            expect(rng.ec).to.deep.equal(pEl[1].firstChild);
            expect(rng.eo).to.equal(0);
        });

        it('should return <p>|text</p><p>text|</p> for |<p>text</p><p>text</p>|', () => {
            const contEl = func.makeElement('<div class="note-editable"><p>text</p><p>text</p></div>');
            const pEl = [].slice.call(contEl.querySelectorAll('p')) as HTMLElement[];

            const rng = range.create(contEl, 0, contEl, 2).normalize();
            expect(rng.sc).to.deep.equal(pEl[0].firstChild);
            expect(rng.so).to.equal(0);
            expect(rng.ec).to.deep.equal(pEl[1].firstChild);
            expect(rng.eo).to.equal(4);
        });
    });

    describe('normalize (void element)', () => {
        it('should return <p><img>|<b>bold</b></p> for <p><img>|<b>bold</b></p>', () => {
            const contEl = func.makeElement('<div><p><img><b>bold</b></p></div>');
            const pEls = contEl.querySelectorAll('p');
            const bEls = contEl.querySelectorAll('b');

            const rng = range.create(pEls[0], 1, pEls[0], 1).normalize();
            expect(rng.sc).to.deep.equal(bEls[0].firstChild);
            expect(rng.so).to.equal(0);
            expect(rng.ec).to.deep.equal(bEls[0].firstChild);
            expect(rng.eo).to.equal(0);
        });

        it('should return <p><img>|text></p> for <p><img>|text></p>', () => {
            const contEl = func.makeElement('<div><p><img>bold</p></div>');
            const imgEls = contEl.querySelectorAll('img');
            const text = imgEls[0].nextSibling;

            const rng = range.create(text, 0, text, 0).normalize();
            expect(rng.sc).to.equal(text);
            expect(rng.so).to.equal(0);
            expect(rng.isCollapsed()).to.true;
        });
    });

    describe('insertNode', () => {
        it('should split paragraph when inserting a block element', () => {
            const contEl = func.makeElement('<div class="note-editable"><p><b>bold</b></p></div>');
            const bEl = contEl.querySelector('b');
            const p2el = func.makeElement('<p>p</p>');

            const rng = range.create(bEl.firstChild, 2, bEl.firstChild, 2);
            rng.insertNode(p2el);

            expect(contEl.innerHTML).to.equalsIgnoreCase('<p><b>bo</b></p><p>p</p><p><b>ld</b></p>');
        });

        it('should not split paragraph when inserting an inline element', () => {
            const contEl = func.makeElement('<div class="note-editable"><p>text</p></div>');
            const pEl = contEl.querySelector('p');
            const uel = func.makeElement('<u>u</u>');

            const rng = range.create(pEl.firstChild, 2, pEl.firstChild, 2);
            rng.insertNode(uel);
            expect(contEl.innerHTML).to.equalsIgnoreCase('<p>te<u>u</u>xt</p>');
        });

        it('should not split paragraph when inserting an inline element case 2', () => {
            const contEl = func.makeElement('<div class="note-editable"><p><b>bold</b></p></div>');
            const bEl = contEl.querySelector('b');
            const uel = func.makeElement('<u>u</u>');

            const rng = range.create(bEl.firstChild, 2, bEl.firstChild, 2);
            rng.insertNode(uel);
            expect(contEl.innerHTML).to.equalsIgnoreCase('<p><b>bo</b><u>u</u><b>ld</b></p>');
        });
    });

    describe('pasteHTML', () => {
        it('should not split a block element when inserting inline elements into it', () => {
            const contEl = func.makeElement('<div class="note-editable"><p>text</p></div>');
            const pEl = contEl.querySelector('p');
            const markup = '<span>span</span><i>italic</i>';

            const rng = range.create(pEl.firstChild, 2);
            rng.pasteHTML(markup);

            expect(contEl.innerHTML).to.equalsIgnoreCase('<p>te<span>span</span><i>italic</i>xt</p>');
        });

        it('should split an inline element when pasting inline elements into it', () => {
            const contEl = func.makeElement('<div class="note-editable"><p><b>bold</b></p></div>');
            const bEl = contEl.querySelector('b');
            const markup = '<span>span</span><i>italic</i>';

            const rng = range.create(bEl.firstChild, 2);
            rng.pasteHTML(markup);

            expect(contEl.innerHTML).to.equalsIgnoreCase('<p><b>bo</b><span>span</span><i>italic</i><b>ld</b></p>');
        });

        it('should split inline node when pasting an inline node and a block node into it', () => {
            const contEl = func.makeElement('<div class="note-editable"><p><b>bold</b></p></div>');
            const bEl = contEl.querySelector('b');
            const markup = '<span>span</span><p><i>italic</i></p>';

            const rng = range.create(bEl.firstChild, 2);
            rng.pasteHTML(markup);

            expect(contEl.innerHTML).to.equalsIgnoreCase('<p><b>bo</b><span>span</span></p><p><i>italic</i></p><p><b>ld</b></p>');
        });
    });

    describe('deleteContents', () => {
        let contEl: HTMLElement;
        let bEl: HTMLElement;
        beforeEach(() => {
            contEl = func.makeElement('<div class="note-editable"><p><b>bold</b><u>u</u></p></div>');
            bEl = contEl.querySelector('b');
        });

        it('should remove text only for partial text', () => {
            const rng = range.create(bEl.firstChild, 1, bEl.firstChild, 3);
            rng.deleteContents();

            expect(contEl.innerHTML).to.equalsIgnoreCase('<p><b>bd</b><u>u</u></p>');
        });

        it('should remove text for entire text', () => {
            const rng = range.create(bEl.firstChild, 0, bEl.firstChild, 4);
            rng.deleteContents();

            expect(contEl.innerHTML).to.equalsIgnoreCase('<p><b></b><u>u</u></p>');
        });
    });

    describe('wrapBodyInlineWithPara', () => {
        it('should insert an empty paragraph when there is no contents', () => {
            const contEl = func.makeElement('<div class="note-editable"></div>');

            const rng = range.create(contEl, 0);
            rng.wrapBodyInlineWithPara();

            expect(contEl.innerHTML).to.equalsIgnoreCase('<p><br></p>');
        });

        it('should wrap text with paragraph for text', () => {
            const contEl = func.makeElement('<div class="note-editable">text</div>');

            const rng = range.create(contEl.firstChild, 2);
            rng.wrapBodyInlineWithPara();

            expect(contEl.innerHTML).to.equalsIgnoreCase('<p>text</p>');
        });

        it('should wrap an inline node with paragraph when selecting text in the inline node', () => {
            const contEl = func.makeElement('<div class="note-editable"><b>bold</b></div>');
            const bEl = contEl.querySelector('b');

            const rng = range.create(bEl.firstChild, 2);
            rng.wrapBodyInlineWithPara();

            expect(contEl.innerHTML).to.equalsIgnoreCase('<p><b>bold</b></p>');
        });

        it('should wrap inline nodes with paragraph when selecting text in the inline nodes', () => {
            const contEl = func.makeElement('<div class="note-editable"><b>b</b><i>i</i></div>');

            const rng = range.create(contEl, 0);
            rng.wrapBodyInlineWithPara();

            expect(contEl.innerHTML).to.equalsIgnoreCase('<p><b>b</b><i>i</i></p>');
        });

        it('should wrap inline nodes with paragraph when selection some of text in the inline nodes #1', () => {
            const contEl = func.makeElement('<div class="note-editable"><b>b</b><i>i</i></div>');

            const rng = range.create(contEl, 1);
            rng.wrapBodyInlineWithPara();

            expect(contEl.innerHTML).to.equalsIgnoreCase('<p><b>b</b><i>i</i></p>');
        });

        it('should wrap inline nodes with paragraph when selection some of text in the inline nodes #2', () => {
            const contEl = func.makeElement('<div class="note-editable"><b>b</b><i>i</i></div>');

            const rng = range.create(contEl, 2);
            rng.wrapBodyInlineWithPara();

            expect(contEl.innerHTML).to.equalsIgnoreCase('<p><b>b</b><i>i</i></p>');
        });
    });

    describe('getWordRange', () => {
        let contEl: HTMLElement;
        before(() => {
            contEl = func.makeElement('<div class="note-editable">super simple wysiwyg editor</div>');
        });

        it('should return the range itself when there is no word before cursor', () => {
            const rng = range.create(contEl.firstChild, 0).getWordRange();

            expect(rng.sc).to.deep.equal(contEl.firstChild);
            expect(rng.so).to.equal(0);
            expect(rng.ec).to.deep.equal(contEl.firstChild);
            expect(rng.eo).to.equal(0);
        });

        it('should return expanded range when there is a word before cursor', () => {
            const rng = range.create(contEl.firstChild, 5).getWordRange();

            expect(rng.sc).to.deep.equal(contEl.firstChild);
            expect(rng.so).to.equal(0);
            expect(rng.ec).to.deep.equal(contEl.firstChild);
            expect(rng.eo).to.equal(5);
        });

        it('should return expanded range when there is a half word before cursor', () => {
            const rng = range.create(contEl.firstChild, 3).getWordRange();

            expect(rng.sc).to.deep.equal(contEl.firstChild);
            expect(rng.so).to.equal(0);
            expect(rng.ec).to.deep.equal(contEl.firstChild);
            expect(rng.eo).to.equal(3);
        });

        it('should return expanded range when there are words before cursor', () => {
            const rng = range.create(contEl.firstChild, 12).getWordRange();

            expect(rng.sc).to.deep.equal(contEl.firstChild);
            expect(rng.so).to.equal(6);
            expect(rng.ec).to.deep.equal(contEl.firstChild);
            expect(rng.eo).to.equal(12);
        });
    });

    describe('getWordsRange', () => {
        let contEl: HTMLElement;
        before(() => {
            contEl = func.makeElement('<div class="note-editable">super &nbsp; simple wysiwyg editor</div>');
        });

        it('should return the range itself when there is no word before cursor', () => {
            const rng = range.create(contEl.firstChild, 0).getWordsRange();

            expect(rng.sc).to.deep.equal(contEl.firstChild);
            expect(rng.so).to.equal(0);
            expect(rng.ec).to.deep.equal(contEl.firstChild);
            expect(rng.eo).to.equal(0);
        });

        it('should return expanded range when there is a word before cursor', () => {
            const rng = range.create(contEl.firstChild, 5).getWordsRange();

            expect(rng.sc).to.deep.equal(contEl.firstChild);
            expect(rng.so).to.equal(0);
            expect(rng.ec).to.deep.equal(contEl.firstChild);
            expect(rng.eo).to.equal(5);
        });

        it('should return expanded range when there is a half word before cursor', () => {
            const rng = range.create(contEl.firstChild, 3).getWordsRange();

            expect(rng.sc).to.deep.equal(contEl.firstChild);
            expect(rng.so).to.equal(0);
            expect(rng.ec).to.deep.equal(contEl.firstChild);
            expect(rng.eo).to.equal(3);
        });

        it('should return expanded range when there are words before cursor', () => {
            const rng = range.create(contEl.firstChild, 14).getWordsRange();

            expect(rng.sc).to.deep.equal(contEl.firstChild);
            expect(rng.so).to.equal(0);
            expect(rng.ec).to.deep.equal(contEl.firstChild);
            expect(rng.eo).to.equal(14);
        });
    });

    describe('getWordsMatchRange', () => {
        let contEl: HTMLElement;
        let regex: RegExp;
        before(() => {
            contEl = func.makeElement('<div class="note-editable">hi @Peter Pan. How are you?</div>');
            regex = /@[a-z ]+/i;
        });

        it('should return null when there is no word before cursor', () => {
            const rng = range.create(contEl.firstChild, 0).getWordsMatchRange(regex);
            expect(rng).to.be.a('null');
        });

        it('should return expanded range when there are words before cursor', () => {
            const rng = range.create(contEl.firstChild, 13).getWordsMatchRange(regex);

            // range: 'hi @Peter Pan'
            // matched range: '@Peter Pan'
            expect(rng.sc).to.deep.equal(contEl.firstChild);
            expect(rng.so).to.equal(3);
            expect(rng.ec).to.deep.equal(contEl.firstChild);
            expect(rng.eo).to.equal(13);
        });

        it('should return null when can not match', () => {
            const rng = range.create(contEl.firstChild, 14).getWordsMatchRange(regex);

            // range: 'hi @Peter Pan.'
            expect(rng).to.be.a('null');
        });
    });
});
