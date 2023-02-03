import lists from '../core/lists.ts';
import dom from '../core/dom.ts';
import func from "../core/func.ts";
import Summernote from "../class";

/**
 * Image popover module
 *  mouse events that show/hide popover will be handled by Handle.js.
 *  Handle.js will receive the events and invoke 'imagePopover.update'.
 */
export default class ImagePopover {
  constructor(context) {
    this.context = context;
    this.ui = Summernote.meta.ui;

    this.options = context.options;

    this.events = {
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
    return !lists.isEmpty(this.options.popover.image);
  }

  initialize() {
    this.popoverEl = this.ui.popover({
      className: 'note-image-popover',
    }).render2();
    this.options.container.appendChild(this.popoverEl);
    const contentEl = this.popoverEl.querySelector('.popover-content, .note-popover-content');
    this.context.invoke('buttons.build', contentEl, this.options.popover.image);

    this.popoverEl.addEventListener('mousedown', (domEvent) => { domEvent.preventDefault(); });
  }

  destroy() {
    this.popoverEl.remove();
  }

  update(target, domEvent) {
    if (dom.isImg(target)) {
      const position = func.getElementOffset(target);
      const containerOffset = func.getElementOffset(this.options.container);
      let pos = {};
      if (this.options.popatmouse) {
        pos.left = domEvent.pageX - 20;
        pos.top = domEvent.pageY;
      } else {
        pos = position;
      }
      pos.top -= containerOffset.top;
      pos.left -= containerOffset.left;

      this.popoverEl.style.display = 'block';
      this.popoverEl.style.left = pos.left + 'px';
      this.popoverEl.style.top = pos.top + 'px';
    } else {
      this.hide();
    }
  }

  hide() {
    this.popoverEl.style.display = 'none';
  }
}
