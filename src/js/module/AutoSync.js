import dom from '../core/dom.ts';

/**
 * textarea auto sync.
 */
export default class AutoSync {
  constructor(context) {
    this.noteEl = context.layoutInfo.noteEl;
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
