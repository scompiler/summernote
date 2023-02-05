import lists from '../core/lists';
import dom from '../core/dom';
import Summernote from '../class';
import Context from "../Context";
import { Options, UserInterface } from "../core/types";

export default class LinkPopover {
    context: Context;

    ui: UserInterface;

    options: Options;

    popoverEl: HTMLElement;

    events = {
        'summernote.keyup summernote.mouseup summernote.change summernote.scroll': () => {
            this.update();
        },
        'summernote.disable summernote.dialog.shown': () => {
            this.hide();
        },
        'summernote.blur': (customEvent: CustomEvent<[FocusEvent]>) => {
            const domEvent = customEvent.detail[0];

            if (domEvent && domEvent.relatedTarget instanceof Node) {
                if (!this.popoverEl.contains(domEvent.relatedTarget)) {
                    this.hide();
                }
            } else {
                this.hide();
            }
        },
    };

    constructor(context: Context) {
        this.context = context;

        /** @type {HTMLElement|null} */
        this.popoverEl = null;
        this.ui = Summernote.meta.ui;
        this.options = context.options;
    }

    shouldInitialize() {
        return !lists.isEmpty(this.options.popover.link);
    }

    initialize() {
        const popoverEl = this.ui.popover({
            className: 'note-link-popover',
            callback2: (rootEls) => {
                const contentEls = rootEls.map(x => x instanceof Element && x.querySelector('.popover-content,.note-popover-content')).filter(x => x);
                const spanEl = document.createElement('span');

                spanEl.innerHTML = '<a target="_blank"></a>&nbsp;';

                contentEls.forEach((contentEl) => contentEl.insertBefore(spanEl, contentEl.firstChild));
            },
        }).render2();

        if (!(popoverEl instanceof HTMLElement)) {
            throw new Error('Popover must be of type HTMLElement');
        }

        this.popoverEl = popoverEl;

        this.containerEl.appendChild(this.popoverEl);

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
            const anchor = dom.ancestor(rng.sc, dom.isAnchor);

            if (!(anchor instanceof HTMLElement)) {
                throw new Error('Anchor must be of type HTMLElement');
            }

            const href = anchor.getAttribute('href');
            const a = this.popoverEl.querySelector('a');

            a.setAttribute('href', href);
            a.textContent = href;

            const pos = dom.posFromPlaceholder(anchor);
            const containerRect = this.containerEl.getBoundingClientRect();
            const containerOffset = {
                top: containerRect.top + this.containerEl.ownerDocument.defaultView.scrollY,
                left: containerRect.left + this.containerEl.ownerDocument.defaultView.scrollX,
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

    private get containerEl(): HTMLElement {
        if (!(this.options.container instanceof HTMLElement)) {
            throw new Error('Container must be of type HTMLElement');
        }

        return this.options.container;
    }
}
