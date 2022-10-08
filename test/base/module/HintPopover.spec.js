/**
 * HintPopover.spec.js
 * (c) 2015~ Summernote Team
 * summernote may be freely distributed under the MIT license./
 */
import $ from 'jquery';
import chai from 'chai';
import chaidom from 'test/chaidom';
import Context from 'src/js/Context';
import range from 'src/js/core/range';
import env from 'src/js/core/env';
import key from 'src/js/core/key';
import 'src/styles/bs4/summernote-bs4';
import spies from "chai-spies";
import Summernote from "../../../src/js/class";

chai.use(chaidom);
chai.use(spies);

describe('HintPopover', () => {
  var expect = chai.expect;
  var $note, editor, context, $editable;

  function expectContents(context, markup) {
    expect(context.layoutInfo.editable.html()).to.equalsIgnoreCase(markup);
  }

  describe('Single word hint', () => {
    beforeEach(function() {
      $('body').empty(); // important !
      $note = $('<div><p>hello world</p></div>');
      $note.appendTo('body');

      var options = $.extend({}, Summernote.meta.options, {
        hint: {
          mentions: ['jayden', 'sam', 'alvin', 'david'],
          match: /\B#(\w*)$/,
          search: function(keyword, callback) {
            callback($.grep(this.mentions, function(item) {
              return item.indexOf(keyword) === 0;
            }));
          },
          content: function(item) {
            return '#' + item;
          },
        },
      });

      context = new Context($note[0], options);
      editor = context.modules.editor;
      $editable = context.layoutInfo.editable;

      // [workaround]
      //  - Safari does not popup hintpopover
      //  - IE8-11 can't create range in headless mode
      if (env.isMSIE || env.isSafari) {
        this.skip();
      }
    });

    it('should not be shown without matches', () => {
      $editable[0].dispatchEvent(new Event('keyup'));
      expect($('.note-hint-popover').css('display')).to.equals('none');
    });

    it('should be shown when it matches the given condition', (done) => {
      var textNode = $editable.find('p')[0].firstChild;
      editor.setLastRange(range.create(textNode, 5, textNode, 5).select());
      editor.insertText(' #');
      $editable[0].dispatchEvent(new Event('keyup'));

      setTimeout(() => {
        expect($('.note-hint-popover').css('display')).to.equals('block');
        done();
      }, 10);
    });

    it('should select the best matched item with the given condition', (done) => {
      var textNode = $editable.find('p')[0].firstChild;
      editor.setLastRange(range.create(textNode, 5, textNode, 5).select());
      editor.insertText(' #al');
      $editable[0].dispatchEvent(new Event('keyup'));

      setTimeout(() => {
        // alvin should be activated
        const item = $('.note-hint-popover').find('.note-hint-item');
        expect(item.text()).to.equals('alvin');
        expect(item.hasClass('active')).to.be.true;
        done();
      }, 10);
    });

    it('should be replaced with the selected hint', (done) => {
      var textNode = $editable.find('p')[0].firstChild;
      editor.setLastRange(range.create(textNode, 5, textNode, 5).select());
      editor.insertText(' #');
      $editable[0].dispatchEvent(new Event('keyup'));

      var onChange = chai.spy();
      $note[0].addEventListener('summernote.change', onChange);

      setTimeout(() => {
        $note[0].dispatchEvent(new CustomEvent('summernote.keydown', {
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
      var textNode = $editable.find('p')[0].firstChild;
      editor.setLastRange(range.create(textNode, 5, textNode, 5).select());
      editor.insertText(' #');
      $editable[0].dispatchEvent(new Event('keyup'));

      setTimeout(() => {
        $note[0].dispatchEvent(new CustomEvent('summernote.keydown', {
          detail: [new KeyboardEvent('keydown', {keyCode: key.code.DOWN})],
        }));
        $note[0].dispatchEvent(new CustomEvent('summernote.keydown', {
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
      $('body').empty();
      $note = $('<div><p>hello world</p></div>');
      $note.appendTo('body');

      var options = $.extend({}, Summernote.meta.options, {
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
            callback($.grep(this.mentions, function(item) {
              return item.name.toLowerCase().indexOf(keyword.toLowerCase()) === 0;
            }));
          },
          template: function(item) {
            return item.name;
          },
          content: function(item) {
            return $('<a>')
              .attr('href', item.url)
              .text('@' + item.name)
              .get(0);
          },
        },
      });

      context = new Context($note[0], options);
      editor = context.modules.editor;
      $editable = context.layoutInfo.editable;

      // [workaround]
      //  - Safari does not popup hintpopover
      //  - IE8-11 can't create range in headless mode
      if (env.isMSIE || env.isSafari) {
        this.skip();
      }
    });

    it('should select the best matched item with the given condition', (done) => {
      var textNode = $editable.find('p')[0].firstChild;
      editor.setLastRange(range.create(textNode, 5, textNode, 5).select());
      editor.insertText(' @David S');
      $editable[0].dispatchEvent(new Event('keyup'));

      setTimeout(() => {
        // David Summer should be activated
        const item = $('.note-hint-popover').find('.note-hint-item');
        expect(item.text()).to.equals('David Summer');
        expect(item.hasClass('active')).to.be.true;
        done();
      }, 10);
    });

    it('should render hint result with given content', (done) => {
      var textNode = $editable.find('p')[0].firstChild;
      editor.setLastRange(range.create(textNode, 5, textNode, 5).select());
      editor.insertText(' @David S');
      $editable[0].dispatchEvent(new Event('keyup'));

      setTimeout(() => {
        // alvin should be activated
        $note[0].dispatchEvent(new CustomEvent('summernote.keydown', {
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
