import lists from '../core/lists';
import dom from '../core/dom';
import func from "../core/func";

/**
 * Image popover module
 *  mouse events that show/hide popover will be handled by Handle.js.
 *  Handle.js will receive the events and invoke 'imagePopover.update'.
 */
export default class ImagePopover {
  constructor(context) {
    this.context = context;
    this.ui = func.getJquery().summernote.ui;

    this.options = context.options;

    this.events = {
      'summernote.disable summernote.dialog.shown': () => {
        this.hide();
      },
      'summernote.blur': (we, event) => {
        if (event.originalEvent && event.originalEvent.relatedTarget) {
          if (!this.popoverEl.contains(event.originalEvent.relatedTarget)) {
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
    func.jqueryToHtmlElement(this.options.container).appendChild(this.popoverEl);
    const contentEl = this.popoverEl.querySelector('.popover-content, .note-popover-content');
    this.context.invoke('buttons.build', contentEl, this.options.popover.image);

    this.popoverEl.addEventListener('mousedown', (event) => { event.preventDefault(); });
  }

  destroy() {
    this.popoverEl.remove();
  }

  update(target, event) {
    if (dom.isImg(target)) {
      const position = func.getElementOffset(target);
      const containerOffset = func.getElementOffset(func.jqueryToHtmlElement(this.options.container));
      let pos = {};
      if (this.options.popatmouse) {
        pos.left = event.pageX - 20;
        pos.top = event.pageY;
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
