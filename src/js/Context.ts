import func from './core/func';
import lists from './core/lists';
import dom from './core/dom';
import merge from 'lodash.merge';
import Summernote from "./class";
import { Layout, Module, ModuleConstructor, Options, SummernoteElement, UserInterface } from "./core/types";

export default class Context {
    noteEl: SummernoteElement;

    memos: {[key: string]: any} = {};

    modules: {[key: string]: Module} = {};

    layoutInfo: Layout;

    options: Options = {};

    ui: UserInterface;

    constructor(noteEl: SummernoteElement, options: Options) {
        this.noteEl = noteEl;

        this.memos = {};
        this.modules = {};
        this.options = merge({}, options);

        // init ui with options
        Summernote.meta.ui = Summernote.meta.ui_template(this.options);
        this.ui = Summernote.meta.ui;

        this.initialize();
    }

    /**
     * create layout and initialize modules and other resources
     */
    initialize() {
        this.layoutInfo = this.ui.createLayout(this.noteEl);
        this._initialize();
        this.noteEl.style.display = 'none';
        return this;
    }

    /**
     * destroy modules and other resources and remove layout
     */
    destroy() {
        this._destroy();
        delete this.noteEl.__summernoteInstance;
        this.ui.removeLayout(this.noteEl, this.layoutInfo);
    }

    /**
     * destory modules and other resources and initialize it again
     */
    reset() {
        const disabled = this.isDisabled();
        this.code(dom.emptyPara);
        this._destroy();
        this._initialize();

        if (disabled) {
            this.disable();
        }
    }

    _initialize() {
        // set own id
        this.options.id = func.uniqueId((new Date()).getTime().toString());
        // set default container for tooltips, popovers, and dialogs
        let optionsContainer = this.options.container;
        if (optionsContainer && typeof optionsContainer === 'string') {
            optionsContainer = document.querySelector(optionsContainer);
        }

        this.options.container = optionsContainer ? optionsContainer : this.layoutInfo.editorEl;

        // add optional buttons
        const buttons = Object.assign({}, this.options.buttons);
        Object.keys(buttons).forEach((key) => {
            this.memo('button.' + key, buttons[key]);
        });

        const modules = Object.assign({}, this.options.modules, Summernote.meta.plugins || {});

        // add and initialize modules
        Object.keys(modules).forEach((key) => {
            this.module(key, modules[key], true);
        });

        Object.keys(this.modules).forEach((key) => {
            this.initializeModule(key);
        });
    }

    _destroy() {
        // destroy modules with reversed order
        Object.keys(this.modules).reverse().forEach((key) => {
            this.removeModule(key);
        });

        Object.keys(this.memos).forEach((key) => {
            this.removeMemo(key);
        });
        // trigger custom onDestroy callback
        this.triggerEvent('destroy', this);
    }

    code(html: string) {
        const isActivated = this.invoke('codeview.isActivated');

        if (html === undefined) {
            this.invoke('codeview.sync');
            return isActivated ? this.layoutInfo.codableEl.value : this.layoutInfo.editableEl.innerHTML;
        } else {
            if (isActivated) {
                this.invoke('codeview.sync', html);
            } else {
                this.layoutInfo.editableEl.innerHTML = html;
            }
            if (this.noteEl instanceof HTMLTextAreaElement || this.noteEl instanceof HTMLInputElement) {
                this.noteEl.value = html;
            }
            this.triggerEvent('change', html, this.layoutInfo.editableEl);
        }
    }

    isDisabled() {
        return this.layoutInfo.editableEl.getAttribute('contenteditable') === 'false';
    }

    enable() {
        this.layoutInfo.editableEl.setAttribute('contenteditable', 'true');
        this.invoke('toolbar.activate', true);
        this.triggerEvent('disable', false);
        this.options.editing = true;
    }

    disable() {
        // close codeview if codeview is opend
        if (this.invoke('codeview.isActivated')) {
            this.invoke('codeview.deactivate');
        }
        this.layoutInfo.editableEl.setAttribute('contenteditable', 'false');
        this.options.editing = false;
        this.invoke('toolbar.deactivate', true);

        this.triggerEvent('disable', true);
    }

    triggerEvent(namespace: string, ...args: any[]) {
        const callbackName = func.namespaceToCamel(namespace, 'on') as keyof (typeof this.options.callbacks);
        const callback = this.options.callbacks[callbackName];
        if (callback) {
            callback.apply(this.noteEl, args);
        }
        this.noteEl.dispatchEvent(new CustomEvent('summernote.' + namespace, {
            detail: args,
        }));
    }

    initializeModule(key: string) {
        const module = this.modules[key];
        module.shouldInitialize = module.shouldInitialize || func.ok;
        if (!module.shouldInitialize()) {
            return;
        }

        // initialize module
        if (module.initialize) {
            module.initialize();
        }

        // attach events
        if (module.events) {
            dom.attachEvents(this.noteEl, module.events);
        }
    }

    module(key: string, ModuleClass: ModuleConstructor, withoutIntialize = false) {
        if (arguments.length === 1) {
            return this.modules[key];
        }

        this.modules[key] = new ModuleClass(this);

        if (!withoutIntialize) {
            this.initializeModule(key);
        }
    }

    removeModule(key: string) {
        const module = this.modules[key];
        if (module.shouldInitialize()) {
            if (module.events) {
                dom.detachEvents(this.noteEl, module.events);
            }

            if (module.destroy) {
                module.destroy();
            }
        }

        delete this.modules[key];
    }

    memo(key: string, obj: any) {
        if (arguments.length === 1) {
            return this.memos[key];
        }
        this.memos[key] = obj;
    }

    removeMemo(key: string) {
        if (this.memos[key] && this.memos[key].destroy) {
            this.memos[key].destroy();
        }

        delete this.memos[key];
    }

    /**
     * Some buttons need to change their visual style immediately once they get pressed
     */
    createInvokeHandlerAndUpdateState(namespace: string, value?: any) {
        return (domEvent: Event) => {
            this.createInvokeHandler(namespace, value)(domEvent);
            this.invoke('buttons.updateCurrentStyle');
        };
    }

    createInvokeHandler(namespace: string, value?: any) {
        return (domEvent: Event) => {
            domEvent.preventDefault();
            const targetEl = domEvent.target;
            const dataValueEl = targetEl instanceof Element && targetEl.closest('[data-value]');
            const dataValue = dataValueEl && dataValueEl.getAttribute('data-value');
            this.invoke(namespace, value || dataValue, targetEl);
        };
    }

    invoke(namespace: string, ...args: any[]) {
        const splits = namespace.split('.');
        const hasSeparator = splits.length > 1;
        const moduleName = hasSeparator && lists.head(splits);
        const methodName = hasSeparator ? lists.last(splits) : lists.head(splits);

        const module = this.modules[moduleName || 'editor'];
        if (!moduleName && this[methodName as keyof this]) {
            return (this[methodName as keyof this] as (...args: any) => any)(...args);
        } else if (module && module[methodName as keyof typeof module] && module.shouldInitialize()) {
            return (module[methodName as keyof typeof module] as (...args: any) => any)(...args);
        }
    }
}
