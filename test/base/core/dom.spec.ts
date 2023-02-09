/**
 * dom.spec.js
 * (c) 2013~ Alan Hong
 * summernote may be freely distributed under the MIT license./
 */
import chai from 'chai';
import chaidom from 'test/chaidom';
import dom from 'src/js/core/dom';
import func from 'src/js/core/func';

const expect = chai.expect;
chai.use(chaidom);

describe('base:core.dom', () => {
    describe('ancestor', () => {
        let contEl: HTMLElement;
        let bEl: HTMLElement;
        let txtB: Node;
        before(() => {
            // basic case
            contEl = func.makeElement('<div class="note-editable"><b>b</b><u>u</u><s>s</s><i>i</i></div>'); // busi
            bEl = contEl.querySelector('b');
            txtB = bEl.firstChild;
        });

        it('should find ancestor B', () => {
            expect(dom.ancestor(txtB, dom.isB)).to.deep.equal(bEl);
        });

        it('should find ancestor DIV', () => {
            expect(dom.ancestor(txtB, dom.isDiv)).to.deep.equal(contEl);
        });

        it('should return null when finding ancestor U does not exist', () => {
            expect(dom.ancestor(txtB, dom.isU)).to.be.null;
        });

        it('should return null when finding paragraph ancestor outsider note-editable', () => {
            expect(dom.ancestor(txtB, dom.isLi)).to.be.null;
        });
    });

    describe('listAncestor', () => {
        let contEl: HTMLElement;
        let bEl: HTMLElement;
        let uEl: HTMLElement;
        let sEl: HTMLElement;
        let iEl: HTMLElement;

        before(() => {
            contEl = func.makeElement('<div class="note-editable"><i><s><u><b>b</b></u></s></i></div>'); // busi
            bEl = contEl.querySelector('b');
            uEl = contEl.querySelector('u');
            sEl = contEl.querySelector('s');
            iEl = contEl.querySelector('i');
        });

        it('should return [bEl, uEl, sEl, iEl] from b to i', () => {
            const result = dom.listAncestor(bEl, (node) => { return node === iEl; });
            expect(result).to.deep.equal([bEl, uEl, sEl, iEl]);
        });

        it('should return [uEl, sEl] from u to s', () => {
            const result = dom.listAncestor(uEl, (node) => { return node === sEl; });
            expect(result).to.deep.equal([uEl, sEl]);
        });
    });

    describe('listDescendant', () => {
        let contEl: HTMLElement;
        let bEl: HTMLElement;
        let uEl: HTMLElement;
        let sEl: HTMLElement;
        let iEl: HTMLElement;

        before(() => {
            contEl = func.makeElement('<div class="note-editable"><b></b><u></u><s></s><i></i></div>'); // busi
            bEl = contEl.querySelector('b');
            uEl = contEl.querySelector('u');
            sEl = contEl.querySelector('s');
            iEl = contEl.querySelector('i');
        });

        it('should return an array of descendant elements', () => {
            expect(dom.listDescendant(contEl)).to.deep.equal([bEl, uEl, sEl, iEl]);
        });

        it('should filter an array of descendant elements', () => {
            const result = dom.listDescendant(contEl, (node) => {
                return node.nodeName === 'B' || node.nodeName === 'S';
            });
            expect(result).to.deep.equal([bEl, sEl]);
        });
    });

    describe('commonAncestor', () => {
        let contEl: HTMLElement;
        let spanEl: HTMLElement;
        let divEl: HTMLElement;
        let bEl: HTMLElement;
        let uEl: HTMLElement;
        let sEl: HTMLElement;
        before(() => {
            contEl = func.makeElement('<div class="note-editable"><div><span><b>b</b><u>u</u></span><span><s>s</s><i>i</i></span></div></div>');
            spanEl = contEl.querySelector('span');
            divEl = contEl.querySelector('div');
            bEl = contEl.querySelector('b');
            uEl = contEl.querySelector('u');
            sEl = contEl.querySelector('s');
        });

        it('should return a common element in ancestors', () => {
            expect(dom.commonAncestor(bEl, uEl)).to.deep.equal(spanEl);
        });

        it('should return a common element in ancestors even if they have same nodeName', () => {
            expect(dom.commonAncestor(bEl, sEl)).to.deep.equal(divEl);
        });
    });

    describe('listNext', () => {
        let contEl: HTMLElement;
        let uEl: HTMLElement;
        let sEl: HTMLElement;
        let iEl: HTMLElement;
        before(() => {
            contEl = func.makeElement('<div class="note-editable"><b>b</b><u>u</u><s>s</s><i>i</i></div>'); // busi
            uEl = contEl.querySelector('u');
            sEl = contEl.querySelector('s');
            iEl = contEl.querySelector('i');
        });

        it('should return an array of next sibling elements including itself', () => {
            expect(dom.listNext(uEl)).to.deep.equal([uEl, sEl, iEl]);
        });

        it('should return itself if there are no next sibling', () => {
            expect(dom.listNext(iEl)).to.deep.equal([iEl]);
        });

        it('should return an array of next sibling elements before predicate is true', () => {
            expect(dom.listNext(sEl, func.eq(iEl))).to.deep.equal([sEl]);
        });
    });

    describe('listPrev', () => {
        let contEl: HTMLElement;
        let bEl: HTMLElement;
        let uEl: HTMLElement;
        let sEl: HTMLElement;
        let iEl: HTMLElement;
        before(() => {
            contEl = func.makeElement('<div class="note-editable"><b>b</b><u>u</u><s>s</s><i>i</i></div>'); // busi
            bEl = contEl.querySelector('b');
            uEl = contEl.querySelector('u');
            sEl = contEl.querySelector('s');
            iEl = contEl.querySelector('i');
        });

        it('should return an array of previous sibling elements including itself', () => {
            expect(dom.listPrev(sEl)).to.deep.equal([sEl, uEl, bEl]);
        });

        it('should return itself if there are no previous sibling', () => {
            expect(dom.listPrev(bEl)).to.deep.equal([bEl]);
        });

        it('should return an array of previous sibling elements before predicate is true', () => {
            expect(dom.listPrev(iEl, func.eq(sEl))).to.deep.equal([iEl]);
        });
    });

    describe('position', () => {
        let contEl: HTMLElement;
        let bEl: HTMLElement;
        let uEl: HTMLElement;
        let sEl: HTMLElement;
        let iEl: HTMLElement;
        before(() => {
            contEl = func.makeElement('<div class="note-editable"><b>b</b><u>u</u><s>s</s><i>i</i></div>'); // busi
            bEl = contEl.querySelector('b');
            uEl = contEl.querySelector('u');
            sEl = contEl.querySelector('s');
            iEl = contEl.querySelector('i');
        });

        it('should return the position of element', () => {
            expect(dom.position(bEl)).to.be.equal(0);
            expect(dom.position(uEl)).to.be.equal(1);
            expect(dom.position(sEl)).to.be.equal(2);
            expect(dom.position(iEl)).to.be.equal(3);
        });

        it('should return position 0 for text node in b', () => {
            expect(dom.position(bEl.firstChild)).to.be.equal(0);
        });
    });

    describe('makeOffsetPath', () => {
        let contEl: HTMLElement;
        let bEl: HTMLElement;
        let uEl: HTMLElement;
        let sEl: HTMLElement;
        let iEl: HTMLElement;
        before(() => {
            contEl = func.makeElement('<div class="note-editable"><b>b</b><u>u</u><s>s</s><i>i</i></div>'); // busi
            bEl = contEl.querySelector('b');
            uEl = contEl.querySelector('u');
            sEl = contEl.querySelector('s');
            iEl = contEl.querySelector('i');
        });

        it('should return empty array if two elements are same', () => {
            expect(dom.makeOffsetPath(contEl, contEl)).to.deep.equal([]);
        });

        it('should return offset path array between two elements #1', () => {
            expect(dom.makeOffsetPath(contEl, bEl)).to.deep.equal([0]);
            expect(dom.makeOffsetPath(contEl, bEl.firstChild)).to.deep.equal([0, 0]);
        });

        it('should return offset path array between two elements #2', () => {
            expect(dom.makeOffsetPath(contEl, uEl)).to.deep.equal([1]);
            expect(dom.makeOffsetPath(contEl, uEl.firstChild)).to.deep.equal([1, 0]);
        });

        it('should return offset path array between two elements #3', () => {
            expect(dom.makeOffsetPath(contEl, sEl)).to.deep.equal([2]);
            expect(dom.makeOffsetPath(contEl, sEl.firstChild)).to.deep.equal([2, 0]);
        });

        it('should return offset path array between two elements #2', () => {
            expect(dom.makeOffsetPath(contEl, iEl)).to.deep.equal([3]);
            expect(dom.makeOffsetPath(contEl, iEl.firstChild)).to.deep.equal([3, 0]);
        });
    });

    describe('fromOffsetPath', () => {
        let contEl: HTMLElement;
        let bEl: HTMLElement;
        let uEl: HTMLElement;
        let sEl: HTMLElement;
        let iEl: HTMLElement;
        before(() => {
            contEl = func.makeElement('<div class="note-editable"><b>b</b><u>u</u><s>s</s><i>i</i></div>'); // busi
            bEl = contEl.querySelector('b');
            uEl = contEl.querySelector('u');
            sEl = contEl.querySelector('s');
            iEl = contEl.querySelector('i');
        });

        it('should return the element by offsetPath', () => {
            const cont = contEl;
            [bEl, uEl, sEl, iEl].forEach((node) => {
                expect(dom.fromOffsetPath(cont, dom.makeOffsetPath(cont, node))).to.deep.equal(node);
                const child = node.firstChild;
                expect(dom.fromOffsetPath(cont, dom.makeOffsetPath(cont, child))).to.deep.equal(child);
            });
        });
    });

    describe('splitTree', () => {
        let paraEl: HTMLElement;
        beforeEach(() => {
            const busiEl = func.makeElement('<div class="note-editable"><p><b>b</b><u>u</u><s>strike</s><i>i</i></p></div>'); // busi
            paraEl = (busiEl.cloneNode(true) as HTMLElement).querySelector('p');
        });

        describe('element pivot case', () => {
            it('should be split by u tag with offset 0', () => {
                const uEl = paraEl.querySelector('u');
                dom.splitTree(paraEl, { node: uEl, offset: 0 });

                expect(paraEl.innerHTML).to.equalsIgnoreCase('<b>b</b><u><br></u>');
                expect(paraEl.nextElementSibling.innerHTML).to.equalsIgnoreCase('<u>u</u><s>strike</s><i>i</i>');
            });

            it('should be split by u tag with offset 1', () => {
                const uEl = paraEl.querySelector('u');
                dom.splitTree(paraEl, { node: uEl, offset: 1 });

                expect(paraEl.innerHTML).to.equalsIgnoreCase('<b>b</b><u>u</u>');
                expect(paraEl.nextElementSibling.innerHTML).to.equalsIgnoreCase('<u><br></u><s>strike</s><i>i</i>');
            });

            it('should be split by b tag with offset 0 (left edge case)', () => {
                const bEl = paraEl.querySelector('b');
                dom.splitTree(paraEl, { node: bEl, offset: 0 });

                expect(paraEl.innerHTML).to.equalsIgnoreCase('<b><br></b>');
                expect(paraEl.nextElementSibling.innerHTML).to.equalsIgnoreCase('<b>b</b><u>u</u><s>strike</s><i>i</i>');
            });

            it('should be split by i tag with offset 1 (right edge case)', () => {
                const iEl = paraEl.querySelector('i');
                dom.splitTree(paraEl, { node: iEl, offset: 1 });

                expect(paraEl.innerHTML).to.equalsIgnoreCase('<b>b</b><u>u</u><s>strike</s><i>i</i>');
                expect(paraEl.nextElementSibling.innerHTML).to.equalsIgnoreCase('<i><br></i>');
            });

            it('should discard first split if empty and isDiscardEmptySplits=true', () => {
                const uEl = paraEl.querySelector('u');
                dom.splitTree(paraEl, { node: uEl, offset: 0 }, { isDiscardEmptySplits: true });

                expect(paraEl.innerHTML).to.equalsIgnoreCase('<b>b</b>');
                expect(paraEl.nextElementSibling.innerHTML).to.equalsIgnoreCase('<u>u</u><s>strike</s><i>i</i>');
            });

            it('should discard second split if empty and isDiscardEmptySplits=true', () => {
                const uEl = paraEl.querySelector('u');
                dom.splitTree(paraEl, { node: uEl, offset: 1 }, { isDiscardEmptySplits: true });

                expect(paraEl.innerHTML).to.equalsIgnoreCase('<b>b</b><u>u</u>');
                expect(paraEl.nextElementSibling.innerHTML).to.equalsIgnoreCase('<s>strike</s><i>i</i>');
            });
        });

        describe('textNode case', () => {
            it('should be split by s tag with offset 3 (middle case)', () => {
                const sEl = paraEl.querySelector('s');
                dom.splitTree(paraEl, { node: sEl.firstChild, offset: 3 });

                expect(paraEl.innerHTML).to.equalsIgnoreCase('<b>b</b><u>u</u><s>str</s>');
                expect(paraEl.nextElementSibling.innerHTML).to.equalsIgnoreCase('<s>ike</s><i>i</i>');
            });

            it('should be split by s tag with offset 0 (left edge case)', () => {
                const sEl = paraEl.querySelector('s');
                dom.splitTree(paraEl, { node: sEl.firstChild, offset: 0 });

                expect(paraEl.innerHTML).to.equalsIgnoreCase('<b>b</b><u>u</u><s><br></s>');
                expect(paraEl.nextElementSibling.innerHTML).to.equalsIgnoreCase('<s>strike</s><i>i</i>');
            });

            it('should be split by s tag with offset 6 (right edge case)', () => {
                const sEl = paraEl.querySelector('s');
                dom.splitTree(paraEl, { node: sEl.firstChild, offset: 6 });

                expect(paraEl.innerHTML).to.equalsIgnoreCase('<b>b</b><u>u</u><s>strike</s><i><br></i>');
                expect(paraEl.nextElementSibling.innerHTML).to.equalsIgnoreCase('<i>i</i>');
            });

            it('should be split by s tag with offset 3 (2 depth case)', () => {
                const sEl = paraEl.querySelector('s');
                dom.splitTree(sEl, { node: sEl.firstChild, offset: 3 });

                expect(paraEl.innerHTML).to.equalsIgnoreCase('<b>b</b><u>u</u><s>str</s><s>ike</s><i>i</i>');
            });

            it('should be split by s tag with offset 3 (1 depth and textNode case)', () => {
                const sEl = paraEl.querySelector('s');
                dom.splitTree(sEl.firstChild, { node: sEl.firstChild, offset: 3 });

                expect(paraEl.innerHTML).to.equalsIgnoreCase('<b>b</b><u>u</u><s>strike</s><i>i</i>');
            });

            it('should be split by span tag with offset 2 (1 depth and element case)', () => {
                const contEl = func.makeElement('<div class="note-editable"><p><span><b>b</b><u>u</u><s>s</s><i>i</i></span></p></div>'); // busi
                const spanEl = contEl.querySelector('span');
                dom.splitTree(spanEl, { node: spanEl, offset: 2 });

                expect(contEl.innerHTML).to.equalsIgnoreCase('<p><span><b>b</b><u>u</u></span><span><s>s</s><i>i</i></span></p>');
            });
        });
    });

    describe('splitPoint', () => {
        it('should return rightNode and container for empty paragraph with inline', () => {
            const editableEl = func.makeElement('<div class="note-editable"><p><br></p></div>');
            const paraEl = (editableEl.cloneNode(true) as HTMLElement).querySelector('p');
            const brEl = paraEl.querySelector('br');

            const result = dom.splitPoint({ node: paraEl, offset: 0 }, true);
            expect(result).to.deep.equal({ rightNode: brEl, container: paraEl });
        });
    });

    describe('isVisiblePoint', () => {
        it('should detect as visible when there is a table inside a div', () => {
            const editableEl = func.makeElement('<div><table></table></div>');
            const pointEl = (editableEl.cloneNode(true) as HTMLElement).querySelector('div');

            const result = dom.isVisiblePoint({node: pointEl, offset: 0});
            expect(result).to.be.true;
        });
    });
});
