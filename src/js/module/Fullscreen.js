import func from "../core/func";

export default class Fullscreen {
  constructor(context) {
    this.context = context;

    this.editorEl = func.jqueryToHtmlElement(context.layoutInfo.editor);
    this.toolbarEl = func.jqueryToHtmlElement(context.layoutInfo.toolbar);
    this.editableEl = func.jqueryToHtmlElement(context.layoutInfo.editable);
    this.codableEl = func.jqueryToHtmlElement(context.layoutInfo.codable);

    this.window = window;
    this.htmlEl = document.documentElement;
    this.scrollbarClassName = 'note-fullscreen-body';

    this.onResize = () => {
      const toolbarHeight = this.toolbarEl ? this.toolbarEl.offsetHeight : 0;

      this.resizeTo({
        h: (this.window.innerHeight - toolbarHeight) + 'px',
      });
    };
  }

  resizeTo(size) {
    this.editableEl.style.height = size.h;
    this.codableEl.style.height = size.h;

    if (func.htmlElementToJquery(this.codableEl).data('cmeditor')) {
      func.htmlElementToJquery(this.codableEl).data('cmeditor').setsize(null, size.h);
    }
  }

  /**
   * toggle fullscreen
   */
  toggle() {
    if (this.isFullscreen()) {
      this.editorEl.removeAttribute('data-fullscreen');
    } else {
      this.editorEl.setAttribute('data-fullscreen', 'true');
    }

    const isFullscreen = this.isFullscreen();
    this.htmlEl.classList.toggle(this.scrollbarClassName, isFullscreen);
    if (isFullscreen) {
      this.editableEl.setAttribute('data-height', this.editableEl.style.height);
      this.editableEl.setAttribute('data-max-height', this.editableEl.style.maxHeight);
      this.editableEl.style.maxHeight = '';

      this.window.addEventListener('resize', this.onResize);
      this.onResize();
    } else {
      this.window.removeEventListener('resize', this.onResize);
      this.resizeTo({
        h: this.editableEl.getAttribute('data-height'),
      });
      this.editableEl.style.maxHeight = this.editableEl.getAttribute('data-max-height');
    }

    this.context.invoke('toolbar.updateFullscreen', isFullscreen);
  }

  isFullscreen() {
    return this.editorEl.getAttribute('data-fullscreen') === 'true';
  }

  destroy() {
    this.htmlEl.classList.remove(this.scrollbarClassName);
  }
}
