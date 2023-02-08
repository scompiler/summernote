import func from "../core/func";
import Context from "../Context";
import { Options } from "../core/types";

export default class Statusbar {
    statusbarEl: HTMLElement;

    editableEl: HTMLElement;

    codableEl: HTMLTextAreaElement;

    options: Options;

    constructor(context: Context) {
        this.statusbarEl = context.layoutInfo.statusbarEl;
        this.editableEl = context.layoutInfo.editableEl;
        this.codableEl = context.layoutInfo.codableEl;
        this.options = context.options;
    }

    initialize() {
        if (this.options.airMode || this.options.disableResizeEditor) {
            return;
        }

        this.statusbarEl.addEventListener('mousedown', this.onMouseDown);
    }

    destroy() {
        this.removeDocumentListeners();

        this.statusbarEl.removeEventListener('mousedown', this.onMouseDown);
        this.statusbarEl.classList.add('locked');
    }

    onMouseDown = (domEvent: MouseEvent) => {
        this.removeDocumentListeners();

        domEvent.preventDefault();
        domEvent.stopPropagation();

        const editableTop = func.getElementRect(this.editableEl).top - document.scrollingElement.scrollTop;
        const editableCodeTop = func.getElementRect(this.codableEl).top - document.scrollingElement.scrollTop;
        const statusbarTop = func.getElementRect(this.statusbarEl).top - document.scrollingElement.scrollTop;
        const mouseOffsetTop = domEvent.clientY - statusbarTop;

        this.onMouseMove = (domEventMove: MouseEvent) => {
            let height = domEventMove.clientY - (editableTop + mouseOffsetTop);
            let heightCode = domEventMove.clientY - (editableCodeTop + mouseOffsetTop);

            height = (this.options.minHeight > 0) ? Math.max(height, this.options.minHeight) : height;
            height = (this.options.maxHeight > 0) ? Math.min(height, this.options.maxHeight) : height;
            heightCode = (this.options.minHeight > 0) ? Math.max(heightCode, this.options.minHeight) : heightCode;
            heightCode = (this.options.maxHeight > 0) ? Math.min(heightCode, this.options.maxHeight) : heightCode;

            this.editableEl.style.height = height + 'px';
            this.codableEl.style.height = heightCode + 'px';
        };

        this.onMouseUp = () => this.removeDocumentListeners();

        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('mouseup', this.onMouseUp);
    };

    onMouseUp: (event: MouseEvent) => void = () => {};

    onMouseMove: (event: MouseEvent) => void = () => {};

    removeDocumentListeners() {
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);
    }
}
