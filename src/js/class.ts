import merge from "lodash.merge";
import env from "./core/env";
import Context from "./Context";

declare global {
    interface Window {
        Summernote: Summernote;
    }
}

export interface SummernoteElement extends HTMLElement {
    __summernoteInstance?: Context;
}

export default class Summernote {
    static languages: {
        [lang: string]: any;
    } = {};

    static meta: {
        options?: any;
    } = {};

    static init(noteEl: SummernoteElement, ...args: any[]) {
        const type = typeof(args[0]);
        const isExternalAPICalled = type === 'string';
        const hasInitOptions = type === 'object';

        const options = Object.assign({}, Summernote.meta.options, hasInitOptions ? args[0] : {});

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
            return context.invoke(...args);
        } else if (options.focus) {
            context.invoke('editor.focus');
        }

        return context;
    }
}

window.Summernote = Summernote;
