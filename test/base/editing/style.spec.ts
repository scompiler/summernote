/**
 * Style.spec.js
 * (c) 2015~ Summernote Team
 * summernote may be freely distributed under the MIT license./
 */

import chai from 'chai';
import range from 'src/js/core/range';
import Style from 'src/js/editing/Style';
import func from "src/js/core/func";

const expect = chai.expect;

describe('base:editing.Style', () => {
    const style = new Style();

    describe('styleNodes', () => {
        it('should wrap selected text with span', () => {
            const contEl = func.makeElement('<div class="note-editable"><p>text</p></div>');
            const pEl = contEl.querySelector('p');
            const rng = range.create(pEl.firstChild, 0, pEl.firstChild, 4);
            style.styleNodes(rng);

            expect(contEl.innerHTML).to.deep.equal('<p><span>text</span></p>');
        });

        it('should split text and wrap selected text with span', () => {
            const contEl = func.makeElement('<div class="note-editable"><p>text</p></div>');
            const pEl = contEl.querySelector('p');
            const rng = range.create(pEl.firstChild, 1, pEl.firstChild, 3);
            style.styleNodes(rng);

            expect(contEl.innerHTML).to.deep.equal('<p>t<span>ex</span>t</p>');
        });

        it('should split text and insert span', () => {
            const contEl = func.makeElement('<div class="note-editable"><p>text</p></div>');
            const pEl = contEl.querySelector('p');
            const rng = range.create(pEl.firstChild, 2, pEl.firstChild, 2);
            style.styleNodes(rng);

            expect(contEl.innerHTML).to.deep.equal('<p>te<span></span>xt</p>');
        });

        it('should just return a parent span', () => {
            const contEl = func.makeElement('<div class="note-editable"><p><span>text</span></p></div>');
            const spanEl = contEl.querySelector('span');
            const rng = range.create(spanEl.firstChild, 0, spanEl.firstChild, 4);
            style.styleNodes(rng);

            expect(contEl.innerHTML).to.deep.equal('<p><span>text</span></p>');
        });

        it('should wrap each texts with span', () => {
            const contEl = func.makeElement('<div class="note-editable"><p><b>bold</b><span>span</span></p></div>');
            const bEl = contEl.querySelector('b');
            const spanEl = contEl.querySelector('span');
            const rng = range.create(bEl.firstChild, 2, spanEl.firstChild, 2);
            style.styleNodes(rng);

            expect(contEl.innerHTML).to.deep.equal('<p><b>bo<span>ld</span></b><span><span>sp</span>an</span></p>');
        });

        it('should wrap each texts with span except not a single blood line', () => {
            const contEl = func.makeElement('<div class="note-editable"><p><b>bold</b><span>span</span></p></div>');
            const bEl = contEl.querySelector('b');
            const spanEl = contEl.querySelector('span');
            const rng = range.create(bEl.firstChild, 2, spanEl.firstChild, 4);
            style.styleNodes(rng);

            expect(contEl.innerHTML).to.deep.equal('<p><b>bo<span>ld</span></b><span>span</span></p>');
        });

        it('should expand b tag when providing the expandClosestSibling option', () => {
            const contEl = func.makeElement('<div class="note-editable"><p>text<b>bold</b></p></div>');
            const pEl = contEl.querySelector('p');
            const rng = range.create(pEl.firstChild, 0, pEl.firstChild, 4);
            style.styleNodes(rng, { nodeName: 'B', expandClosestSibling: true });

            expect(contEl.innerHTML).to.deep.equal('<p><b>textbold</b></p>');
        });

        it('should not expand b tag when providing the onlyPartialContains option', () => {
            const contEl = func.makeElement('<div class="note-editable"><p>text<b>bold</b></p></div>');
            const pEl = contEl.querySelector('p');
            const rng = range.create(pEl.firstChild, 0, pEl.firstChild, 4);
            style.styleNodes(rng, { nodeName: 'B', expandClosestSibling: true, onlyPartialContains: true });

            expect(contEl.innerHTML).to.deep.equal('<p><b>text</b><b>bold</b></p>');
        });
    });
});
