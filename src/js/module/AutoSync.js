import dom from '../core/dom';
import func from "../core/func";

/**
 * textarea auto sync.
 */
export default class AutoSync {
  constructor(context) {
    this.noteEl = func.jqueryToHtmlElement(context.layoutInfo.note);
    this.events = {
      'summernote.change': () => {
        this.noteEl.value = context.invoke('code');
      },
    };
  }

  shouldInitialize() {
    return dom.isTextarea(this.noteEl);
  }
}
