import func from "../core/func";

const EDITABLE_PADDING = 24;

export default class Statusbar {
  constructor(context) {
    this.document = document;
    this.statusbarEl = func.jqueryToHtmlElement(context.layoutInfo.statusbar);
    this.editableEl = func.jqueryToHtmlElement(context.layoutInfo.editable);
    this.codableEl = func.jqueryToHtmlElement(context.layoutInfo.codable);
    this.options = context.options;
  }

  initialize() {
    if (this.options.airMode || this.options.disableResizeEditor) {
      return;
    }

    this.statusbarEl.addEventListener('mousedown', this.onMouseDown);
  }

  destroy() {
    this.removeDocumentListeners();

    this.statusbarEl.removeEventListener('mousedown', this.onMouseDown);
    this.statusbarEl.classList.add('locked');
  }

  onMouseDown = (event) => {
    this.removeDocumentListeners();

    event.preventDefault();
    event.stopPropagation();

    const editableTop = func.getElementRect(this.editableEl).top - this.document.scrollingElement.scrollTop;
    const editableCodeTop = func.getElementRect(this.codableEl).top - this.document.scrollingElement.scrollTop;

    this.onMouseMove = (event) => {
      let height = event.clientY - (editableTop + EDITABLE_PADDING);
      let heightCode = event.clientY - (editableCodeTop + EDITABLE_PADDING);

      height = (this.options.minheight > 0) ? Math.max(height, this.options.minheight) : height;
      height = (this.options.maxHeight > 0) ? Math.min(height, this.options.maxHeight) : height;
      heightCode = (this.options.minheight > 0) ? Math.max(heightCode, this.options.minheight) : heightCode;
      heightCode = (this.options.maxHeight > 0) ? Math.min(heightCode, this.options.maxHeight) : heightCode;

      this.editableEl.style.height = height + 'px';
      this.codableEl.style.height = heightCode + 'px';
    };

    this.onMouseUp = () => this.removeDocumentListeners();

    this.document.addEventListener('mousemove', this.onMouseMove);
    this.document.addEventListener('mouseup', this.onMouseUp);
  };

  onMouseUp = () => {};

  onMouseMove = () => {};

  removeDocumentListeners() {
    this.document.removeEventListener('mousemove', this.onMouseMove);
    this.document.removeEventListener('mouseup', this.onMouseUp);
  }
}
