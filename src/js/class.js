import lists from "./core/lists.ts";
import merge from "lodash.merge";
import env from "./core/env.ts";
import Context from "./Context";

export default class Summernote {
  static languages = {};

  static meta = {};

  static init(noteEl) {
    const type = typeof(arguments[1]);
    const isExternalAPICalled = type === 'string';
    const hasInitOptions = type === 'object';

    const options = Object.assign({}, Summernote.meta.options, hasInitOptions ? arguments[1] : {});

    // Update options
    options.langInfo = merge({}, Summernote.languages['en-US'], Summernote.languages[options.lang]);
    options.icons = merge({}, Summernote.meta.options.icons, options.icons);
    options.tooltip = options.tooltip === 'auto' ? !env.isSupportTouch : options.tooltip;

    if (!('__summernoteInstance' in noteEl)) {
      const context = new Context(noteEl, options);
      noteEl.__summernoteInstance = context;
      context.triggerEvent('init', context.layoutInfo);
    }

    const context = noteEl.__summernoteInstance;
    if (isExternalAPICalled) {
      return context.invoke.apply(context, lists.from(arguments).slice(1));
    } else if (options.focus) {
      context.invoke('editor.focus');
    }

    return context;
  }
}

window.Summernote = Summernote;
