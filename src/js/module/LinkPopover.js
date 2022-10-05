import lists from '../core/lists';
import dom from '../core/dom';
import func from "../core/func";

export default class LinkPopover {
  constructor(context) {
    this.context = context;

    /** @type {HTMLElement|null} */
    this.popoverEl = null;
    this.ui = func.getJquery().summernote.ui;
    this.options = context.options;
    this.events = {
      'summernote.keyup summernote.mouseup summernote.change summernote.scroll': () => {
        this.update();
      },
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
    return !lists.isEmpty(this.options.popover.link);
  }

  initialize() {
    this.popoverEl = this.ui.popover({
      className: 'note-link-popover',
      callback2: (rootEl) => {
        const contentEl = rootEl.querySelector('.popover-content,.note-popover-content');
        const spanEl = document.createElement('span');

        spanEl.innerHTML = '<a target="_blank"></a>&nbsp;';

        contentEl.insertBefore(spanEl, contentEl.firstChild);
      },
    }).render2();
    const containerEl = func.jqueryToHtmlElement(this.options.container);

    containerEl.appendChild(this.popoverEl);

    const contentEl = this.popoverEl.querySelector('.popover-content,.note-popover-content');

    this.context.invoke('buttons.build', contentEl, this.options.popover.link);

    this.popoverEl.addEventListener('mousedown', (event) => {
      event.preventDefault();
    });
  }

  destroy() {
    this.popoverEl.remove();
  }

  update() {
    // Prevent focusing on editable when invoke('code') is executed
    if (!this.context.invoke('editor.hasFocus')) {
      this.hide();
      return;
    }

    const rng = this.context.invoke('editor.getLastRange');
    if (rng.isCollapsed() && rng.isOnAnchor()) {
      /** @type {HTMLElement} */
      const anchor = dom.ancestor(rng.sc, dom.isAnchor);
      const href = anchor.getAttribute('href');
      const a = this.popoverEl.querySelector('a');

      a.setAttribute('href', href);
      a.innerText = href;

      const pos = dom.posFromPlaceholder(anchor);
      const containerEl = func.jqueryToHtmlElement(this.options.container);
      const containerRect = containerEl.getBoundingClientRect();
      const containerOffset = {
        top: containerRect.top + containerEl.ownerDocument.defaultView.scrollY,
        left: containerRect.left + containerEl.ownerDocument.defaultView.scrollX,
      };
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
