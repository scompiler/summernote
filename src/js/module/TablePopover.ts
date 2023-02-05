import env from '../core/env';
import lists from '../core/lists';
import dom from '../core/dom';
import func from "../core/func";
import Summernote from "../class";
import Context from "../Context";
import { Options, UserInterface } from "../core/types";

export default class TablePopover {
    context: Context;

    ui: UserInterface;

    options: Options;

    popoverEl: HTMLElement;

    events = {
        'summernote.mousedown': (customEvent: CustomEvent<[MouseEvent]>) => {
            const domEvent = customEvent.detail[0];

            this.update(domEvent.target);
        },
        'summernote.keyup summernote.scroll summernote.change': () => {
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
        this.ui = Summernote.meta.ui;
        this.options = context.options;
    }

    shouldInitialize() {
        return !lists.isEmpty(this.options.popover.table);
    }

    initialize() {
        const popoverEl = this.ui.popover({
            className: 'note-table-popover',
        }).render2();

        if (!(popoverEl instanceof HTMLElement)) {
            throw new Error('Popover must be of type HTMLElement');
        }

        this.popoverEl = popoverEl;

        this.containerEl.appendChild(this.popoverEl);
        const contentEl = this.popoverEl.querySelector('.popover-content, .note-popover-content');

        this.context.invoke('buttons.build', contentEl, this.options.popover.table);

        // [workaround] Disable Firefox's default table editor
        if (env.isFF) {
            document.execCommand('enableInlineTableEditing', false, 'false');
        }

        this.popoverEl.addEventListener('mousedown', (domEvent) => { domEvent.preventDefault(); });
    }

    destroy() {
        this.popoverEl.remove();
    }

    update(target?: EventTarget) {
        if (this.context.isDisabled()) {
            return false;
        }

        if (!(target instanceof HTMLElement)) {
            return false;
        }

        const isCell = dom.isCell(target) || dom.isCell(target?.parentElement);

        if (isCell) {
            const pos = dom.posFromPlaceholder(target);
            const containerOffset = func.getElementOffset(this.containerEl);
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

    private get containerEl(): HTMLElement {
        if (!(this.options.container instanceof HTMLElement)) {
            throw new Error('Container must be of type HTMLElement');
        }

        return this.options.container;
    }
}
