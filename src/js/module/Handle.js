import dom from '../core/dom.ts';
import func from "../core/func.ts";

export default class Handle {
  constructor(context) {
    this.context = context;
    this.documentEl = document;
    this.editingAreaEl = context.layoutInfo.editingAreaEl;
    this.options = context.options;
    this.lang = this.options.langInfo;

    this.events = {
      'summernote.mousedown': (customEvent) => {
        const domEvent = customEvent.detail[0];

        if (this.update(domEvent.target, domEvent)) {
          domEvent.preventDefault();
        }
      },
      'summernote.keyup summernote.scroll summernote.change summernote.dialog.shown': () => {
        this.update();
      },
      'summernote.disable summernote.blur': () => {
        this.hide();
      },
      'summernote.codeview.toggled': () => {
        this.update();
      },
    };
  }

  initialize() {
    this.handleEl = (() => {
      const div = document.createElement('div');

      div.innerHTML = [
        '<div class="note-handle">',
          '<div class="note-control-selection">',
            '<div class="note-control-selection-bg"></div>',
            '<div class="note-control-holder note-control-nw"></div>',
            '<div class="note-control-holder note-control-ne"></div>',
            '<div class="note-control-holder note-control-sw"></div>',
            '<div class="',
              (this.options.disableResizeImage ? 'note-control-holder' : 'note-control-sizing'),
              ' note-control-se"></div>',
            (this.options.disableResizeImage ? '' : '<div class="note-control-selection-info"></div>'),
          '</div>',
        '</div>',
      ].join('');

      return div.firstElementChild;
    })();
    this.editingAreaEl.insertBefore(this.handleEl, this.editingAreaEl.firstChild);

    this.handleEl.addEventListener('mousedown', (domEvent) => {
      if (dom.isControlSizing(domEvent.target)) {
        domEvent.preventDefault();
        domEvent.stopPropagation();

        const targetEl = this.handleEl.querySelector('.note-control-selection').__target;
        const posStart = func.getElementOffset(targetEl);
        const scrollTop = this.documentEl.scrollingElement.scrollTop;

        const onMouseMove = (domEventMove) => {
          this.context.invoke('editor.resizeTo', {
            x: domEventMove.clientX - posStart.left,
            y: domEventMove.clientY - (posStart.top - scrollTop),
          }, targetEl, !domEventMove.shiftKey);

          this.update(targetEl, domEventMove);
        };

        const onMouseUp = (domEventUp) => {
          domEventUp.preventDefault();

          this.documentEl.removeEventListener('mousemove', onMouseMove);
          this.documentEl.removeEventListener('mouseup', onMouseUp);
          this.context.invoke('editor.afterCommand');
        };

        this.documentEl.addEventListener('mousemove', onMouseMove);
        this.documentEl.addEventListener('mouseup', onMouseUp);

        if (!targetEl.hasAttribute('data-ratio')) { // original ratio.
          targetEl.setAttribute('data-ratio', targetEl.offsetHeight / targetEl.offsetWidth);
        }
      }
    });

    // Listen for scrolling on the handle overlay.
    this.handleEl.addEventListener('wheel', (domEvent) => {
      domEvent.preventDefault();
      this.update();
    });
  }

  destroy() {
    this.handleEl.remove();
  }

  update(target, domEvent) {
    if (this.context.isDisabled()) {
      return false;
    }

    const imageEl = target;
    const isImage = dom.isImg(imageEl);
    const selectionEl = this.handleEl.querySelector('.note-control-selection');

    this.context.invoke('imagePopover.update', imageEl, domEvent);

    if (isImage) {
      const areaRect = this.editingAreaEl.getBoundingClientRect();
      const imageRect = imageEl.getBoundingClientRect();

      selectionEl.style.display = 'block';
      selectionEl.style.left = (imageRect.left - areaRect.left) + 'px';
      selectionEl.style.top = (imageRect.top - areaRect.top) + 'px';
      selectionEl.style.width = imageRect.width + 'px';
      selectionEl.style.height = imageRect.height + 'px';
      selectionEl.__target = imageEl;

      const origImageObj = new Image();
      origImageObj.src = imageEl.src;

      selectionEl.querySelector('.note-control-selection-info').textContent = imageRect.width + 'x' + imageRect.height + ' (' + this.lang.image.original + ': ' + origImageObj.width + 'x' + origImageObj.height + ')';
      this.context.invoke('editor.saveTarget', imageEl);
    } else {
      this.hide();
    }

    return isImage;
  }

  /**
   * hide
   */
  hide() {
    this.context.invoke('editor.clearTarget');
    this.handleEl.firstElementChild.style.display = 'none';
  }
}
