import func from '../core/func';
import lists from '../core/lists';
import dom from '../core/dom';
import range, { WrappedRange } from '../core/range';
import key from '../core/key';
import Summernote from "../class";
import Context from "../Context";
import { Hint, Options, UserInterface } from "../core/types";

const POPOVER_DIST = 5;

interface HintItem extends HTMLElement {
    __item: any;
}

export default class HintPopover {
    context: Context;

    ui: UserInterface;

    editableEl: HTMLElement;

    options: Options;

    hint: Hint | Hint[];

    hints: Hint[];

    direction: 'bottom' | 'top';

    lastWordRange: WrappedRange | null;

    matchingWord: string | null;

    popoverEl: HTMLElement;

    contentEl: HTMLElement;

    events = {
        'summernote.keyup': (customEvent: CustomEvent<[KeyboardEvent]>) => {
            const domEvent = customEvent.detail[0];

            if (!domEvent.defaultPrevented) {
                this.handleKeyup(domEvent);
            }
        },
        'summernote.keydown': (customEvent: CustomEvent<[KeyboardEvent]>) => {
            const domEvent = customEvent.detail[0];

            this.handleKeydown(domEvent);
        },
        'summernote.disable summernote.dialog.shown summernote.blur': () => {
            this.hide();
        },
    };

    constructor(context: Context) {
        this.context = context;

        this.ui = Summernote.meta.ui;
        this.editableEl = context.layoutInfo.editableEl;
        this.options = context.options;
        this.hint = this.options.hint || [];
        this.direction = this.options.hintDirection || 'bottom';
        this.hints = Array.isArray(this.hint) ? this.hint : [this.hint];
    }

    shouldInitialize() {
        return this.hints.length > 0;
    }

    initialize() {
        const popoverEl = this.ui.popover({
            className: 'note-hint-popover',
            hideArrow: true,
            direction: '',
        }).render2();

        if (!(popoverEl instanceof HTMLElement)) {
            throw new Error('Popover must be of type HTMLElement');
        }

        this.lastWordRange = null;
        this.matchingWord = null;
        this.popoverEl = popoverEl;
        this.containerEl.appendChild(this.popoverEl);

        this.popoverEl.style.display = 'none';
        this.contentEl = this.popoverEl.querySelector('.popover-content, .note-popover-content');
        this.contentEl.addEventListener('click', (domEvent) => {
            const itemEl = domEvent.target instanceof Element && domEvent.target.closest('.note-hint-item');

            if (!itemEl) {
                return;
            }

            const currentEl = this.contentEl.querySelector('.active');

            if (currentEl) {
                currentEl.classList.remove('active');
            }

            itemEl.classList.add('active');

            this.replace();
        });

        this.popoverEl.addEventListener('mousedown', (domEvent) => { domEvent.preventDefault(); });
    }

    destroy() {
        this.popoverEl.remove();
    }

    selectItem(itemEl: Element) {
        const currentEl = this.contentEl.querySelector('.active');

        if (currentEl) {
            currentEl.classList.remove('active');
        }

        itemEl.classList.add('active');
        if (itemEl instanceof HTMLElement) {
            this.contentEl.scrollTop = itemEl.offsetTop - (this.contentEl.offsetHeight / 2);
        }
    }

    moveDown() {
        const currentEl = this.contentEl.querySelector('.note-hint-item.active');
        let nextEl = currentEl.nextElementSibling;

        if (nextEl) {
            this.selectItem(nextEl);
        } else {
            let nextGroupEl = currentEl.parentElement && currentEl.parentElement.nextElementSibling;

            if (!nextGroupEl) {
                nextGroupEl = [].slice.call(this.contentEl.querySelectorAll('.note-hint-group')).shift();
            }

            nextEl = [].slice.call(nextGroupEl.querySelectorAll('.note-hint-item')).shift();

            this.selectItem(nextEl);
        }
    }

    moveUp() {
        const currentEl = this.contentEl.querySelector('.note-hint-item.active');
        let prevEl = currentEl.previousElementSibling;

        if (prevEl) {
            this.selectItem(prevEl);
        } else {
            let prevGroupEl = currentEl.parentElement && currentEl.parentElement.previousElementSibling;

            if (!prevGroupEl) {
                prevGroupEl = [].slice.call(this.contentEl.querySelectorAll('.note-hint-group')).pop();
            }

            prevEl = [].slice.call(prevGroupEl.querySelectorAll('.note-hint-item')).pop();

            this.selectItem(prevEl);
        }
    }

