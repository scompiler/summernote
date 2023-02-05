import lists from '../core/lists';
import func from '../core/func';
import Summernote from "../class";
import Context from "../Context";
import { Options, UserInterface } from "../core/types";

const AIRMODE_POPOVER_X_OFFSET = -5;
const AIRMODE_POPOVER_Y_OFFSET = 5;

export default class AirPopover {
    context: Context;

    ui: UserInterface;

    options: Options;

    popoverEl: HTMLElement | null = null;

    hidable = true;

    onContextmenu = false;

    pageX: number | null = null;

    pageY: number | null = null;

    events = {
        'summernote.contextmenu': (customEvent: CustomEvent<[MouseEvent]>) => {
            const domEvent = customEvent.detail[0];

            if (this.options.editing) {
                domEvent.preventDefault();
                domEvent.stopPropagation();
                this.onContextmenu = true;
                this.update(true);
            }
        },
        'summernote.mousedown': (customEvent: CustomEvent<[MouseEvent]>) => {
            const domEvent = customEvent.detail[0];

            this.pageX = domEvent.pageX;
            this.pageY = domEvent.pageY;
        },
        'summernote.keyup summernote.mouseup summernote.scroll': (customEvent: CustomEvent<[MouseEvent|KeyboardEvent]>) => {
            const domEvent = customEvent.detail[0];

            if (this.options.editing && !this.onContextmenu) {
                if (domEvent.type == 'keyup') {
                    const range = this.context.invoke('editor.getLastRange');
                    const wordRange = range.getWordRange();
                    const bnd = func.rect2bnd(lists.last(wordRange.getClientRects()));
                    this.pageX = bnd.left;
                    this.pageY = bnd.top;
                } else if (domEvent instanceof MouseEvent) {
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

    constructor(context: Context) {
        this.context = context;
        this.ui = Summernote.meta.ui;
        this.options = context.options;
    }

    shouldInitialize() {
        return this.options.airMode && !lists.isEmpty(this.options.popover.air);
    }

    initialize() {
        const popoverEl = this.ui.popover({
            className: 'note-air-popover',
        }).render2();

        if (!(popoverEl instanceof HTMLElement)) {
            throw new Error('Popover must be of type HTMLElement');
        }

        this.popoverEl = popoverEl;

        this.containerEl.appendChild(this.popoverEl);

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

    update(forcelyOpen = false) {
        const styleInfo = this.context.invoke('editor.currentStyle');
        if (styleInfo.range && (!styleInfo.range.isCollapsed() || forcelyOpen)) {
            const rect = {
                left: this.pageX,
                top: this.pageY,
            };

            const containerRect = this.containerEl.getBoundingClientRect();
            const containerOffset = {
                top: containerRect.top + this.containerEl.ownerDocument.defaultView.scrollY,
                left: containerRect.left + this.containerEl.ownerDocument.defaultView.scrollX,
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

    updateCodeview(isCodeview = false) {
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

    private get containerEl(): HTMLElement {
        if (!(this.options.container instanceof HTMLElement)) {
            throw new Error('Container must be of type HTMLElement');
        }

        return this.options.container;
    }
}
