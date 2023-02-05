import lists from '../core/lists';
import Context from "../Context";

export default class Clipboard {
    context: Context;

    editableEl: HTMLElement;

    constructor(context: Context) {
        this.context = context;
        this.editableEl = context.layoutInfo.editableEl;
    }

    initialize() {
        this.editableEl.addEventListener('paste', this.pasteByEvent.bind(this));
    }

    /**
     * Paste by clipboard event.
     */
    pasteByEvent(domEvent: ClipboardEvent) {
        if (this.context.isDisabled()) {
            return;
        }
        const clipboardData = domEvent.clipboardData;

        if (clipboardData && clipboardData.items && clipboardData.items.length) {
            const items = [].slice.call(clipboardData.items) as DataTransferItem[];
            const item = items.length > 1 ? items[1] : lists.head(items);
            if (item.kind === 'file' && item.type.indexOf('image/') !== -1) {
                // paste img file
                this.context.invoke('editor.insertImagesOrCallback', [item.getAsFile()]);
                domEvent.preventDefault();
            } else if (item.kind === 'string') {
                // paste text with maxTextLength check
                if (this.context.invoke('editor.isLimited', clipboardData.getData('Text').length)) {
                    domEvent.preventDefault();
                }
            }
        }
        // Call editor.afterCommand after proceeding default event handler
        setTimeout(() => {
            this.context.invoke('editor.afterCommand');
        }, 10);
    }
}
