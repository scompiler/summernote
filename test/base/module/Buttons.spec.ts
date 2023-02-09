/**
 * Buttons.spec.js
 * (c) 2015~ Summernote Team
 * summernote may be freely distributed under the MIT license./
 */

import chai from 'chai';
import chaidom from 'test/chaidom';
import range from 'src/js/core/range';
import Context from 'src/js/Context';
import 'src/styles/bs4/summernote-bs4';
import Summernote from "src/js/class";
import func from "src/js/core/func";

chai.use(chaidom);

describe('Buttons', () => {
    const expect = chai.expect;
    const assert = chai.assert;
    let context: Context;
    let toolbarEl: HTMLElement;
    let editableEl: HTMLElement;

    before(function(done) {
        setTimeout(function() {
            done();
        }, 500);
    });

    beforeEach(() => {
        document.body.innerHTML = ''; // important !
        const noteEl = func.makeElement('<div><p>hello</p></div>');
        document.body.appendChild(noteEl);

        const options = {...Summernote.meta.options};
        options.toolbar = [
            ['font1', ['style', 'clear']],
            ['font2', ['bold', 'underline', 'italic', 'superscript', 'subscript', 'strikethrough']],
            ['font3', ['fontname', 'fontsize']],
            ['color', ['color', 'forecolor', 'backcolor']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['table', ['table']],
            ['insert', ['link', 'picture', 'video']],
            ['view', ['fullscreen', 'codeview', 'help']],
        ];
        context = new Context(noteEl, options);
        context.initialize();

        toolbarEl = context.layoutInfo.toolbarEl;
        editableEl = context.layoutInfo.editableEl;

        // Select the first paragraph
        range.createFromNode(editableEl.querySelector('p')).normalize().select();
    });

    describe('bold button', () => {
        it('should execute bold command when it is clicked', (done) => {
            toolbarEl.querySelector<HTMLElement>('.note-btn-bold').click();
            expect(editableEl.innerHTML).await(done).to.equalsIgnoreCase('<p><b>hello</b></p>');
        });
    });

    describe('bold button state updated', () => {
        it('should look toggled immediately when clicked', (done) => {
            const buttonEls = toolbarEl.querySelectorAll<HTMLElement>('.note-btn-bold');
            assert.isTrue(buttonEls.length === 1);
            assert.isFalse(buttonEls[0].classList.contains('active'));
            buttonEls[0].click();
            expect(buttonEls[0].classList.contains('active')).await(done).to.be.true;
        });
    });

    describe('italic button', () => {
        it('should execute italic command when it is clicked', (done) => {
            toolbarEl.querySelector<HTMLElement>('.note-btn-italic').click();
            expect(editableEl.innerHTML).await(done).to.equalsIgnoreCase('<p><i>hello</i></p>');
        });
    });

    describe('italic button state updated', () => {
        it('should look toggled immediately when clicked', (done) => {
            const buttonEls = toolbarEl.querySelectorAll<HTMLElement>('.note-btn-italic');
            assert.isTrue(buttonEls.length === 1);
            assert.isFalse(buttonEls[0].classList.contains('active'));
            buttonEls[0].click();
            expect(buttonEls[0].classList.contains('active')).await(done).to.be.true;
        });
    });

    describe('underline button', () => {
        it('should execute underline command when it is clicked', (done) => {
            toolbarEl.querySelector<HTMLElement>('.note-btn-underline').click();
            expect(editableEl.innerHTML).await(done).to.equalsIgnoreCase('<p><u>hello</u></p>');
        });
    });

    describe('underline button state updated', () => {
        it('should look toggled immediately when clicked', (done) => {
            const buttonEls = toolbarEl.querySelectorAll<HTMLElement>('.note-btn-underline');
            assert.isTrue(buttonEls.length === 1);
            assert.isFalse(buttonEls[0].classList.contains('active'));
            buttonEls[0].click();
            expect(buttonEls[0].classList.contains('active')).await(done).to.be.true;
        });
    });

    describe('superscript button', () => {
        it('should execute superscript command when it is clicked', (done) => {
            toolbarEl.querySelector<HTMLElement>('.note-btn-superscript').click();
            expect(editableEl.innerHTML).await(done).to.equalsIgnoreCase('<p><sup>hello</sup></p>');
        });
    });

    describe('superscript button state updated', () => {
        it('should look toggled immediately when clicked', (done) => {
            const buttonEls = toolbarEl.querySelectorAll<HTMLElement>('.note-btn-superscript');
            assert.isTrue(buttonEls.length === 1);
            assert.isFalse(buttonEls[0].classList.contains('active'));
            buttonEls[0].click();
            expect(buttonEls[0].classList.contains('active')).await(done).to.be.true;
        });
    });

    describe('subscript button', () => {
        it('should execute subscript command when it is clicked', (done) => {
            toolbarEl.querySelector<HTMLElement>('.note-btn-subscript').click();
            expect(editableEl.innerHTML).await(done).to.equalsIgnoreCase('<p><sub>hello</sub></p>');
        });
    });

    describe('subscript button state updated', () => {
        it('should look toggled immediately when clicked', (done) => {
            const buttonEls = toolbarEl.querySelectorAll<HTMLElement>('.note-btn-subscript');
            assert.isTrue(buttonEls.length === 1);
            assert.isFalse(buttonEls[0].classList.contains('active'));
            buttonEls[0].click();
            expect(buttonEls[0].classList.contains('active')).await(done).to.be.true;
        });
    });

    describe('strikethrough button', () => {
        it('should execute strikethrough command when it is clicked', (done) => {
            toolbarEl.querySelector<HTMLElement>('.note-btn-strikethrough').click();
            expect(editableEl.innerHTML).await(done).to.equalsIgnoreCase('<p><strike>hello</strike></p>');
        });
    });

    describe('strikethrough button state updated', () => {
        it('should look toggled immediately when clicked', (done) => {
            const buttonEls = toolbarEl.querySelectorAll<HTMLElement>('.note-btn-strikethrough');
            assert.isTrue(buttonEls.length === 1);
            assert.isFalse(buttonEls[0].classList.contains('active'));
            buttonEls[0].click();
            expect(buttonEls[0].classList.contains('active')).await(done).to.be.true;
        });
    });

    describe('clear button state not updated when clicked', () => {
        it('should never look toggled when clicked', (done) => {
            const buttonEls = ([].slice.call(toolbarEl.querySelectorAll<HTMLElement>('i.note-icon-eraser')) as HTMLElement[]).map(x => x.parentElement);
            assert.isTrue(buttonEls.length === 1);
            assert.isFalse(buttonEls[0].classList.contains('active'));
            buttonEls[0].click();
            expect(buttonEls[0].classList.contains('active')).await(done).to.be.false;
        });
    });

    /* Below test cannot be passed under Firefox
    describe('font family button', () => {
      it('should select the right font family name in the dropdown list when it is clicked', (done) => {
        var $li = $toolbar.find('.dropdown-fontname a[data-value="Comic Sans MS"]');
        var $span = $toolbar.find('span.note-current-fontname');
        assert.isTrue($li.length === 1);
        assert.isTrue($span.text() !== 'Comic Sans MS');
        $li.click();
        expect($span.text()).await(done).to.equalsIgnoreCase('Comic Sans MS');
      });
    });
    */

    describe('font family button', () => {
        it('should change font family (Courier New) when it is clicked', (done) => {
            const liEls = toolbarEl.querySelectorAll<HTMLElement>('.dropdown-fontname a[data-value="Courier New"]');
            const spanEl = toolbarEl.querySelector('span.note-current-fontname');
            assert.isTrue(liEls.length === 1);
            assert.isTrue(spanEl.textContent !== 'Courier New');
            liEls[0].click();
            expect(editableEl.querySelector('p').children[0]).await(done).to.be.equalsStyle('"Courier New"', 'font-family');
        });
        it('should change font family (Arial) when it is clicked', (done) => {
            const liEls = toolbarEl.querySelectorAll<HTMLElement>('.dropdown-fontname a[data-value="Arial"]');
            const spanEl = toolbarEl.querySelector('span.note-current-fontname');
            assert.isTrue(liEls.length === 1);
            assert.isTrue(spanEl.textContent !== 'Arial');
            liEls[0].click();
            expect(editableEl.querySelector('p').children[0]).await(done).to.be.equalsStyle('"Arial"', 'font-family');
        });
        it('should change font family (Helvetica) when it is clicked', (done) => {
            const liEls = toolbarEl.querySelectorAll<HTMLElement>('.dropdown-fontname a[data-value="Helvetica"]');
            const spanEl = toolbarEl.querySelector('span.note-current-fontname');
            assert.isTrue(liEls.length === 1);
            assert.isTrue(spanEl.textContent !== 'Helvetica');
            liEls[0].click();
            expect(editableEl.querySelector('p').children[0]).await(done).to.be.equalsStyle('"Helvetica"', 'font-family');
        });
    });

    describe('recent color button in all color button', () => {
        it('should execute color command when it is clicked', (done) => {
            toolbarEl.querySelector<HTMLElement>('.note-color-all .note-current-color-button').click();
            expect(editableEl.querySelector('p').children[0]).await(done).to.be.equalsStyle('#FFFF00', 'background-color');
        });
    });

    describe('fore color button in all color button', () => {
        it('should execute fore color command when it is clicked', (done) => {
            const buttonEl = toolbarEl.querySelectorAll<HTMLElement>('.note-color-all .note-holder .note-color-btn[data-event=foreColor]')[10];
            buttonEl.click();
            expect(editableEl.querySelector('p').children[0]).await(done).to.be.equalsStyle(buttonEl.dataset['value'], 'color');
        });
    });

    describe('back color button in all color button', () => {
        it('should execute back color command when it is clicked', (done) => {
            const buttonEl = toolbarEl.querySelectorAll<HTMLElement>('.note-color-all .note-holder .note-color-btn[data-event=backColor]')[10];
            buttonEl.click();
            expect(editableEl.querySelector('p').children[0]).await(done).to.be.equalsStyle(buttonEl.dataset['value'], 'background-color');
        });
    });

    describe('color button in fore color button', () => {
        it('should execute fore color command when it is clicked', (done) => {
            const buttonEl = toolbarEl.querySelectorAll<HTMLElement>('.note-color-fore .note-color-btn[data-event=foreColor]')[4];
            buttonEl.click();
            expect(editableEl.querySelector('p').children[0]).await(done).to.be.equalsStyle(buttonEl.dataset['value'], 'color');
        });
    });

    describe('back color button in back color button', () => {
        it('should execute back color command when it is clicked', (done) => {
            const buttonEl = toolbarEl.querySelectorAll<HTMLElement>('.note-color-back .note-color-btn[data-event=backColor]')[20];
            buttonEl.click();
            expect(editableEl.querySelector('p').children[0]).await(done).to.be.equalsStyle(buttonEl.dataset['value'], 'background-color');
        });
    });

    describe('font size button', () => {
        it('should update font size button value when changing font size', (done) => {
            const fontSizeDropdownEl = toolbarEl.querySelector('.dropdown-fontsize');
            const fontSizeButtonEl = ([].slice.call(fontSizeDropdownEl.parentElement.children) as HTMLElement[]).find(x => x.tagName.toLowerCase() === 'button');
            const fontSizeListEl = ([].slice.call(fontSizeDropdownEl.querySelectorAll('a')) as HTMLElement[]);
            const selectedSize = '36';

            // click on dropdown button
            fontSizeButtonEl.click();
            // select a font size
            fontSizeListEl.filter(x => x.dataset['value'] === selectedSize)[0].click();

            expect(fontSizeButtonEl.textContent.trim()).await(done).to.equal(selectedSize);
        });
    });
});
