/**
 * Fullscreen.spec.js
 * (c) 2015~ Summernote Team
 * summernote may be freely distributed under the MIT license./
 */

import chai from 'chai';
import $ from 'jquery';
import Context from 'src/js/Context.ts';
import Fullscreen from 'src/js/module/Fullscreen';
import 'src/styles/bs4/summernote-bs4';
import Summernote from "../../../src/js/class";

describe('Fullscreen', () => {
  var expect = chai.expect;
  var fullscreen, context;

  beforeEach(() => {
    var options = $.extend({}, Summernote.meta.options);
    context = new Context($('<div><p>hello</p></div>')[0], options);
    fullscreen = new Fullscreen(context);
  });

  it('should toggle fullscreen mode', () => {
    expect(fullscreen.isFullscreen()).to.be.false;
    fullscreen.toggle();
    expect(fullscreen.isFullscreen()).to.be.true;
    fullscreen.toggle();
    expect(fullscreen.isFullscreen()).to.be.false;
  });
});
