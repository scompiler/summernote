import Context from "../Context";
import { Options, UserInterface } from "../core/types";

export default class Dropzone {
    context: Context;

    ui: UserInterface;

    editorEl: HTMLElement;

    editableEl: HTMLElement;

    options: Options;

    lang: Options['langInfo'];

    eventListenerEl: Node = document;

    documentEventHandlers: {[key: string]: (domEvent: Event) => void} = {};

    dropzoneEl: HTMLElement;

    constructor(context: Context) {
        this.context = context;
        this.editorEl = context.layoutInfo.editorEl;
        this.editableEl = context.layoutInfo.editableEl;
        this.options = context.options;
        this.lang = this.options.langInfo;

        this.dropzoneEl = (() => {
            const div = document.createElement('div');

            div.innerHTML = [
                '<div class="note-dropzone">',
                '<div class="note-dropzone-message"></div>',
                '</div>',
            ].join('');

            return div.firstElementChild as HTMLElement;
        })();
        this.editorEl.insertBefore(this.dropzoneEl, this.editorEl.firstChild);
    }

    /**
     * attach Drag and Drop Events
     */
    initialize() {
        if (this.options.disableDragAndDrop) {
            // prevent default drop event
            this.documentEventHandlers.onDrop = (domEvent: DragEvent) => {
                domEvent.preventDefault();
            };
            // do not consider outside of dropzone
            this.eventListenerEl = this.dropzoneEl;
            this.eventListenerEl.addEventListener('drop', this.documentEventHandlers.onDrop);
        } else {
            this.attachDragAndDropEvent();
        }
    }

    /**
     * attach Drag and Drop Events
     */
    attachDragAndDropEvent() {
        let collection: Node[] = [];
        const dropzoneMessageEl = this.dropzoneEl.querySelector('.note-dropzone-message');

        this.documentEventHandlers.onDragenter = (domEvent) => {
            const isCodeview = this.context.invoke('codeview.isActivated');
            const hasEditorSize = this.editorEl.offsetWidth > 0 && this.editorEl.offsetHeight > 0;
            if (!isCodeview && !collection.length && hasEditorSize) {
                this.editorEl.classList.add('dragover');
                this.dropzoneEl.style.width = this.editorEl.offsetWidth + 'px';
                this.dropzoneEl.style.height = this.editorEl.offsetHeight + 'px';
                dropzoneMessageEl.textContent = this.lang.image.dragImageHere;
            }
            collection.push(domEvent.target as Node);
        };

        this.documentEventHandlers.onDragleave = (domEvent) => {
            collection = collection.filter(x => x !== domEvent.target);

            // If nodeName is BODY, then just make it over (fix for IE)
            if (!collection.length || (domEvent.target instanceof Node && domEvent.target.nodeName === 'BODY')) {
                collection = [];
                this.editorEl.classList.remove('dragover');
            }
        };

        this.documentEventHandlers.onDrop = () => {
            collection = [];
            this.editorEl.classList.remove('dragover');
        };

        // show dropzone on dragenter when dragging a object to document
        // -but only if the editor is visible, i.e. has a positive width and height
        this.eventListenerEl.addEventListener('dragenter', this.documentEventHandlers.onDragenter);
        this.eventListenerEl.addEventListener('dragleave', this.documentEventHandlers.onDragleave);
        this.eventListenerEl.addEventListener('drop', this.documentEventHandlers.onDrop);

        // change dropzone's message on hover.
        this.dropzoneEl.addEventListener('dragenter', () => {
            this.dropzoneEl.classList.add('hover');
            dropzoneMessageEl.textContent = this.lang.image.dropImage;
        });
        this.dropzoneEl.addEventListener('dragleave', () => {
            this.dropzoneEl.classList.remove('hover');
            dropzoneMessageEl.textContent = this.lang.image.dragImageHere;
        });

        // attach dropImage
        this.dropzoneEl.addEventListener('drop', (domEvent) => {
            const dataTransfer = domEvent.dataTransfer;

            // stop the browser from opening the dropped content
            domEvent.preventDefault();

            if (dataTransfer && dataTransfer.files && dataTransfer.files.length) {
                this.editableEl.focus();
                this.context.invoke('editor.insertImagesOrCallback', dataTransfer.files);
            } else {
                dataTransfer.types.forEach((type) => {
                    // skip moz-specific types
                    if (type.toLowerCase().indexOf('_moz_') > -1) {
                        return;
                    }
                    const content = dataTransfer.getData(type);

                    if (type.toLowerCase().indexOf('text') > -1) {
                        this.context.invoke('editor.pasteHTML', content);
                    } else {
                        (() => {
                            const div = document.createElement('div');

                            div.innerHTML = content;

                            return [].slice.call(div.childNodes) as Node[];
                        })().forEach((item) => {
                            this.context.invoke('editor.insertNode', item);
                        });
                    }
                });
            }
        });
        this.dropzoneEl.addEventListener('dragover', (domEvent) => { // prevent default dragover event
            domEvent.preventDefault();
        });
    }

    destroy() {
        Object.keys(this.documentEventHandlers).forEach((key) => {
            this.eventListenerEl.removeEventListener(key.slice(2).toLowerCase(), this.documentEventHandlers[key]);
        });
        this.documentEventHandlers = {};
    }
}
