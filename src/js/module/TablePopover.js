import env from '../core/env';
import lists from '../core/lists';
import dom from '../core/dom';
import func from "../core/func";
import Summernote from "../class";

export default class TablePopover {
  constructor(context) {
    this.context = context;

    this.ui = Summernote.meta.ui;
    this.options = context.options;
    this.events = {
      'summernote.mousedown': (customEvent) => {
        const domEvent = customEvent.detail[0];

        this.update(domEvent.target);
      },
      'summernote.keyup summernote.scroll summernote.change': () => {
        this.update();
      },
      'summernote.disable summernote.dialog.shown': () => {
        this.hide();
      },
      'summernote.blur': (customEvent) => {
        const domEvent = customEvent.detail[0];

        if (domEvent && domEvent.relatedTarget) {
          if (!this.popoverEl.contains(domEvent.relatedTarget)) {
            this.hide();
          }
        } else {
          this.hide();
        }
      },
    };
  }

  shouldInitialize() {
    return !lists.isEmpty(this.options.popover.table);
  }

  initialize() {
    this.popoverEl = this.ui.popover({
      className: 'note-table-popover',
    }).render2();
    this.options.container.appendChild(this.popoverEl);
    const contentEl = this.popoverEl.querySelector('.popover-content, .note-popover-content');

    this.context.invoke('buttons.build', contentEl, this.options.popover.table);

    // [workaround] Disable Firefox's default table editor
    if (env.isFF) {
      document.execCommand('enableInlineTableEditing', false, false);
    }

    this.popoverEl.addEventListener('mousedown', (domEvent) => { domEvent.preventDefault(); });
  }

  destroy() {
    this.popoverEl.remove();
  }

  update(target) {
    if (this.context.isDisabled()) {
      return false;
    }

    const isCell = dom.isCell(target) || dom.isCell(target?.parentElement);

    if (isCell) {
      const pos = dom.posFromPlaceholder(target);
      const containerOffset = func.getElementOffset(this.options.container);
      pos.top -= containerOffset.top;
      pos.left -= containerOffset.left;

      this.popoverEl.style.display = 'block';
      this.popoverEl.style.left = pos.left + 'px';
      this.popoverEl.style.top = pos.top + 'px';
    } else {
      this.hide();
    }

    return isCell;
  }

  hide() {
    this.popoverEl.style.display = 'none';
  }
}
