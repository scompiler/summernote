import func from './core/func';
import lists from './core/lists';
import dom from './core/dom';
import merge from 'lodash.merge';
import Summernote from "./class";

export default class Context {
  /**
   * @param {HTMLElement} noteEl
   * @param {Object} options
   */
  constructor(noteEl, options) {
    this.noteEl = noteEl;

    this.memos = {};
    this.modules = {};
    this.layoutInfo = {};
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
    this.options.container = this.options.container || this.layoutInfo.editor;

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

  code(html) {
    const isActivated = this.invoke('codeview.isActivated');

    if (html === undefined) {
      this.invoke('codeview.sync');
      return isActivated ? this.layoutInfo.codable.val() : this.layoutInfo.editable.html();
    } else {
      if (isActivated) {
        this.invoke('codeview.sync', html);
      } else {
        this.layoutInfo.editable.html(html);
      }
      this.noteEl.value = html;
      this.triggerEvent('change', html, this.layoutInfo.editable);
    }
  }

  isDisabled() {
    return this.layoutInfo.editable.attr('contenteditable') === 'false';
  }

  enable() {
    this.layoutInfo.editable.attr('contenteditable', true);
    this.invoke('toolbar.activate', true);
    this.triggerEvent('disable', false);
    this.options.editing = true;
  }

  disable() {
    // close codeview if codeview is opend
    if (this.invoke('codeview.isActivated')) {
      this.invoke('codeview.deactivate');
    }
    this.layoutInfo.editable.attr('contenteditable', false);
    this.options.editing = false;
    this.invoke('toolbar.deactivate', true);

    this.triggerEvent('disable', true);
  }

  triggerEvent() {
    const namespace = lists.head(arguments);
    const args = lists.tail(lists.from(arguments));

    const callback = this.options.callbacks[func.namespaceToCamel(namespace, 'on')];
    if (callback) {
      callback.apply(this.noteEl, args);
    }
    this.noteEl.dispatchEvent(new CustomEvent('summernote.' + namespace, {
      detail: args,
    }));
  }

  initializeModule(key) {
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

  module(key, ModuleClass, withoutIntialize) {
    if (arguments.length === 1) {
      return this.modules[key];
    }

    this.modules[key] = new ModuleClass(this);

    if (!withoutIntialize) {
      this.initializeModule(key);
    }
  }

  removeModule(key) {
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

  memo(key, obj) {
    if (arguments.length === 1) {
      return this.memos[key];
    }
    this.memos[key] = obj;
  }

  removeMemo(key) {
    if (this.memos[key] && this.memos[key].destroy) {
      this.memos[key].destroy();
    }

    delete this.memos[key];
  }

  /**
   * Some buttons need to change their visual style immediately once they get pressed
   */
  createInvokeHandlerAndUpdateState(namespace, value) {
    return (domEvent) => {
      this.createInvokeHandler(namespace, value)(domEvent);
      this.invoke('buttons.updateCurrentStyle');
    };
  }

  createInvokeHandler(namespace, value) {
    return (domEvent) => {
      domEvent.preventDefault();
      const targetEl = domEvent.target;
      const dataValueEl = targetEl.closest('[data-value]');
      const dataValue = dataValueEl && dataValueEl.getAttribute('data-value');
      this.invoke(namespace, value || dataValue, targetEl);
    };
  }

  invoke() {
    const namespace = lists.head(arguments);
    const args = lists.tail(lists.from(arguments));

    const splits = namespace.split('.');
    const hasSeparator = splits.length > 1;
    const moduleName = hasSeparator && lists.head(splits);
    const methodName = hasSeparator ? lists.last(splits) : lists.head(splits);

    const module = this.modules[moduleName || 'editor'];
    if (!moduleName && this[methodName]) {
      return this[methodName].apply(this, args);
    } else if (module && module[methodName] && module.shouldInitialize()) {
      return module[methodName].apply(module, args);
    }
  }
}
