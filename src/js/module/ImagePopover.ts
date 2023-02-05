import lists from '../core/lists';
import dom from '../core/dom';
import func from "../core/func";
import Summernote from "../class";
import Context from "../Context";
import { Options, UserInterface } from "../core/types";

/**
 * Image popover module
 *  mouse events that show/hide popover will be handled by Handle.js.
 *  Handle.js will receive the events and invoke 'imagePopover.update'.
 */
export default class ImagePopover {
    context: Context;

    ui: UserInterface;

    options: Options;

    popoverEl: HTMLElement;

    events = {
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
        this.ui = Summernote.meta.ui;
        this.options = context.options;
    }

    shouldInitialize() {
        return !lists.isEmpty(this.options.popover.image);
    }

    initialize() {
        const popoverEl = this.ui.popover({
            className: 'note-image-popover',
        }).render2();

        if (!(popoverEl instanceof HTMLElement)) {
            throw new Error('Popover must be of type HTMLElement');
        }

        this.popoverEl = popoverEl;
        this.containerEl.appendChild(this.popoverEl);
        const contentEl = this.popoverEl.querySelector('.popover-content, .note-popover-content');
        this.context.invoke('buttons.build', contentEl, this.options.popover.image);

        this.popoverEl.addEventListener('mousedown', (domEvent) => { domEvent.preventDefault(); });
    }

    destroy() {
        this.popoverEl.remove();
    }

    update(target: HTMLImageElement, domEvent: MouseEvent) {
        if (dom.isImg(target)) {
            const position = func.getElementOffset(target);
            const containerOffset = func.getElementOffset(this.containerEl);
            const pos = this.options.popatmouse ? {
                left: domEvent.pageX - 20,
                top: domEvent.pageY,
            } : position;

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
