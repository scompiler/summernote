import func from "../core/func";

export default class Placeholder {
  constructor(context) {
    this.context = context;

    this.editingAreaEl = func.jqueryToHtmlElement(context.layoutInfo.editingArea);
    this.options = context.options;

    if (this.options.inheritPlaceholder === true) {
      // get placeholder value from the original element
      this.options.placeholder = this.context.noteEl.getAttribute('placeholder') || this.options.placeholder;
    }

    this.events = {
      'summernote.init summernote.change': () => {
        this.update();
      },
      'summernote.codeview.toggled': () => {
        this.update();
      },
    };
  }

  shouldInitialize() {
    return !!this.options.placeholder;
  }

  initialize() {
    this.placeholderEl = func.makeElement('<div class="note-placeholder"></div>');
    this.placeholderEl.innerHTML = this.options.placeholder;
    this.placeholderEl.addEventListener('click', () => {
      this.context.invoke('focus');
    });

    this.editingAreaEl.insertBefore(this.placeholderEl, this.editingAreaEl.firstChild);

    this.update();
  }

  destroy() {
    this.editingAreaEl.remove();
  }

  update() {
    const isShow = !this.context.invoke('codeview.isActivated') && this.context.invoke('editor.isEmpty');

    if (isShow) {
      this.placeholderEl.style.display = 'block';
    } else {
      this.placeholderEl.style.display = 'none';
    }
  }
}
