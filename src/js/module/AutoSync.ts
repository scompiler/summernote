import dom from '../core/dom';
import Context from "../Context";

/**
 * textarea auto sync.
 */
export default class AutoSync {
    context: Context;

    noteEl: HTMLElement;

    events = {
        'summernote.change': () => {
            if (this.noteEl instanceof HTMLTextAreaElement || this.noteEl instanceof HTMLInputElement) {
                this.noteEl.value = this.context.invoke('code');
            }
        },
    };

    constructor(context: Context) {
        this.context = context;
        this.noteEl = context.layoutInfo.noteEl;
    }

    shouldInitialize() {
        return dom.isTextarea(this.noteEl);
    }
}
