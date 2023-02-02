import lists from '../core/lists.ts';
import dom from '../core/dom';
import Summernote from '../class';

export default class LinkPopover {
  constructor(context) {
    this.context = context;

    /** @type {HTMLElement|null} */
    this.popoverEl = null;
    this.ui = Summernote.meta.ui;
    this.options = context.options;
    this.events = {
      'summernote.keyup summernote.mouseup summernote.change summernote.scroll': () => {
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
    return !lists.isEmpty(this.options.popover.link);
  }

  initialize() {
    this.popoverEl = this.ui.popover({
      className: 'note-link-popover',
      callback2: (rootEls) => {
        const contentEls = rootEls.map(x => x.querySelector('.popover-content,.note-popover-content')).filter(x => x);
        const spanEl = document.createElement('span');

        spanEl.innerHTML = '<a target="_blank"></a>&nbsp;';

        contentEls.forEach((contentEl) => contentEl.insertBefore(spanEl, contentEl.firstChild));
      },
    }).render2();
    const containerEl = this.options.container;

    containerEl.appendChild(this.popoverEl);

    const contentEl = this.popoverEl.querySelector('.popover-content,.note-popover-content');

    this.context.invoke('buttons.build', contentEl, this.options.popover.link);

    this.popoverEl.addEventListener('mousedown', (domEvent) => {
      domEvent.preventDefault();
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
      a.textContent = href;

      const pos = dom.posFromPlaceholder(anchor);
      const containerEl = this.options.container;
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
