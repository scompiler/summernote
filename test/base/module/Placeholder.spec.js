/**
 * Placeholder.spec.js
 * (c) 2015~ Summernote Team
 * summernote may be freely distributed under the MIT license./
 */
import chai from 'chai';
import $ from 'jquery';
import Context from 'src/js/Context';
import 'src/styles/bs4/summernote-bs4';
import Summernote from "../../../src/js/class";

describe('Placeholder', () => {
  var assert = chai.assert;

  it('should not be initialized by placeholder attribute without inheritPlaceHolder', () => {
    var options = $.extend({}, Summernote.meta.options);
    var context = new Context($('<textarea placeholder="custom_placeholder"><p>hello</p></textarea>')[0], options);
    var $editor = context.layoutInfo.editor;

    assert.isTrue($editor.find('.note-placeholder').length === 0);
  });

  it('should be initialized by placeholder attribute with inheritPlaceHolder', () => {
    var options = $.extend({}, Summernote.meta.options);
    options.inheritPlaceholder = true;
    var context = new Context($('<textarea placeholder="custom_placeholder"><p>hello</p></textarea>')[0], options);
    var $editor = context.layoutInfo.editor;

    assert.isTrue($editor.find('.note-placeholder').length === 1);
    assert.isTrue($editor.find('.note-placeholder').html() === 'custom_placeholder');
  });
});
