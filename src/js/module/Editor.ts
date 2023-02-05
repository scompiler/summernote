import env from '../core/env';
import key from '../core/key';
import func from '../core/func';
import lists from '../core/lists';
import dom from '../core/dom';
import range, { WrappedRange } from '../core/range';
import { readFileAsDataURL, createImage } from '../core/async';
import History from '../editing/History';
import Style, { StyleInfo } from '../editing/Style';
import Typing from '../editing/Typing';
import Table from '../editing/Table';
import Bullet from '../editing/Bullet';
import Context from "../Context";
import { Options, Snapshot } from "../core/types";

const KEY_BOGUS = 'bogus';

/**
 * @class Editor
 */
export default class Editor {
    context: Context;

    noteEl: HTMLElement;

    editorEl: HTMLElement;

    editableEl: HTMLElement & {__dataTarget?: Node};

    options: Options;

    lang: Options['langInfo'];

    lastRange: WrappedRange | null = null;

    snapshot: Snapshot | null = null;

    style: Style;

    table: Table;

    typing: Typing;

    bullet: Bullet;

    history: History;

    listeners: {
        node: Node;
        type: string;
        callback: (...args: any[]) => any;
    }[] = [];

    hasKeyShortCut = false;

    constructor(context: Context) {
        this.context = context;

        this.noteEl = context.layoutInfo.noteEl;
        this.editorEl = context.layoutInfo.editorEl;
        this.editableEl = context.layoutInfo.editableEl;
        this.options = context.options;
        this.lang = this.options.langInfo;

        this.style = new Style();
        this.table = new Table();
        this.typing = new Typing(context);
        this.bullet = new Bullet();
        this.history = new History(context);

        this.context.memo('help.escape', this.lang.help.escape);
        this.context.memo('help.undo', this.lang.help.undo);
        this.context.memo('help.redo', this.lang.help.redo);
        this.context.memo('help.tab', this.lang.help.tab);
        this.context.memo('help.untab', this.lang.help.untab);
        this.context.memo('help.insertParagraph', this.lang.help.insertParagraph);
        this.context.memo('help.insertOrderedList', this.lang.help.insertOrderedList);
        this.context.memo('help.insertUnorderedList', this.lang.help.insertUnorderedList);
        this.context.memo('help.indent', this.lang.help.indent);
        this.context.memo('help.outdent', this.lang.help.outdent);
        this.context.memo('help.formatPara', this.lang.help.formatPara);
        this.context.memo('help.insertHorizontalRule', this.lang.help.insertHorizontalRule);
        this.context.memo('help.fontName', this.lang.help.fontName);
        this.context.memo('help.formatH1', this.lang.help.formatH1);
        this.context.memo('help.formatH2', this.lang.help.formatH2);
        this.context.memo('help.formatH3', this.lang.help.formatH3);
        this.context.memo('help.formatH4', this.lang.help.formatH4);
        this.context.memo('help.formatH5', this.lang.help.formatH5);
        this.context.memo('help.formatH6', this.lang.help.formatH6);

        this.context.memo('help.bold', this.lang.help.bold);
        this.context.memo('help.italic', this.lang.help.italic);
        this.context.memo('help.underline', this.lang.help.underline);
        this.context.memo('help.strikethrough', this.lang.help.strikethrough);
        this.context.memo('help.superscript', this.lang.help.superscript);
        this.context.memo('help.subscript', this.lang.help.subscript);
        this.context.memo('help.justifyLeft', this.lang.help.justifyLeft);
        this.context.memo('help.justifyCenter', this.lang.help.justifyCenter);
        this.context.memo('help.justifyRight', this.lang.help.justifyRight);
        this.context.memo('help.justifyFull', this.lang.help.justifyFull);
        this.context.memo('help.formatBlock', this.lang.help.formatBlock);
        this.context.memo('help.removeFormat', this.lang.help.removeFormat);
        this.context.memo('help.backColor', this.lang.help.backColor);
    }

