/**
 * Typing.spec.js
 * (c) 2015~ Summernote Team
 * summernote may be freely distributed under the MIT license./
 */
/* jshint unused: false */
/* jshint -W101 */
import chai from 'chai';
import chaidom from 'test/chaidom';
import range from 'src/js/core/range';
import Typing from 'src/js/editing/Typing';
import Context from 'src/js/Context';
import func from 'src/js/core/func';

const expect = chai.expect;
chai.use(chaidom);

describe('base:editing.Style', () => {
    function typing(level: number) {
        return new Typing({ options: { blockquoteBreakingLevel: level } } as Context);
    }

    describe('base:editing.Typing', () => {
        describe('insertParagraph', () => {
            describe('blockquote breaking support', () => {
                let editableEl: HTMLElement;

                function check(html: string) {
                    expect(editableEl.innerHTML).to.equalsIgnoreCase(html);
                }

                beforeEach(() => {
                    editableEl = func.makeElement('<div class="note-editable"><blockquote id="id1">Part1<blockquote id="id2">Part2.1<br>Part2.2</blockquote>Part3</blockquote></div>');
                });

                it('should not break blockquote if blockquoteBreakingLevel=0', () => {
                    typing(0).insertParagraph(editableEl, range.create(editableEl.querySelector('#id2').firstChild, 1));

                    check('<blockquote id="id1">Part1<blockquote id="id2"><p>P</p><p>art2.1<br>Part2.2</p></blockquote>Part3</blockquote>');
                });

                it('should break the first blockquote if blockquoteBreakingLevel=1', () => {
                    typing(1).insertParagraph(editableEl, range.create(editableEl.querySelector('#id2').firstChild, 1));

                    check('<blockquote id="id1">Part1<blockquote id="id2"><p>P</p></blockquote><p><br></p><blockquote id="id2"><p>art2.1<br>Part2.2</p></blockquote>Part3</blockquote>');
                });

                it('should break all blockquotes if blockquoteBreakingLevel=2', () => {
                    typing(2).insertParagraph(editableEl, range.create(editableEl.querySelector('#id2').firstChild, 1));

                    check('<blockquote id="id1">Part1<blockquote id="id2"><p>P</p></blockquote></blockquote><p><br></p><blockquote id="id1"><blockquote id="id2"><p>art2.1<br>Part2.2</p></blockquote>Part3</blockquote>');
                });

                it('should remove leading BR from split, when breaking is on the right edge of a line', () => {
                    typing(1).insertParagraph(editableEl, range.create(editableEl.querySelector('#id2').firstChild, 7));

                    check('<blockquote id="id1">Part1<blockquote id="id2"><p>Part2.1</p></blockquote><p><br></p><blockquote id="id2"><p>Part2.2</p></blockquote>Part3</blockquote>');
                });

                it('should insert new paragraph after the blockquote, if break happens at the end of the blockquote', () => {
                    typing(2).insertParagraph(editableEl, range.create(editableEl.querySelector('#id1').lastChild, 5));

                    check('<blockquote id="id1"><p>Part1<blockquote id="id2">Part2.1<br>Part2.2</blockquote>Part3</p></blockquote><p><br></p>');
                });

                it('should insert new paragraph before the blockquote, if break happens at the beginning of the blockquote', () => {
                    typing(2).insertParagraph(editableEl, range.create(editableEl.querySelector('#id1').firstChild, 0));

                    check('<p><br></p><blockquote id="id1"><p>Part1<blockquote id="id2">Part2.1<br>Part2.2</blockquote>Part3</p></blockquote>');
                });
            });
        });
    });
});
