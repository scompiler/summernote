import Context from "../Context";

export default class Fullscreen {
    context: Context;

    editorEl: HTMLElement;

    toolbarEl: HTMLElement;

    editableEl: HTMLElement;

    codableEl: HTMLTextAreaElement;

    scrollbarClassName = 'note-fullscreen-body';

    constructor(context: Context) {
        this.context = context;

        this.editorEl = context.layoutInfo.editorEl;
        this.toolbarEl = context.layoutInfo.toolbarEl;
        this.editableEl = context.layoutInfo.editableEl;
        this.codableEl = context.layoutInfo.codableEl;
    }

    onResize = () => {
        const toolbarHeight = this.toolbarEl ? this.toolbarEl.offsetHeight : 0;

        this.resizeTo({
            h: (window.innerHeight - toolbarHeight) + 'px',
        });
    };

    resizeTo(size: {h: string}) {
        this.editableEl.style.height = size.h;
        this.codableEl.style.height = size.h;

        // TODO: It's better to trigger the resize event and set the codemirror size inside the corresponding module.
        if ('__cmEditorInstance' in this.codableEl && this.codableEl.__cmEditorInstance) {
            (this.codableEl.__cmEditorInstance as any).setsize(null, size.h);
        }
    }

    /**
     * toggle fullscreen
     */
    toggle() {
        if (this.isFullscreen()) {
            this.editorEl.removeAttribute('data-fullscreen');
        } else {
            this.editorEl.setAttribute('data-fullscreen', 'true');
        }

        const isFullscreen = this.isFullscreen();
        document.documentElement.classList.toggle(this.scrollbarClassName, isFullscreen);
        if (isFullscreen) {
            this.editableEl.setAttribute('data-height', this.editableEl.style.height);
            this.editableEl.setAttribute('data-max-height', this.editableEl.style.maxHeight);
            this.editableEl.style.maxHeight = '';

            window.addEventListener('resize', this.onResize);
            this.onResize();
        } else {
            window.removeEventListener('resize', this.onResize);
            this.resizeTo({
                h: this.editableEl.getAttribute('data-height'),
            });
            this.editableEl.style.maxHeight = this.editableEl.getAttribute('data-max-height');
        }

        this.context.invoke('toolbar.updateFullscreen', isFullscreen);
    }

    isFullscreen() {
        return this.editorEl.getAttribute('data-fullscreen') === 'true';
    }

    destroy() {
        document.documentElement.classList.remove(this.scrollbarClassName);
    }
}