    bold = this.wrapCommand((value: string) => document.execCommand('bold', false, value), {isPreventTrigger: true});
    italic = this.wrapCommand((value: string) => document.execCommand('italic', false, value), {isPreventTrigger: true});
    underline = this.wrapCommand((value: string) => document.execCommand('underline', false, value), {isPreventTrigger: true});
    strikethrough = this.wrapCommand((value: string) => document.execCommand('strikethrough', false, value), {isPreventTrigger: true});
    superscript = this.wrapCommand((value: string) => document.execCommand('superscript', false, value), {isPreventTrigger: true});
    subscript = this.wrapCommand((value: string) => document.execCommand('subscript', false, value), {isPreventTrigger: true});
    justifyLeft = this.wrapCommand((value: string) => document.execCommand('justifyLeft', false, value), {isPreventTrigger: true});
    justifyCenter = this.wrapCommand((value: string) => document.execCommand('justifyCenter', false, value), {isPreventTrigger: true});
    justifyRight = this.wrapCommand((value: string) => document.execCommand('justifyRight', false, value), {isPreventTrigger: true});
    justifyFull = this.wrapCommand((value: string) => document.execCommand('justifyFull', false, value), {isPreventTrigger: true});
    // formatBlock = this.wrapCommand((value: string) => document.execCommand('formatBlock', false, value), {isPreventTrigger: true});
    removeFormat = this.wrapCommand((value: string) => document.execCommand('removeFormat', false, value), {isPreventTrigger: true});
    backColor = this.wrapCommand((value: string) => document.execCommand('backColor', false, value), {isPreventTrigger: true});

    fontName = this.wrapCommand((value: string) => {
        return this.fontStyling('font-family', env.validFontName(value));
    });

    fontSize = this.wrapCommand((value: string) => {
        const unit = this.currentStyle()['font-size-unit'];
        return this.fontStyling('font-size', value + unit);
    });

    fontSizeUnit = this.wrapCommand((value: string) => {
        const size = this.currentStyle()['font-size'];
        return this.fontStyling('font-size', size + value);
    });

    formatH1 = () => this.formatBlock('H1');
    formatH2 = () => this.formatBlock('H2');
    formatH3 = () => this.formatBlock('H3');
    formatH4 = () => this.formatBlock('H4');
    formatH5 = () => this.formatBlock('H5');
    formatH6 = () => this.formatBlock('H6');

    insertParagraph = this.wrapCommand(() => {
        this.typing.insertParagraph(this.editableEl);
    });

    insertOrderedList = this.wrapCommand(() => {
        this.bullet.insertOrderedList(this.editableEl);
    });

    insertUnorderedList = this.wrapCommand(() => {
        this.bullet.insertUnorderedList(this.editableEl);
    });

    indent = this.wrapCommand(() => {
        this.bullet.indent(this.editableEl);
    });

    outdent = this.wrapCommand(() => {
        this.bullet.outdent(this.editableEl);
    });

    insertNode = this.wrapCommand((node: Node) => {
        if (this.isLimited(node.textContent.length)) {
            return;
        }
        const rng = this.getLastRange();
        rng.insertNode(node);
        this.setLastRange(range.createFromNodeAfter(node).select());
    });

    insertText = this.wrapCommand((text: string) => {
        if (this.isLimited(text.length)) {
            return;
        }
        const rng = this.getLastRange();
        const textNode = rng.insertNode(dom.createText(text));
        this.setLastRange(range.create(textNode, dom.nodeLength(textNode)).select());
    });

    pasteHTML = this.wrapCommand((markup: string) => {
        if (this.isLimited(markup.length)) {
            return;
        }
        markup = this.context.invoke('codeview.purify', markup);
        const contents = this.getLastRange().pasteHTML(markup);
        this.setLastRange(range.createFromNodeAfter(lists.last(contents)).select());
    });

    formatBlock = this.wrapCommand((tagName: string, targetEl?: HTMLElement) => {
        const onApplyCustomStyle = this.options.callbacks.onApplyCustomStyle;
        if (onApplyCustomStyle) {
            onApplyCustomStyle.call(this, targetEl, this.context, this.onFormatBlock);
        } else if (tagName) {
            this.onFormatBlock(tagName, targetEl);
        }
    });

    insertHorizontalRule = this.wrapCommand(() => {
        const hrNode = this.getLastRange().insertNode(dom.create('HR'));
        if (hrNode.nextSibling) {
            this.setLastRange(range.create(hrNode.nextSibling, 0).normalize().select());
        }
    });