    replace() {
        const itemEl: HintItem = this.contentEl.querySelector('.note-hint-item.active');

        if (itemEl) {
            const node = this.nodeFromItem(itemEl);
            // If matchingWord length = 0 -> capture OK / open hint / but as mention capture "" (\w*)
            if (this.matchingWord !== null && this.matchingWord.length === 0) {
                this.lastWordRange.so = this.lastWordRange.eo;
                // Else si > 0 and normal case -> adjust range "before" for correct position of insertion
            } else if (this.matchingWord !== null && this.matchingWord.length > 0 && !this.lastWordRange.isCollapsed()) {
                const rangeCompute = this.lastWordRange.eo - this.lastWordRange.so - this.matchingWord.length;
                if (rangeCompute > 0) {
                    this.lastWordRange.so += rangeCompute;
                }
            }
            this.lastWordRange.insertNode(node);

            if (this.options.hintSelect === 'next') {
                const blank = document.createTextNode('');
                node.parentNode.insertBefore(blank, node.nextSibling);
                range.createFromNodeBefore(blank).select();
            } else {
                range.createFromNodeAfter(node).select();
            }

            this.lastWordRange = null;
            this.hide();
            this.context.invoke('editor.focus');
            this.context.triggerEvent('change', this.editableEl.innerHTML, this.editableEl);
        }
    }

    nodeFromItem(itemEl: HintItem) {
        const hint = this.hints[parseFloat(itemEl.getAttribute('data-index'))];
        const item = itemEl.__item;
        let node = hint.content ? hint.content(item) : item;
        if (typeof node === 'string') {
            node = dom.createText(node);
        }
        return node;
    }

    createItemTemplates(hintIdx: number, items: any[]) {
        const hint = this.hints[hintIdx];
        return items.map((item , idx) => {
            const itemEl = func.makeElement('<div class="note-hint-item"></div>') as HintItem;

            itemEl.innerHTML = hint.template ? hint.template(item) : item + '';
            itemEl.setAttribute('data-index', hintIdx.toString());
            itemEl.__item = item;

            if (hintIdx === 0 && idx === 0) {
                itemEl.classList.add('active');
            }

            return itemEl;
        });
    }

    handleKeydown(domEvent: KeyboardEvent) {
        const isVisible = !!(this.popoverEl.offsetWidth || this.popoverEl.offsetHeight || this.popoverEl.getClientRects().length);
        if (!isVisible) {
            return;
        }

        if (domEvent.keyCode === key.code.ENTER) {
            domEvent.preventDefault();
            this.replace();
        } else if (domEvent.keyCode === key.code.UP) {
            domEvent.preventDefault();
            this.moveUp();
        } else if (domEvent.keyCode === key.code.DOWN) {
            domEvent.preventDefault();
            this.moveDown();
        }
    }

    searchKeyword(index: number, keyword: string, callback: (items?: any[]) => void) {
        const hint = this.hints[index];
        if (hint && hint.match.test(keyword) && hint.search) {
            const matches = hint.match.exec(keyword);
            this.matchingWord = matches[0];
            hint.search(matches[1], callback);
        } else {
            callback();
        }
    }

    createGroup(idx: number, keyword: string) {
        const groupEl = func.makeElement('<div class="note-hint-group note-hint-group-' + idx + '"></div>');
        this.searchKeyword(idx, keyword, (items) => {
            items = items || [];
            if (items.length) {
                this.createItemTemplates(idx, items).forEach((itemEl) => {
                    groupEl.appendChild(itemEl);
                });
                this.show();
            }
        });

        return groupEl;
    }

    handleKeyup(domEvent: KeyboardEvent) {
        if (!lists.contains([key.code.ENTER, key.code.UP, key.code.DOWN], domEvent.keyCode)) {
            const range = this.context.invoke('editor.getLastRange');
            let wordRange;
            let keyword: string;
            if (this.options.hintMode === 'words') {
                wordRange = range.getWordsRange(range);
                keyword = wordRange.toString();

                this.hints.forEach((hint) => {
                    if (hint.match.test(keyword)) {
                        wordRange = range.getWordsMatchRange(hint.match);
                        return false;
                    }
                });

                if (!wordRange) {
                    this.hide();
                    return;
                }

                keyword = wordRange.toString();
            } else {
                wordRange = range.getWordRange();
                keyword = wordRange.toString();
            }

            if (this.hints.length && keyword) {
                this.contentEl.innerHTML = '';

                const bnd = func.rect2bnd(lists.last(wordRange.getClientRects()));
                const containerOffset = func.getElementOffset(this.containerEl);
                if (bnd) {
                    bnd.top -= containerOffset.top;
                    bnd.left -= containerOffset.left;

                    this.popoverEl.style.display = 'none';
                    this.lastWordRange = wordRange;
                    this.hints.forEach((hint, idx) => {
                        if (hint.match.test(keyword)) {
                            this.contentEl.appendChild(this.createGroup(idx, keyword));
                        }
                    });
                    // select first .note-hint-item
                    const firstEl = this.contentEl.querySelector('.note-hint-item');

                    if (firstEl) {
                        firstEl.classList.add('active');
                    }

                    // set position for popover after group is created
                    if (this.direction === 'top') {
                        this.popoverEl.style.left = bnd.left + 'px';
                        this.popoverEl.style.top = (bnd.top - this.popoverEl.offsetHeight - POPOVER_DIST) + 'px';
                    } else {
                        this.popoverEl.style.left = bnd.left + 'px';
                        this.popoverEl.style.top = (bnd.top + bnd.height + POPOVER_DIST) + 'px';
                    }
                }
            } else {
                this.hide();
            }
        }
    }

    show() {
        this.popoverEl.style.display = 'block';
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
