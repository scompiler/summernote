import $ from 'jquery';
import env from './core/env';
import lists from './core/lists';
import Context from './Context';
import merge from 'lodash.merge';
import Summernote from "./class";

$.fn.extend({
  /**
   * Summernote API
   *
   * @param {Object|String}
   * @return {this}
   */
  summernote: function() {
    const type = typeof(lists.head(arguments));
    const isExternalAPICalled = type === 'string';
    const hasInitOptions = type === 'object';

    const options = Object.assign({}, Summernote.meta.options, hasInitOptions ? lists.head(arguments) : {});

    // Update options
    options.langInfo = merge({}, Summernote.languages['en-US'], Summernote.languages[options.lang]);
    options.icons = merge({}, Summernote.meta.options.icons, options.icons);
    options.tooltip = options.tooltip === 'auto' ? !env.isSupportTouch : options.tooltip;

    this.each((idx, noteEl) => {
      if (!('__summernoteInstance' in noteEl)) {
        const context = new Context(noteEl, options);
        noteEl.__summernoteInstance = context;
        context.triggerEvent('init', context.layoutInfo);
      }
    });

    const noteEl = this.first()[0];
    if (noteEl) {
      const context = noteEl.__summernoteInstance;
      if (isExternalAPICalled) {
        return context.invoke.apply(context, lists.from(arguments));
      } else if (options.focus) {
        context.invoke('editor.focus');
      }
    }

    return this;
  },
});