    lineHeight = this.wrapCommand((value: string) => {
        this.style.stylePara(this.getLastRange(), {
            lineHeight: value,
        });
    });

    /**
     * Create link (command).
     */
    createLink = this.wrapCommand((linkInfo: {
        url: string;
        text: string;
        isNewWindow: boolean;
        checkProtocol: boolean;
        range: WrappedRange;
    }) => {
        const rel: string[] = [];
        let linkUrl = linkInfo.url;
        const linkText = linkInfo.text;
        const isNewWindow = linkInfo.isNewWindow;
        const checkProtocol = linkInfo.checkProtocol;
        const addNoReferrer = this.options.linkAddNoReferrer;
        const addNoOpener = this.options.linkAddNoOpener;
        let rng = linkInfo.range || this.getLastRange();
        const additionalTextLength = linkText.length - rng.toString().length;
        if (additionalTextLength > 0 && this.isLimited(additionalTextLength)) {
            return;
        }
        const isTextChanged = rng.toString() !== linkText;

        // handle spaced urls from input
        if (typeof linkUrl === 'string') {
            linkUrl = linkUrl.trim();
        }

        if (this.options.onCreateLink) {
            linkUrl = this.options.onCreateLink(linkUrl);
        } else if (checkProtocol) {
            // if url doesn't have any protocol and not even a relative or a label, use http:// as default
            linkUrl = /^([A-Za-z][A-Za-z0-9+-.]*\:|#|\/)/.test(linkUrl)
                ? linkUrl : this.options.defaultProtocol + linkUrl;
        }

        let anchors: HTMLAnchorElement[] = [];
        if (isTextChanged) {
            rng = rng.deleteContents();
            const anchor = rng.insertNode(func.makeElement('<A>' + linkText + '</A>')) as HTMLAnchorElement;
            anchors.push(anchor);
        } else {
            anchors = this.style.styleNodes(rng, {
                nodeName: 'A',
                expandClosestSibling: true,
                onlyPartialContains: true,
            }) as HTMLAnchorElement[];
        }

        anchors.forEach((anchor) => {
            anchor.setAttribute('href', linkUrl);
            if (isNewWindow) {
                anchor.setAttribute('target', '_blank');
                if (addNoReferrer) {
                    rel.push('noreferrer');
                }
                if (addNoOpener) {
                    rel.push('noopener');
                }
                if (rel.length) {
                    anchor.setAttribute('rel', rel.join(' '));
                }
            } else {
                anchor.removeAttribute('target');
            }
        });

        this.setLastRange(
            this.createRangeFromList(anchors).select()
        );
    });

    /**
     * Setting color.
     */
    color = this.wrapCommand((colorInfo: {foreColor: string; backColor: string}) => {
        const foreColor = colorInfo.foreColor;
        const backColor = colorInfo.backColor;

        if (foreColor) { document.execCommand('foreColor', false, foreColor); }
        if (backColor) { document.execCommand('backColor', false, backColor); }
    });

    /**
     * Set foreground color.
     */
    foreColor = this.wrapCommand(
        /**
         * @param colorCode foreground color code.
         */
        (colorCode: string) => {
            document.execCommand('foreColor', false, colorCode);
        },
    );

    /**
     * Insert Table.
     */
    insertTable = this.wrapCommand(
        /**
         * @param dim of table (ex : "5x5")
         */
        (dim: string) => {
            const dimension = dim.split('x');

            const rng = this.getLastRange().deleteContents();
            rng.insertNode(this.table.createTable(parseFloat(dimension[0]), parseFloat(dimension[1]), this.options));
        },
    );

    /**
     * Remove media object and Figure Elements if media object is img with Figure.
     */
    removeMedia = this.wrapCommand(() => {
        let targetEl = this.restoreTarget();

        if (!targetEl || !targetEl.parentElement) {
            return;
        }

        const figureEl = targetEl.parentElement.closest('figure');

        if (figureEl) {
            figureEl.remove();
        } else {
            targetEl = this.restoreTarget();

            if (targetEl && targetEl instanceof HTMLElement) {
                targetEl.remove();
            }
        }
        this.context.triggerEvent('media.delete', targetEl, this.editableEl);
    });

    /**
     * Float me.
     */
    floatMe = this.wrapCommand((value: string) => {
        const targetEl = this.restoreTarget();

        if (targetEl && targetEl instanceof HTMLElement) {
            targetEl.classList.toggle('note-float-left', value === 'left');
            targetEl.classList.toggle('note-float-right', value === 'right');
            targetEl.style.float = value === 'none' ? '' : value;
        }
    });

    /**
     * Resize overlay element.
     */
    resize = this.wrapCommand((value: string) => {
        const targetEl = this.restoreTarget();

        if (targetEl && targetEl instanceof HTMLElement) {
            const numberValue = parseFloat(value);
            if (numberValue === 0) {
                targetEl.style.width = '';
            } else {
                targetEl.style.width = numberValue * 100 + '%';
                targetEl.style.height = '';
            }
        }
    });

    listen(node: Node, types: string, callback: (...args: any[]) => any) {
        types.trim().replace(/ +/, ' ').split(' ').forEach((type) => {
            node.addEventListener(type, callback);

            this.listeners.push({node, type, callback});
        });
    }

    initialize() {
        // bind custom events
        this.listen(this.editableEl, 'keydown', (domEvent) => {
            if (domEvent.keyCode === key.code.ENTER) {
                this.context.triggerEvent('enter', domEvent);
            }
            this.context.triggerEvent('keydown', domEvent);

            // keep a snapshot to limit text on input event
            this.snapshot = this.history.makeSnapshot();
            this.hasKeyShortCut = false;
            if (!domEvent.defaultPrevented) {
                if (this.options.shortcuts) {
                    this.hasKeyShortCut = this.handleKeyMap(domEvent);
                } else {
                    this.preventDefaultEditableShortCuts(domEvent);
                }
            }
            if (this.isLimited(1, domEvent)) {
                const lastRange = this.getLastRange();
                if (lastRange.eo - lastRange.so === 0) {
                    return false;
                }
            }
            this.setLastRange();

            // record undo in the key event except keyMap.
            if (this.options.recordEveryKeystroke) {
                if (this.hasKeyShortCut === false) {
                    this.history.recordUndo();
                }
            }
        });
        this.listen(this.editableEl, 'keyup', (domEvent) => {
            this.setLastRange();
            this.context.triggerEvent('keyup', domEvent);
        });
        this.listen(this.editableEl, 'focus', (domEvent) => {
            this.setLastRange();
            this.context.triggerEvent('focus', domEvent);
        });
        this.listen(this.editableEl, 'blur', (domEvent) => {
            this.context.triggerEvent('blur', domEvent);
        });
        this.listen(this.editableEl, 'mousedown', (domEvent) => {
            this.context.triggerEvent('mousedown', domEvent);
        });
        this.listen(this.editableEl, 'mouseup', (domEvent) => {
            this.setLastRange();
            this.history.recordUndo();
            this.context.triggerEvent('mouseup', domEvent);
        });
        this.listen(this.editableEl, 'scroll', (domEvent) => {
            this.context.triggerEvent('scroll', domEvent);
        });
        this.listen(this.editableEl, 'paste', (domEvent) => {
            this.setLastRange();
            this.context.triggerEvent('paste', domEvent);
        });
        this.listen(this.editableEl, 'input', () => {
            // To limit composition characters (e.g. Korean)
            if (this.isLimited(0) && this.snapshot) {
                this.history.applySnapshot(this.snapshot);
            }
        });

        this.editableEl.setAttribute('spellcheck', this.options.spellCheck.toString());
        this.editableEl.setAttribute('autocorrect', this.options.spellCheck.toString());

        if (this.options.disableGrammar) {
            this.editableEl.setAttribute('data-gramm', 'false');
        }

        // init content before set event
        this.editableEl.innerHTML = dom.html(this.noteEl) || dom.emptyPara;

        this.listen(this.editableEl, env.inputEventName, func.debounce(() => {
            this.context.triggerEvent('change', this.editableEl.innerHTML, this.editableEl);
        }, 10));

        this.listen(this.editableEl, 'focusin', (domEvent) => {
            this.context.triggerEvent('focusin', domEvent);
        });
        this.listen(this.editableEl, 'focusout', (domEvent) => {
            this.context.triggerEvent('focusout', domEvent);
        });

        if (this.options.airMode) {
            if (this.options.overrideContextMenu) {
                this.editorEl.addEventListener('contextmenu', (domEvent) => {
                    domEvent.preventDefault();
                    this.context.triggerEvent('contextmenu', domEvent);
                });
            }
        } else {
            if (this.options.width) {
                this.editorEl.style.width = this.options.width + 'px';
            }
            if (this.options.height) {
                this.editableEl.style.height = this.options.height + 'px';
            }
            if (this.options.maxHeight) {
                this.editableEl.style.maxHeight = this.options.maxHeight + 'px';
            }
            if (this.options.minHeight) {
                this.editableEl.style.minHeight = this.options.minHeight + 'px';
            }
        }

        this.history.recordUndo();
        this.setLastRange();
    }

    destroy() {
        this.listeners.forEach(x => x.node.removeEventListener(x.type, x.callback));
        this.listeners = [];
    }

    handleKeyMap(domEvent: KeyboardEvent) {
        const keyMap = this.options.keyMap[env.isMac ? 'mac' : 'pc'];
        const keys = [];

        if (domEvent.metaKey) { keys.push('CMD'); }
        if (domEvent.ctrlKey && !domEvent.altKey) { keys.push('CTRL'); }
        if (domEvent.shiftKey) { keys.push('SHIFT'); }

        const keyName = key.nameFromCode[domEvent.keyCode as keyof typeof key.nameFromCode];
        if (keyName) {
            keys.push(keyName);
        }

        const eventName = keyMap[keys.join('+')];

        if (keyName === 'TAB' && !this.options.tabDisable) {
            this.afterCommand();
        } else if (eventName) {
            if (this.context.invoke(eventName) !== false) {
                domEvent.preventDefault();
                // if keyMap action was invoked
                return true;
            }
        } else if (key.isEdit(domEvent.keyCode)) {
            if (key.isRemove(domEvent.keyCode)) {
                this.context.invoke('removed');
            }
            this.afterCommand();
        }
        return false;
    }

    preventDefaultEditableShortCuts(domEvent: KeyboardEvent) {
        // B(Bold, 66) / I(Italic, 73) / U(Underline, 85)
        if ((domEvent.ctrlKey || domEvent.metaKey) &&
            lists.contains([66, 73, 85], domEvent.keyCode)) {
            domEvent.preventDefault();
        }
    }

    isLimited(pad: number, domEvent?: KeyboardEvent) {
        pad = pad || 0;

        if (typeof domEvent !== 'undefined') {
            if (key.isMove(domEvent.keyCode) ||
                key.isNavigation(domEvent.keyCode) ||
                (domEvent.ctrlKey || domEvent.metaKey) ||
                lists.contains([key.code.BACKSPACE, key.code.DELETE], domEvent.keyCode)) {
                return false;
            }
        }

        if (this.options.maxTextLength > 0) {
            if ((this.editableEl.textContent.length + pad) > this.options.maxTextLength) {
                return true;
            }
        }
        return false;
    }

    /**
     * create range
     * @return {WrappedRange}
     */
    createRange() {
        this.focus();
        this.setLastRange();
        return this.getLastRange();
    }

    /**
     * Create a new range from the list of elements.
     */
    createRangeFromList(lst: Node[]): WrappedRange {
        const startRange = range.createFromNodeBefore(lists.head(lst));
        const startPoint = startRange.getStartPoint();
        const endRange = range.createFromNodeAfter(lists.last(lst));
        const endPoint = endRange.getEndPoint();

        return range.create(
            startPoint.node,
            startPoint.offset,
            endPoint.node,
            endPoint.offset
        );
    }

    /**
     * set the last range
     *
     * if given rng is exist, set rng as the last range
     * or create a new range at the end of the document
     */
    setLastRange(rng?: WrappedRange) {
        if (rng) {
            this.lastRange = rng;
        } else {
            this.lastRange = range.create(this.editableEl);

            const el = this.lastRange.sc instanceof Node ? this.lastRange.sc.parentElement : this.lastRange.sc;

            if (!(el instanceof Element && el.closest('.note-editable'))) {
                this.lastRange = range.createFromBodyElement(this.editableEl);
            }
        }
    }

    /**
     * get the last range
     *
     * if there is a saved last range, return it
     * or create a new range and return it
     *
     * @return {WrappedRange}
     */
    getLastRange() {
        if (!this.lastRange) {
            this.setLastRange();
        }
        return this.lastRange;
    }

    /**
     * Save current range.
     */
    saveRange(thenCollapse = false) {
        if (thenCollapse) {
            this.getLastRange().collapse().select();
        }
    }

    /**
     * Restore lately range.
     */
    restoreRange() {
        if (this.lastRange) {
            this.lastRange.select();
            this.focus();
        }
    }

    saveTarget(node: Node) {
        this.editableEl.__dataTarget = node;
    }

    clearTarget() {
        delete this.editableEl.__dataTarget;
    }

    restoreTarget() {
        return this.editableEl.__dataTarget;
    }

    /**
     * currentStyle
     *
     * current style
     * @return {Object|Boolean} unfocus
     */
    currentStyle() {
        let rng = range.create();
        if (rng) {
            rng = rng.normalize();
        }
        return rng ? this.style.current(rng) : this.style.fromNode(this.editableEl);
    }

    /**
     * Style from node.
     */
    styleFromNode(nodeEl: HTMLElement): StyleInfo {
        return this.style.fromNode(nodeEl);
    }

    /**
     * undo
     */
    undo() {
        this.context.triggerEvent('before.command', this.editableEl.innerHTML);
        this.history.undo();
        this.context.triggerEvent('change', this.editableEl.innerHTML, this.editableEl);
    }

    /*
    * commit
    */
    commit() {
        this.context.triggerEvent('before.command', this.editableEl.innerHTML);
        this.history.commit();
        this.context.triggerEvent('change', this.editableEl.innerHTML, this.editableEl);
    }

    /**
     * redo
     */
    redo() {
        this.context.triggerEvent('before.command', this.editableEl.innerHTML);
        this.history.redo();
        this.context.triggerEvent('change', this.editableEl.innerHTML, this.editableEl);
    }

    /**
     * before command
     */
    beforeCommand() {
        this.context.triggerEvent('before.command', this.editableEl.innerHTML);

        // Set styleWithCSS before run a command
        document.execCommand('styleWithCSS', false, this.options.styleWithCSS.toString());

        // keep focus on editable before command execution
        this.focus();
    }

    /**
     * After command.
     */
    afterCommand(isPreventTrigger = false) {
        this.normalizeContent();
        this.history.recordUndo();
        if (!isPreventTrigger) {
            this.context.triggerEvent('change', this.editableEl.innerHTML, this.editableEl);
        }
    }

    /**
     * handle tab key
     */
    tab() {
        const rng = this.getLastRange();
        if (rng.isCollapsed() && rng.isOnCell()) {
            this.table.tab(rng);
        } else {
            if (this.options.tabSize === 0) {
                return false;
            }

            if (!this.isLimited(this.options.tabSize)) {
                this.beforeCommand();
                this.typing.insertTab(rng, this.options.tabSize);
                this.afterCommand();
            }
        }
    }

    /**
     * handle shift+tab key
     */
    untab() {
        const rng = this.getLastRange();
        if (rng.isCollapsed() && rng.isOnCell()) {
            this.table.tab(rng, true);
        } else {
            if (this.options.tabSize === 0) {
                return false;
            }
        }
    }

    /**
     * Run given function between beforeCommand and afterCommand.
     */
    wrapCommand<T extends (...args: any[]) => void>(fn: T, options?: {isPreventTrigger: boolean}): T {
        return ((...args: any[]) => {
            this.beforeCommand();
            fn.apply(this, args);
            this.afterCommand(options?.isPreventTrigger);
        }) as T;
    }

    /**
     * removed (function added by 1der1)
     */
    removed(rng: WrappedRange, node: Node, tagName: string) { // LB
        rng = range.create();
        if (rng.isCollapsed() && rng.isOnCell()) {
            node = rng.ec;
            if(node instanceof Element && (tagName = node.tagName) &&
                (node.childElementCount === 1) &&
                (node.childNodes[0] instanceof Element && node.childNodes[0].tagName === "BR") ){

                if(tagName === "P") {
                    node.remove();
                } else if(['TH', 'TD'].indexOf(tagName) >=0) {
                    node.firstChild.remove();
                }
            }
        }
    }

    insertImage(src: string, param: ((imgEl: HTMLImageElement) => void) | string) {
        return createImage(src).then((imageEl) => {
            this.beforeCommand();

            if (typeof param === 'function') {
                param(imageEl);
            } else {
                if (typeof param === 'string') {
                    imageEl.setAttribute('data-filename', param);
                }

                const editableStyle = getComputedStyle(this.editableEl);
                const editablePaddingX = parseFloat(editableStyle.paddingLeft) + parseFloat(editableStyle.paddingRight);
                const editableWidth = this.editableEl.clientWidth - editablePaddingX;

                imageEl.style.width = Math.min(editableWidth, imageEl.width) + 'px';
            }

            imageEl.style.display = '';
            this.getLastRange().insertNode(imageEl);
            this.setLastRange(range.createFromNodeAfter(imageEl).select());
            this.afterCommand();
        }).catch((e) => {
            this.context.triggerEvent('image.upload.error', e);
        });
    }

    insertImagesAsDataURL(files: File[]) {
        [].slice.call(files).forEach((file: File) => {
            const filename = file.name;
            if (this.options.maximumImageFileSize && this.options.maximumImageFileSize < file.size) {
                this.context.triggerEvent('image.upload.error', this.lang.image.maximumFileSizeError);
            } else {
                readFileAsDataURL(file).then((dataURL) => {
                    return this.insertImage(dataURL, filename);
                }).catch(() => {
                    this.context.triggerEvent('image.upload.error');
                });
            }
        });
    }

    insertImagesOrCallback(files: File[]) {
        const callbacks = this.options.callbacks;
        // If onImageUpload set,
        if (callbacks.onImageUpload) {
            this.context.triggerEvent('image.upload', files);
            // else insert Image as dataURL
        } else {
            this.insertImagesAsDataURL(files);
        }
    }

    /**
     * return selected plain text
     * @return {String} text
     */
    getSelectedText() {
        let rng = this.getLastRange();

        // if range on anchor, expand range with anchor
        if (rng.isOnAnchor()) {
            rng = range.createFromNode(dom.ancestor(rng.sc, dom.isAnchor));
        }

        return rng.toString();
    }

    onFormatBlock(tagName: string, targetEl: Element) {
        // [workaround] for MSIE, IE need `<`
        document.execCommand('FormatBlock', false, env.isMSIE ? '<' + tagName + '>' : tagName);

        // support custom class
        if (targetEl && targetEl.tagName.toUpperCase() !== tagName.toUpperCase()) {
            targetEl = targetEl.querySelector(tagName);
        }
        if (targetEl) {
            const currentRange = this.createRange();
            const parentEls = [currentRange.sc, currentRange.ec].map((el) => {
                if (el instanceof Node) {
                    el = el.parentElement;
                }

                return el instanceof Element ? el.closest(tagName) : null;
            }).filter(el => el);
            // remove class added for current block
            parentEls.forEach(x => x.className = '');

            const className = targetEl.className || '';
            if (className) {
                parentEls.forEach(x => x.className = className);
            }
        }
    }

    formatPara() {
        this.formatBlock('P');
    }

    fontStyling(target: string, value: string) {
        const rng = this.getLastRange();
        const outputEl = this.editorEl.querySelector('.note-status-output');

        if (rng) {
            const spans = this.style.styleNodes(rng);
            if (outputEl) {
                outputEl.innerHTML = '';
            }
            spans.forEach(span => {
                if (span instanceof HTMLElement) {
                    span.style.setProperty(target, value);
                }
            });

            // [workaround] added styled bogus span for style
            //  - also bogus character needed for cursor position
            if (rng.isCollapsed()) {
                const firstSpan = lists.head(spans);
                if (firstSpan && firstSpan instanceof Element && !dom.nodeLength(firstSpan)) {
                    firstSpan.innerHTML = dom.ZERO_WIDTH_NBSP_CHAR;
                    range.createFromNode(firstSpan.firstChild).select();
                    this.setLastRange();
                    (this.editableEl as any)['__data' + KEY_BOGUS] = firstSpan;
                }
            } else {
                rng.select();
            }
        } else {
            const noteStatusOutput = (new Date()).getTime();
            if (outputEl) {
                outputEl.innerHTML = '<div id="note-status-output-' + noteStatusOutput + '" class="alert alert-info">' + this.lang.output.noSelection + '</div>';
            }
            setTimeout(() => {
                const el = document.querySelector('#note-status-output-' + noteStatusOutput);

                if (el) {
                    el.remove();
                }
            }, 5000);
        }
    }

    unlink() {
        let rng = this.getLastRange();
        if (rng.isOnAnchor()) {
            const anchor = dom.ancestor(rng.sc, dom.isAnchor);
            rng = range.createFromNode(anchor);
            rng.select();
            this.setLastRange();

            this.beforeCommand();
            document.execCommand('unlink');
            this.afterCommand();
        }
    }

    getLinkInfo() {
        const rng = this.getLastRange().expand(dom.isAnchor);
        // Get the first anchor on range(for edit).
        const anchorEl = lists.head(rng.nodes(dom.isAnchor));
        const linkInfo: {
            range: WrappedRange;
            text: string;
            url: string;
            isNewWindow?: boolean;
        } = {
            range: rng,
            text: rng.toString(),
            url: anchorEl && anchorEl instanceof Element ? anchorEl.getAttribute('href') : '',
        };

        // When anchor exists,
        if (anchorEl && anchorEl instanceof Element) {
            // Set isNewWindow by checking its target.
            linkInfo.isNewWindow = anchorEl.getAttribute('target') === '_blank';
        }

        return linkInfo;
    }

    addRow(position: 'top' | 'bottom') {
        const rng = this.getLastRange();
        if (rng.isCollapsed() && rng.isOnCell()) {
            this.beforeCommand();
            this.table.addRow(rng, position);
            this.afterCommand();
        }
    }

    addCol(position: 'left' | 'right') {
        const rng = this.getLastRange();
        if (rng.isCollapsed() && rng.isOnCell()) {
            this.beforeCommand();
            this.table.addCol(rng, position);
            this.afterCommand();
        }
    }

    deleteRow() {
        const rng = this.getLastRange();
        if (rng.isCollapsed() && rng.isOnCell()) {
            this.beforeCommand();
            this.table.deleteRow(rng);
            this.afterCommand();
        }
    }

    deleteCol() {
        const rng = this.getLastRange();
        if (rng.isCollapsed() && rng.isOnCell()) {
            this.beforeCommand();
            this.table.deleteCol(rng);
            this.afterCommand();
        }
    }

    deleteTable() {
        const rng = this.getLastRange();
        if (rng.isCollapsed() && rng.isOnCell()) {
            this.beforeCommand();
            this.table.deleteTable(rng);
            this.afterCommand();
        }
    }

    resizeTo(pos: {x: number; y: number}, targetEl: HTMLElement, bKeepRatio: boolean) {
        let imageSize;
        if (bKeepRatio) {
            const newRatio = pos.y / pos.x;
            const ratio = parseFloat(targetEl.getAttribute('data-ratio'));
            imageSize = {
                width: ratio > newRatio ? pos.x : pos.y / ratio,
                height: ratio > newRatio ? pos.x * ratio : pos.y,
            };
        } else {
            imageSize = {
                width: pos.x,
                height: pos.y,
            };
        }

        targetEl.style.width = imageSize.width + 'px';
        targetEl.style.height = imageSize.height + 'px';
    }

    /**
     * returns whether editable area has focus or not.
     */
    hasFocus() {
        return document.activeElement === this.editableEl;
    }

    /**
     * set focus
     */
    focus() {
        // [workaround] Screen will move when page is scolled in IE.
        //  - do focus when not focused
        if (!this.hasFocus()) {
            this.editableEl.focus();
            this.editableEl.dispatchEvent(new Event('focus'));
        }
    }

    /**
     * returns whether contents is empty or not.
     * @return {Boolean}
     */
    isEmpty() {
        return dom.isEmpty(this.editableEl) || dom.emptyPara === this.editableEl.innerHTML;
    }

    /**
     * Removes all contents and restores the editable instance to an _emptyPara_.
     */
    empty() {
        this.context.invoke('code', dom.emptyPara);
    }

    /**
     * normalize content
     */
    normalizeContent() {
        this.editableEl.normalize();
    }
}
