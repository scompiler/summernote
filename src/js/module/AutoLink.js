import lists from '../core/lists.ts';
import key from '../core/key.ts';

const defaultScheme = 'http://';
const linkPattern = /^([A-Za-z][A-Za-z0-9+-.]*\:[\/]{2}|tel:|mailto:[A-Z0-9._%+-]+@|xmpp:[A-Z0-9._%+-]+@)?(www\.)?(.+)$/i;

export default class AutoLink {
  constructor(context) {
    this.context = context;
    this.options = context.options;
    this.events = {
      'summernote.keyup': (customEvent) => {
        const domEvent = customEvent.detail[0];

        if (!domEvent.defaultPrevented) {
          this.handleKeyup(domEvent);
        }
      },
      'summernote.keydown': (customEvent) => {
        const domEvent = customEvent.detail[0];

        this.handleKeydown(domEvent);
      },
    };
  }

  initialize() {
    this.lastWordRange = null;
  }

  destroy() {
    this.lastWordRange = null;
  }

  replace() {
    if (!this.lastWordRange) {
      return;
    }

    const keyword = this.lastWordRange.toString();
    const match = keyword.match(linkPattern);

    if (match && (match[1] || match[2])) {
      const link = match[1] ? keyword : defaultScheme + keyword;
      const urlText = this.options.showDomainOnlyForAutolink ?
        keyword.replace(/^(?:https?:\/\/)?(?:tel?:?)?(?:mailto?:?)?(?:xmpp?:?)?(?:www\.)?/i, '').split('/')[0]
        : keyword;
      const node = document.createElement('a');

      node.innerHTML = urlText;
      node.href = link; //

      if (this.context.options.linkTargetBlank) {
        node.target = '_blank';
      }

      this.lastWordRange.insertNode(node);
      this.lastWordRange = null;
      this.context.invoke('editor.focus');
    }
  }

  handleKeydown(domEvent) {
    if (lists.contains([key.code.ENTER, key.code.SPACE], domEvent.keyCode)) {
      const wordRange = this.context.invoke('editor.createRange').getWordRange();
      this.lastWordRange = wordRange;
    }
  }

  handleKeyup(domEvent) {
    if (key.code.SPACE === domEvent.keyCode || (key.code.ENTER === domEvent.keyCode && !domEvent.shiftKey)) {
      this.replace();
    }
  }
}
