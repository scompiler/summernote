import func from "../core/func";
import Context from "../Context";
import { Options } from "../core/types";

export default class Placeholder {
    context: Context;

    editingAreaEl: HTMLElement;

    options: Options;

    placeholderEl: HTMLElement;

    events = {
        'summernote.init summernote.change': () => {
            this.update();
        },
        'summernote.codeview.toggled': () => {
            this.update();
        },
    };

    constructor(context: Context) {
        this.context = context;

        this.editingAreaEl = context.layoutInfo.editingAreaEl;
        this.options = context.options;

        if (this.options.inheritPlaceholder === true) {
            // get placeholder value from the original element
            this.options.placeholder = this.context.noteEl.getAttribute('placeholder') || this.options.placeholder;
        }
    }

    shouldInitialize() {
        return !!this.options.placeholder;
    }

    initialize() {
        this.placeholderEl = func.makeElement('<div class="note-placeholder"></div>');
        this.placeholderEl.innerHTML = this.options.placeholder;
        this.placeholderEl.addEventListener('click', () => {
            this.context.invoke('focus');
        });

        this.editingAreaEl.insertBefore(this.placeholderEl, this.editingAreaEl.firstChild);

        this.update();
    }

    destroy() {
        this.editingAreaEl.remove();
    }

    update() {
        const isShow = !this.context.invoke('codeview.isActivated') && this.context.invoke('editor.isEmpty');

        if (isShow) {
            this.placeholderEl.style.display = 'block';
        } else {
            this.placeholderEl.style.display = 'none';
        }
    }
}
