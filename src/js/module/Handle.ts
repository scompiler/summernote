import dom from '../core/dom';
import func from "../core/func";
import Context from "../Context";
import { Options } from "../core/types";

export default class Handle {
    context: Context;

    editingAreaEl: HTMLElement;

    options: Options;

    lang: Options['langInfo'];

    handleEl: HTMLElement;

    selectionEl: HTMLElement & {__target: HTMLElement};

    events = {
        'summernote.mousedown': (customEvent: CustomEvent<[MouseEvent]>) => {
            const domEvent = customEvent.detail[0];

            if (this.update(domEvent.target, domEvent)) {
                domEvent.preventDefault();
            }
        },
        'summernote.keyup summernote.scroll summernote.change summernote.dialog.shown': () => {
            this.update();
        },
        'summernote.disable summernote.blur': () => {
            this.hide();
        },
        'summernote.codeview.toggled': () => {
            this.update();
        },
    };

    constructor(context: Context) {
        this.context = context;
        this.editingAreaEl = context.layoutInfo.editingAreaEl;
        this.options = context.options;
        this.lang = this.options.langInfo;
    }

    initialize() {
        this.handleEl = (() => {
            const div = document.createElement('div');

            div.innerHTML = [
                '<div class="note-handle">',
                    '<div class="note-control-selection">',
                        '<div class="note-control-selection-bg"></div>',
                        '<div class="note-control-holder note-control-nw"></div>',
                        '<div class="note-control-holder note-control-ne"></div>',
                        '<div class="note-control-holder note-control-sw"></div>',
                        '<div class="',
                            (this.options.disableResizeImage ? 'note-control-holder' : 'note-control-sizing'),
                        ' note-control-se"></div>',
                        (this.options.disableResizeImage ? '' : '<div class="note-control-selection-info"></div>'),
                    '</div>',
                '</div>',
            ].join('');

            return div.firstElementChild as HTMLElement;
        })();
        this.selectionEl = this.handleEl.querySelector('.note-control-selection');
        this.editingAreaEl.insertBefore(this.handleEl, this.editingAreaEl.firstChild);

        this.handleEl.addEventListener('mousedown', (domEvent: MouseEvent) => {
            if (domEvent.target instanceof Node && dom.isControlSizing(domEvent.target)) {
                domEvent.preventDefault();
                domEvent.stopPropagation();

                const targetEl = this.selectionEl.__target;
                const posStart = func.getElementOffset(targetEl);
                const scrollTop = document.scrollingElement.scrollTop;

                const onMouseMove = (domEventMove: MouseEvent) => {
                    this.context.invoke('editor.resizeTo', {
                        x: domEventMove.clientX - posStart.left,
                        y: domEventMove.clientY - (posStart.top - scrollTop),
                    }, targetEl, !domEventMove.shiftKey);

                    this.update(targetEl, domEventMove);
                };

                const onMouseUp = (domEventUp: MouseEvent) => {
                    domEventUp.preventDefault();

                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                    this.context.invoke('editor.afterCommand');
                };

                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);

                if (!targetEl.hasAttribute('data-ratio')) { // original ratio.
                    targetEl.setAttribute('data-ratio', (targetEl.offsetHeight / targetEl.offsetWidth).toString());
                }
            }
        });

        // Listen for scrolling on the handle overlay.
        this.handleEl.addEventListener('wheel', (domEvent: MouseEvent) => {
            domEvent.preventDefault();
            this.update();
        });
    }

    destroy() {
        this.handleEl.remove();
    }

    update(target?: EventTarget, domEvent?: MouseEvent) {
        if (this.context.isDisabled()) {
            return false;
        }

        const imageEl = target;
        const isImage = imageEl instanceof HTMLImageElement && dom.isImg(imageEl);

        this.context.invoke('imagePopover.update', imageEl, domEvent);

        if (isImage) {
            const areaRect = this.editingAreaEl.getBoundingClientRect();
            const imageRect = imageEl.getBoundingClientRect();

            this.selectionEl.style.display = 'block';
            this.selectionEl.style.left = (imageRect.left - areaRect.left) + 'px';
            this.selectionEl.style.top = (imageRect.top - areaRect.top) + 'px';
            this.selectionEl.style.width = imageRect.width + 'px';
            this.selectionEl.style.height = imageRect.height + 'px';
            this.selectionEl.__target = imageEl;

            const origImageObj = new Image();
            origImageObj.src = imageEl.src;

            this.selectionEl.querySelector('.note-control-selection-info').textContent = imageRect.width + 'x' + imageRect.height + ' (' + this.lang.image.original + ': ' + origImageObj.width + 'x' + origImageObj.height + ')';
            this.context.invoke('editor.saveTarget', imageEl);
        } else {
            this.hide();
        }

        return isImage;
    }

    /**
     * hide
     */
    hide() {
        this.context.invoke('editor.clearTarget');
        this.selectionEl.style.display = 'none';
    }
}
