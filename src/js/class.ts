import merge from "lodash.merge";
import env from "./core/env";
import Context from "./Context";
import { Options, SummernoteElement, UserInterface } from "./core/types";

declare global {
    interface Window {
        Summernote?: typeof Summernote;
    }
}

const languages = (window.Summernote || {languages: {}}).languages;

export default class Summernote {
    static languages: {
        [lang: string]: any;
    } = languages;

    static meta: {
        options?: Options;
        ui?: UserInterface;
        ui_template?: (options: Options) => UserInterface;
        plugins?: {
            [plugin: string]: (context: Context) => void;
        };
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
            return context.invoke(args[0], ...args.slice(1));
        } else if (options.focus) {
            context.invoke('editor.focus');
        }

        return context;
    }
}

window.Summernote = Summernote;
