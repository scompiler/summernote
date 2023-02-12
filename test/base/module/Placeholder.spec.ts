/**
 * Placeholder.spec.js
 * (c) 2015~ Summernote Team
 * summernote may be freely distributed under the MIT license./
 */
import chai from 'chai';
import Context from 'src/js/Context';
import 'src/styles/bs5/summernote-bs5';
import Summernote from "../../../src/js/class";
import func from "../../../src/js/core/func";

describe('Placeholder', () => {
    const assert = chai.assert;

    it('should not be initialized by placeholder attribute without inheritPlaceHolder', () => {
        const options = {...Summernote.meta.options};
        const context = new Context(func.makeElement('<textarea placeholder="custom_placeholder"><p>hello</p></textarea>'), options);
        const editorEl = context.layoutInfo.editorEl;

        assert.isTrue(editorEl.querySelector('.note-placeholder') === null);
    });

    it('should be initialized by placeholder attribute with inheritPlaceHolder', () => {
        const options = {...Summernote.meta.options};
        options.inheritPlaceholder = true;
        const context = new Context(func.makeElement('<textarea placeholder="custom_placeholder"><p>hello</p></textarea>'), options);
        const editorEl = context.layoutInfo.editorEl;

        assert.isTrue(editorEl.querySelector('.note-placeholder') instanceof HTMLElement);
        assert.isTrue(editorEl.querySelector('.note-placeholder').innerHTML === 'custom_placeholder');
    });
});
