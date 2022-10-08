import lists from '../core/lists';
import func from "../core/func";

export default class Clipboard {
  constructor(context) {
    this.context = context;
    this.editableEl = func.jqueryToHtmlElement(context.layoutInfo.editable);
  }

  initialize() {
    this.editableEl.addEventListener('paste', this.pasteByEvent.bind(this));
  }

  /**
   * paste by clipboard event
   *
   * @param {ClipboardEvent} domEvent
   */
  pasteByEvent(domEvent) {
    if (this.context.isDisabled()) {
      return;
    }
    const clipboardData = domEvent.clipboardData;

    if (clipboardData && clipboardData.items && clipboardData.items.length) {
      const item = clipboardData.items.length > 1 ? clipboardData.items[1] : lists.head(clipboardData.items);
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
    } else if (window.clipboardData) {
      // for IE
      let text = window.clipboardData.getData('text');
      if (this.context.invoke('editor.isLimited', text.length)) {
        domEvent.preventDefault();
      }
    }
    // Call editor.afterCommand after proceeding default event handler
    setTimeout(() => {
      this.context.invoke('editor.afterCommand');
    }, 10);
  }
}
