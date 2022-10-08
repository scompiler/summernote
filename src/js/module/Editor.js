import env from '../core/env';
import key from '../core/key';
import func from '../core/func';
import lists from '../core/lists';
import dom from '../core/dom';
import range from '../core/range';
import { readFileAsDataURL, createImage } from '../core/async';
import History from '../editing/History';
import Style from '../editing/Style';
import Typing from '../editing/Typing';
import Table from '../editing/Table';
import Bullet from '../editing/Bullet';

const KEY_BOGUS = 'bogus';

/**
 * @class Editor
 */
export default class Editor {
  constructor(context) {
    this.context = context;

    this.noteEl = func.jqueryToHtmlElement(context.layoutInfo.note);
    this.editorEl = func.jqueryToHtmlElement(context.layoutInfo.editor);
    this.editableEl = func.jqueryToHtmlElement(context.layoutInfo.editable);
    this.options = context.options;
    this.lang = this.options.langInfo;

    this.lastRange = null;
    this.snapshot = null;

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

    this.listeners = [];

    // native commands(with execCommand), generate function for execCommand
    const commands = [
      'bold', 'italic', 'underline', 'strikethrough', 'superscript', 'subscript',
      'justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull',
      'formatBlock', 'removeFormat', 'backColor',
    ];

    for (let idx = 0, len = commands.length; idx < len; idx++) {
      this[commands[idx]] = ((sCmd) => {
        return (value) => {
          this.beforeCommand();
          document.execCommand(sCmd, false, value);
          this.afterCommand(true);
        };
      })(commands[idx]);
      this.context.memo('help.' + commands[idx], this.lang.help[commands[idx]]);
    }

    this.fontName = this.wrapCommand((value) => {
      return this.fontStyling('font-family', env.validFontName(value));
    });

    this.fontSize = this.wrapCommand((value) => {
      const unit = this.currentStyle()['font-size-unit'];
      return this.fontStyling('font-size', value + unit);
    });

    this.fontSizeUnit = this.wrapCommand((value) => {
      const size = this.currentStyle()['font-size'];
      return this.fontStyling('font-size', size + value);
    });

    for (let idx = 1; idx <= 6; idx++) {
      this['formatH' + idx] = ((idx) => {
        return () => {
          this.formatBlock('H' + idx);
        };
      })(idx);
      this.context.memo('help.formatH' + idx, this.lang.help['formatH' + idx]);
    }

    this.insertParagraph = this.wrapCommand(() => {
      this.typing.insertParagraph(this.editableEl);
    });

    this.insertOrderedList = this.wrapCommand(() => {
      this.bullet.insertOrderedList(this.editableEl);
    });

    this.insertUnorderedList = this.wrapCommand(() => {
      this.bullet.insertUnorderedList(this.editableEl);
    });

    this.indent = this.wrapCommand(() => {
      this.bullet.indent(this.editableEl);
    });

    this.outdent = this.wrapCommand(() => {
      this.bullet.outdent(this.editableEl);
    });

    /**
     * insertNode
     * insert node
     * @param {Node} node
     */
    this.insertNode = this.wrapCommand((node) => {
      if (this.isLimited(node.textContent.length)) {
        return;
      }
      const rng = this.getLastRange();
      rng.insertNode(node);
      this.setLastRange(range.createFromNodeAfter(node).select());
    });

    /**
     * insert text
     * @param {String} text
     */
    this.insertText = this.wrapCommand((text) => {
      if (this.isLimited(text.length)) {
        return;
      }
      const rng = this.getLastRange();
      const textNode = rng.insertNode(dom.createText(text));
      this.setLastRange(range.create(textNode, dom.nodeLength(textNode)).select());
    });

    /**
     * paste HTML
     * @param {String} markup
     */
    this.pasteHTML = this.wrapCommand((markup) => {
      if (this.isLimited(markup.length)) {
        return;
      }
      markup = this.context.invoke('codeview.purify', markup);
      const contents = this.getLastRange().pasteHTML(markup);
      this.setLastRange(range.createFromNodeAfter(lists.last(contents)).select());
    });

    /**
     * formatBlock
     *
     * @param {String} tagName
     */
    this.formatBlock = this.wrapCommand((tagName, targetEl) => {
      const onApplyCustomStyle = this.options.callbacks.onApplyCustomStyle;
      if (onApplyCustomStyle) {
        onApplyCustomStyle.call(this, targetEl, this.context, this.onFormatBlock);
      } else {
        this.onFormatBlock(tagName, targetEl);
      }
    });

    /**
     * insert horizontal rule
     */
    this.insertHorizontalRule = this.wrapCommand(() => {
      const hrNode = this.getLastRange().insertNode(dom.create('HR'));
      if (hrNode.nextSibling) {
        this.setLastRange(range.create(hrNode.nextSibling, 0).normalize().select());
      }
    });

    /**
     * lineHeight
     * @param {String} value
     */
    this.lineHeight = this.wrapCommand((value) => {
      this.style.stylePara(this.getLastRange(), {
        lineHeight: value,
      });
    });

    /**
     * create link (command)
     *
     * @param {Object} linkInfo
     */
    this.createLink = this.wrapCommand((linkInfo) => {
      let rel = [];
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

      let anchors = [];
      if (isTextChanged) {
        rng = rng.deleteContents();
        const anchor = rng.insertNode(func.makeElement('<A>' + linkText + '</A>'));
        anchors.push(anchor);
      } else {
        anchors = this.style.styleNodes(rng, {
          nodeName: 'A',
          expandClosestSibling: true,
          onlyPartialContains: true,
        });
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
     * setting color
     *
     * @param {Object} sObjColor  color code
     * @param {String} sObjColor.foreColor foreground color
     * @param {String} sObjColor.backColor background color
     */
    this.color = this.wrapCommand((colorInfo) => {
      const foreColor = colorInfo.foreColor;
      const backColor = colorInfo.backColor;

      if (foreColor) { document.execCommand('foreColor', false, foreColor); }
      if (backColor) { document.execCommand('backColor', false, backColor); }
    });

    /**
     * Set foreground color
     *
     * @param {String} colorCode foreground color code
     */
    this.foreColor = this.wrapCommand((colorInfo) => {
      document.execCommand('foreColor', false, colorInfo);
    });

    /**
     * insert Table
     *
     * @param {String} dimension of table (ex : "5x5")
     */
    this.insertTable = this.wrapCommand((dim) => {
      const dimension = dim.split('x');

      const rng = this.getLastRange().deleteContents();
      rng.insertNode(this.table.createTable(dimension[0], dimension[1], this.options));
    });

    /**
     * remove media object and Figure Elements if media object is img with Figure.
     */
    this.removeMedia = this.wrapCommand(() => {
      let targetEl = this.restoreTarget();

      targetEl = targetEl && targetEl.parentElement;
      const figureEl = targetEl && targetEl.closest('figure');

      if (figureEl) {
        figureEl.remove();
      } else {
        targetEl = this.restoreTarget();

        if (targetEl) {
          targetEl.remove();
        }
      }
      this.context.triggerEvent('media.delete', targetEl, this.editableEl);
    });

    /**
     * float me
     *
     * @param {String} value
     */
    this.floatMe = this.wrapCommand((value) => {
      const targetEl = this.restoreTarget();

      if (targetEl) {
        targetEl.classList.toggle('note-float-left', value === 'left');
        targetEl.classList.toggle('note-float-right', value === 'right');
        targetEl.style.float = value === 'none' ? '' : value;
      }
    });

    /**
     * resize overlay element
     * @param {String} value
     */
    this.resize = this.wrapCommand((value) => {
      const targetEl = this.restoreTarget();

      if (targetEl) {
        value = parseFloat(value);
        if (value === 0) {
          targetEl.style.width = '';
        } else {
          targetEl.style.width = value * 100 + '%';
          targetEl.style.height = '';
        }
      }
    });
  }

  listen(node, types, callback) {
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

    this.editableEl.setAttribute('spellcheck', this.options.spellCheck);
    this.editableEl.setAttribute('autocorrect', this.options.spellCheck);

    if (this.options.disableGrammar) {
      this.editableEl.setAttribute('data-gramm', false);
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

  handleKeyMap(domEvent) {
    const keyMap = this.options.keyMap[env.isMac ? 'mac' : 'pc'];
    const keys = [];

    if (domEvent.metaKey) { keys.push('CMD'); }
    if (domEvent.ctrlKey && !domEvent.altKey) { keys.push('CTRL'); }
    if (domEvent.shiftKey) { keys.push('SHIFT'); }

    const keyName = key.nameFromCode[domEvent.keyCode];
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

  preventDefaultEditableShortCuts(domEvent) {
    // B(Bold, 66) / I(Italic, 73) / U(Underline, 85)
    if ((domEvent.ctrlKey || domEvent.metaKey) &&
      lists.contains([66, 73, 85], domEvent.keyCode)) {
      domEvent.preventDefault();
    }
  }

  isLimited(pad, domEvent) {
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
   * create a new range from the list of elements
   *
   * @param {list} dom element list
   * @return {WrappedRange}
   */
  createRangeFromList(lst) {
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
   *
   * @param {WrappedRange} rng
   */
  setLastRange(rng) {
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
   * saveRange
   *
   * save current range
   *
   * @param {Boolean} [thenCollapse=false]
   */
  saveRange(thenCollapse) {
    if (thenCollapse) {
      this.getLastRange().collapse().select();
    }
  }

  /**
   * restoreRange
   *
   * restore lately range
   */
  restoreRange() {
    if (this.lastRange) {
      this.lastRange.select();
      this.focus();
    }
  }

  saveTarget(node) {
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
   * style from node
   *
   * @param {HTMLElement} nodeEl
   * @return {Object}
   */
  styleFromNode(nodeEl) {
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
    document.execCommand('styleWithCSS', false, this.options.styleWithCSS);

    // keep focus on editable before command execution
    this.focus();
  }

  /**
   * after command
   * @param {Boolean} isPreventTrigger
   */
  afterCommand(isPreventTrigger) {
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
   * run given function between beforeCommand and afterCommand
   */
  wrapCommand(fn) {
    return function() {
      this.beforeCommand();
      fn.apply(this, arguments);
      this.afterCommand();
    };
  }
  /**
   * removed (function added by 1der1)
  */
  removed(rng, node, tagName) { // LB
		rng = range.create();
		if (rng.isCollapsed() && rng.isOnCell()) {
			node = rng.ec;
			if( (tagName = node.tagName) &&
				(node.childElementCount === 1) &&
				(node.childNodes[0].tagName === "BR") ){

				if(tagName === "P") {
					node.remove();
				} else if(['TH', 'TD'].indexOf(tagName) >=0) {
					node.firstChild.remove();
				}
			}
		}
	}
  /**
   * insert image
   *
   * @param {String} src
   * @param {String|Function} param
   * @return {Promise}
   */
  insertImage(src, param) {
    return createImage(src, param).then((imageEl) => {
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

  /**
   * insertImages
   * @param {File[]} files
   */
  insertImagesAsDataURL(files) {
    [].slice.call(files).forEach((file) => {
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

  /**
   * insertImagesOrCallback
   * @param {File[]} files
   */
  insertImagesOrCallback(files) {
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

  onFormatBlock(tagName, targetEl) {
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

  fontStyling(target, value) {
    const rng = this.getLastRange();
    const outputEl = this.editorEl.querySelector('.note-status-output');

    if (rng !== '') {
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
        if (firstSpan && !dom.nodeLength(firstSpan)) {
          firstSpan.innerHTML = dom.ZERO_WIDTH_NBSP_CHAR;
          range.createFromNode(firstSpan.firstChild).select();
          this.setLastRange();
          this.editableEl['__data' + KEY_BOGUS] = firstSpan;
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

  /**
   * unlink
   *
   * @type command
   */
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

  /**
   * returns link info
   *
   * @return {Object}
   * @return {WrappedRange} return.range
   * @return {String} return.text
   * @return {Boolean} [return.isNewWindow=true]
   * @return {String} [return.url=""]
   */
  getLinkInfo() {
    const rng = this.getLastRange().expand(dom.isAnchor);
    // Get the first anchor on range(for edit).
    const anchorEl = lists.head(rng.nodes(dom.isAnchor));
    const linkInfo = {
      range: rng,
      text: rng.toString(),
      url: anchorEl ? anchorEl.getAttribute('href') : '',
    };

    // When anchor exists,
    if (anchorEl) {
      // Set isNewWindow by checking its target.
      linkInfo.isNewWindow = anchorEl.getAttribute('target') === '_blank';
    }

    return linkInfo;
  }

  addRow(position) {
    const rng = this.getLastRange();
    if (rng.isCollapsed() && rng.isOnCell()) {
      this.beforeCommand();
      this.table.addRow(rng, position);
      this.afterCommand();
    }
  }

  addCol(position) {
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

  /**
   * @param {Position} pos
   * @param {HTMLElement} targetEl - target element
   * @param {Boolean} [bKeepRatio] - keep ratio
   */
  resizeTo(pos, targetEl, bKeepRatio) {
    let imageSize;
    if (bKeepRatio) {
      const newRatio = pos.y / pos.x;
      const ratio = targetEl.getAttribute('data-ratio');
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
