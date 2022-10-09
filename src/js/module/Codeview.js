import dom from '../core/dom';

/**
 * @class Codeview
 */
export default class CodeView {
  constructor(context) {
    this.context = context;
    this.editorEl = context.layoutInfo.editorEl;
    this.editableEl = context.layoutInfo.editableEl;
    this.codableEl = context.layoutInfo.codableEl;
    this.options = context.options;
    this.CodeMirrorConstructor = window.CodeMirror;

    if (this.options.codemirror.CodeMirrorConstructor) {
      this.CodeMirrorConstructor = this.options.codemirror.CodeMirrorConstructor;
    }
  }

  sync(html) {
    const isCodeview = this.isActivated();
    const CodeMirror = this.CodeMirrorConstructor;

    if (isCodeview) {
      if (html) {
        if (CodeMirror) {
          this.codableEl.__cmEditorInstance.getDoc().setValue(html);
        } else {
          this.codableEl.value = html;
        }
      } else {
        if (CodeMirror) {
          this.codableEl.__cmEditorInstance.save();
        }
      }
    }
  }

  initialize() {
    this.codableEl.addEventListener('keyup', (domEvent) => {
      if (domEvent.key === 'Escape') {
        this.deactivate();
      }
    });
  }

  /**
   * @return {Boolean}
   */
  isActivated() {
    return this.editorEl.classList.contains('codeview');
  }

  /**
   * toggle codeview
   */
  toggle() {
    if (this.isActivated()) {
      this.deactivate();
    } else {
      this.activate();
    }
    this.context.triggerEvent('codeview.toggled');
  }

  /**
   * purify input value
   * @param value
   * @returns {*}
   */
  purify(value) {
    if (this.options.codeviewFilter) {
      // filter code view regex
      value = value.replace(this.options.codeviewFilterRegex, '');
      // allow specific iframe tag
      if (this.options.codeviewIframeFilter) {
        const whitelist = this.options.codeviewIframeWhitelistSrc.concat(this.options.codeviewIframeWhitelistSrcBase);
        value = value.replace(/(<iframe.*?>.*?(?:<\/iframe>)?)/gi, function(tag) {
          // remove if src attribute is duplicated
          if (/<.+src(?==?('|"|\s)?)[\s\S]+src(?=('|"|\s)?)[^>]*?>/i.test(tag)) {
            return '';
          }
          for (const src of whitelist) {
            // pass if src is trusted
            if ((new RegExp('src="(https?:)?\/\/' + src.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '\/(.+)"')).test(tag)) {
              return tag;
            }
          }
          return '';
        });
      }
    }
    return value;
  }

  /**
   * activate code view
   */
  activate() {
    const height = this.editableEl.offsetHeight;
    const CodeMirror = this.CodeMirrorConstructor;
    this.codableEl.value = dom.html(this.editableEl, this.options.prettifyHtml);
    this.codableEl.style.height = height + 'px';

    this.context.invoke('toolbar.updateCodeview', true);
    this.context.invoke('airPopover.updateCodeview', true);

    this.editorEl.classList.add('codeview');
    this.codableEl.focus();

    // activate CodeMirror as codable
    if (CodeMirror) {
      const cmEditor = CodeMirror.fromTextArea(this.codableEl, this.options.codemirror);

      // CodeMirror TernServer
      if (this.options.codemirror.tern) {
        const server = new CodeMirror.TernServer(this.options.codemirror.tern);
        cmEditor.ternServer = server;
        cmEditor.on('cursorActivity', (cm) => {
          server.updateArgHints(cm);
        });
      }

      cmEditor.on('blur', (domEvent) => {
        this.context.triggerEvent('blur.codeview', cmEditor.getValue(), domEvent);
      });
      cmEditor.on('change', () => {
        this.context.triggerEvent('change.codeview', cmEditor.getValue(), cmEditor);
      });

      // CodeMirror hasn't Padding.
      cmEditor.setSize(null, height);
      this.codableEl.__cmEditorInstance = cmEditor;
    } else {
      this.codableEl.addEventListener('blur', (domEvent) => {
        this.context.triggerEvent('blur.codeview', this.codableEl.value, domEvent);
      });
      this.codableEl.addEventListener('input', () => {
        this.context.triggerEvent('change.codeview', this.codableEl.value, this.codableEl);
      });
    }
  }

  /**
   * deactivate code view
   */
  deactivate() {
    const CodeMirror = this.CodeMirrorConstructor;
    // deactivate CodeMirror as codable
    if (CodeMirror) {
      const cmEditor = this.codableEl.__cmEditorInstance;
      this.codableEl.value = cmEditor.getValue();
      cmEditor.toTextArea();
    }

    const value = this.purify(dom.value(this.codableEl, this.options.prettifyHtml) || dom.emptyPara);
    const isChange = this.editableEl.innerHTML !== value;

    this.editableEl.innerHTML = value;
    this.editableEl.style.height = this.options.height ? (this.codableEl.offsetHeight + 'px') : 'auto';
    this.editorEl.classList.remove('codeview');

    if (isChange) {
      this.context.triggerEvent('change', this.editableEl.innerHTML, this.editableEl);
    }

    this.editableEl.focus();

    this.context.invoke('toolbar.updateCodeview', false);
    this.context.invoke('airPopover.updateCodeview', false);
  }

  destroy() {
    if (this.isActivated()) {
      this.deactivate();
    }
  }
}
