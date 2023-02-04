/**
 * Context.spec.js
 * (c) 2015~ Summernote Team
 * summernote may be freely distributed under the MIT license./
 */
import chai from 'chai';
import spies from 'chai-spies';
import $ from 'jquery';// window.jQuery = $;
import 'bootstrap';
import chaidom from 'test/chaidom';
import env from 'src/js/core/env.ts';
import Context from 'src/js/Context.ts';
import 'src/styles/bs4/summernote-bs4';
import Summernote from "../../src/js/class";

var expect = chai.expect;
chai.use(spies);
chai.use(chaidom);

describe('Context lifecycle', () => {
  it('should be initialized without calling callback', () => {
    var spy = chai.spy();
    var $note = $('<div><p>hello</p></div>');
    $note[0].addEventListener('summernote.change', spy);

    var context = new Context($note[0], Summernote.meta.options);
    expect(spy).to.have.not.been.called();

    // [workaround]
    //  - IE8-11 can't create range in headless mode
    if (!env.isMSIE) {
      context.invoke('insertText', 'hello');
      expect(spy).to.have.been.called();
    }
  });

  it('should preserve user events handler after destroy', () => {
    var spy = chai.spy();
    var $note = $('<div><p>hello</p></div>');
    $note[0].addEventListener('click', spy);

    var context = new Context($note[0], Summernote.meta.options);
    context.destroy();

    $note.trigger('click');
    expect(spy).to.have.been.called();
  });
});

describe('Context', () => {
  var context;
  beforeEach(() => {
    context = new Context($('<div><p>hello</p></div>')[0], Summernote.meta.options);
  });

  it('should get or set contents with code', () => {
    expect(context.code()).to.equalsIgnoreCase('<p>hello</p>');
    context.code('<p>hello2</p>');
    expect(context.code()).to.equalsIgnoreCase('<p>hello2</p>');
  });

  it('should enable or disable editor', () => {
    expect(context.isDisabled()).to.be.false;
    context.disable();
    expect(context.isDisabled()).to.be.true;
    context.enable();
    expect(context.isDisabled()).to.be.false;
  });

  it('should preserve disabled status after reset', () => {
    expect(context.isDisabled()).to.be.false;
    context.disable();
    expect(context.isDisabled()).to.be.true;
    context.reset();
    expect(context.isDisabled()).to.be.true;
  });
});
