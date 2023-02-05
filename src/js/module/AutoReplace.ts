import lists from '../core/lists';
import dom from '../core/dom';
import key from '../core/key';
import Context from "../Context";
import { Options } from "../core/types";
import { WrappedRange } from "../core/range";

export default class AutoReplace {
    context: Context;

    options: Options['replace'];

    lastWord: WrappedRange = null;

    previousKeydownCode: number = null;

    keys = [
        key.code.ENTER,
        key.code.SPACE,
        key.code.PERIOD,
        key.code.COMMA,
        key.code.SEMICOLON,
        key.code.SLASH,
    ];

    events = {
        'summernote.keyup': (customEvent: CustomEvent<[KeyboardEvent]>) => {
            const domEvent = customEvent.detail[0];

            if (!domEvent.defaultPrevented) {
                this.handleKeyup(domEvent);
            }
        },
        'summernote.keydown': (customEvent: CustomEvent<[KeyboardEvent]>) => {
            const domEvent = customEvent.detail[0];

            this.handleKeydown(domEvent);
        },
    };

    constructor(context: Context) {
        this.context = context;
        this.options = context.options.replace || {};
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

        this.options.match(this.lastWord.toString(), (match) => {
            if (match) {
                let node: Node = null;

                if (typeof match === 'string') {
                    node = dom.createText(match);
                } else if (match instanceof Node) {
                    node = match;
                }

                if (!node) return;
                this.lastWord.insertNode(node);
                this.lastWord = null;
                this.context.invoke('editor.focus');
            }
        });
    }

    handleKeydown(domEvent: KeyboardEvent) {
        // this forces it to remember the last whole word, even if multiple termination keys are pressed
        // before the previous key is let go.
        if (this.previousKeydownCode && lists.contains(this.keys, this.previousKeydownCode)) {
            this.previousKeydownCode = domEvent.keyCode;
            return;
        }

        if (lists.contains(this.keys, domEvent.keyCode)) {
            this.lastWord = this.context.invoke('editor.createRange').getWordRange();
        }
        this.previousKeydownCode = domEvent.keyCode;
    }

    handleKeyup(domEvent: KeyboardEvent) {
        if (lists.contains(this.keys, domEvent.keyCode)) {
            this.replace();
        }
    }
}
