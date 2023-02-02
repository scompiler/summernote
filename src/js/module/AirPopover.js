import lists from '../core/lists';
import func from '../core/func.ts';
import Summernote from "../class";

const AIRMODE_POPOVER_X_OFFSET = -5;
const AIRMODE_POPOVER_Y_OFFSET = 5;

export default class AirPopover {
  constructor(context) {
    this.context = context;
    this.ui = Summernote.meta.ui;
    this.options = context.options;
    /** @type {HTMLElement | null} */
    this.popoverEl = null;

    this.hidable = true;
    this.onContextmenu = false;
    this.pageX = null;
    this.pageY = null;

    this.events = {
      'summernote.contextmenu': (customEvent) => {
        const domEvent = customEvent.detail[0];

        if (this.options.editing) {
          domEvent.preventDefault();
          domEvent.stopPropagation();
          this.onContextmenu = true;
          this.update(true);
        }
      },
      'summernote.mousedown': (customEvent) => {
        const domEvent = customEvent.detail[0];

        this.pageX = domEvent.pageX;
        this.pageY = domEvent.pageY;
      },
      'summernote.keyup summernote.mouseup summernote.scroll': (customEvent) => {
        const domEvent = customEvent.detail[0];

        if (this.options.editing && !this.onContextmenu) {
          if (domEvent.type == 'keyup') {
            let range = this.context.invoke('editor.getLastRange');
            let wordRange = range.getWordRange();
            const bnd = func.rect2bnd(lists.last(wordRange.getClientRects()));
            this.pageX = bnd.left;
            this.pageY = bnd.top;
          } else {
            this.pageX = domEvent.pageX;
            this.pageY = domEvent.pageY;
          }
          this.update();
        }
        this.onContextmenu = false;
      },
      'summernote.disable summernote.change summernote.dialog.shown summernote.blur': () => {
        this.hide();
      },
      'summernote.focusout': () => {
        const activeEls = [].slice.call(this.popoverEl.parentElement.querySelectorAll(':focus, :active'));

        if (!activeEls.includes(this.popoverEl)) {
          this.hide();
        }
      },
    };
  }

  shouldInitialize() {
    return this.options.airMode && !lists.isEmpty(this.options.popover.air);
  }

  initialize() {
    this.popoverEl = this.ui.popover({
      className: 'note-air-popover',
    }).render2();

    this.options.container.appendChild(this.popoverEl);

    const contentEl = this.popoverEl.querySelector('.popover-content');

    this.context.invoke('buttons.build', contentEl, this.options.popover.air);

    // disable hiding this popover preemptively by 'summernote.blur' event.
    this.popoverEl.addEventListener('mousedown', () => { this.hidable = false; });
    // (re-)enable hiding after 'summernote.blur' has been handled (aka. ignored).
    this.popoverEl.addEventListener('mouseup', () => { this.hidable = true; });
  }

  destroy() {
    this.popoverEl.remove();
  }

  update(forcelyOpen) {
    const styleInfo = this.context.invoke('editor.currentStyle');
    if (styleInfo.range && (!styleInfo.range.isCollapsed() || forcelyOpen)) {
      let rect = {
        left: this.pageX,
        top: this.pageY,
      };

      const containerEl = this.options.container;
      const containerRect = containerEl.getBoundingClientRect();
      const containerOffset = {
        top: containerRect.top + containerEl.ownerDocument.defaultView.scrollY,
        left: containerRect.left + containerEl.ownerDocument.defaultView.scrollX,
      };
      rect.top -= containerOffset.top;
      rect.left -= containerOffset.left;

      this.popoverEl.style.display = 'block';
      this.popoverEl.style.left = (Math.max(rect.left, 0) + AIRMODE_POPOVER_X_OFFSET) + 'px';
      this.popoverEl.style.top = (rect.top + AIRMODE_POPOVER_Y_OFFSET) + 'px';

      this.context.invoke('buttons.updateCurrentStyle', this.popoverEl);
    } else {
      this.hide();
    }
  }

  updateCodeview(isCodeview) {
    const buttonEl = this.popoverEl.querySelector('.btn-codeview');

    if (buttonEl) {
      this.ui.toggleBtnActive(buttonEl, isCodeview);
    }
    if (isCodeview) {
      this.hide();
    }
  }

  hide() {
    if (this.hidable) {
      this.popoverEl.style.display = 'none';
    }
  }
}
