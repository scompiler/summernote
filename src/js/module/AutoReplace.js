import lists from '../core/lists.ts';
import dom from '../core/dom';
import key from '../core/key';

export default class AutoReplace {
  constructor(context) {
    this.context = context;
    this.options = context.options.replace || {};

    this.keys = [key.code.ENTER, key.code.SPACE, key.code.PERIOD, key.code.COMMA, key.code.SEMICOLON, key.code.SLASH];
    this.previousKeydownCode = null;

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

  shouldInitialize() {
    return !!this.options.match;
  }

  initialize() {
    this.lastWord = null;
  }

  destroy() {
    this.lastWord = null;
  }

  replace() {
    if (!this.lastWord) {
      return;
    }

    const self = this;
    const keyword = this.lastWord.toString();
    this.options.match(keyword, function(match) {
      if (match) {
        let node = '';

        if (typeof match === 'string') {
          node = dom.createText(match);
        } else if (match instanceof jQuery) {
          node = match[0];
        } else if (match instanceof Node) {
          node = match;
        }

        if (!node) return;
        self.lastWord.insertNode(node);
        self.lastWord = null;
        self.context.invoke('editor.focus');
      }
    });
  }

  handleKeydown(domEvent) {
    // this forces it to remember the last whole word, even if multiple termination keys are pressed
    // before the previous key is let go.
    if (this.previousKeydownCode && lists.contains(this.keys, this.previousKeydownCode)) {
      this.previousKeydownCode = domEvent.keyCode;
      return;
    }

    if (lists.contains(this.keys, domEvent.keyCode)) {
      const wordRange = this.context.invoke('editor.createRange').getWordRange();
      this.lastWord = wordRange;
    }
    this.previousKeydownCode = domEvent.keyCode;
  }

  handleKeyup(domEvent) {
    if (lists.contains(this.keys, domEvent.keyCode)) {
      this.replace();
    }
  }
}
