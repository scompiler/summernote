import key from '../core/key';
import func from "../core/func";

export default class ImageDialog {
  constructor(context) {
    this.context = context;
    this.ui = func.getJquery().summernote.ui;
    this.bodyEl = document.body;
    this.options = context.options;
    this.lang = this.options.langInfo;
  }

  initialize() {
    let imageLimitation = '';
    if (this.options.maximumImageFileSize) {
      const unit = Math.floor(Math.log(this.options.maximumImageFileSize) / Math.log(1024));
      const readableSize = (this.options.maximumImageFileSize / Math.pow(1024, unit)).toFixed(2) * 1 +
                         ' ' + ' KMGTP'[unit] + 'B';
      imageLimitation = `<small>${this.lang.image.maximumFileSize + ' : ' + readableSize}</small>`;
    }

    const containerEl = this.options.dialogsInBody ? this.bodyEl : func.jqueryToHtmlElement(this.options.container);
    const body = [
      '<div class="form-group note-form-group note-group-select-from-files">',
        '<label for="note-dialog-image-file-' + this.options.id + '" class="note-form-label">' + this.lang.image.selectFromFiles + '</label>',
        '<input id="note-dialog-image-file-' + this.options.id + '" class="note-image-input form-control-file note-form-control note-input" ',
        ' type="file" name="files" accept="'+this.options.acceptImageFileTypes+'" multiple="multiple"/>',
        imageLimitation,
      '</div>',
      '<div class="form-group note-group-image-url">',
        '<label for="note-dialog-image-url-' + this.options.id + '" class="note-form-label">' + this.lang.image.url + '</label>',
        '<input id="note-dialog-image-url-' + this.options.id + '" class="note-image-url form-control note-form-control note-input" type="text"/>',
      '</div>',
    ].join('');
    const buttonClass = 'btn btn-primary note-btn note-btn-primary note-image-btn';
    const footer = `<input type="button" href="#" class="${buttonClass}" value="${this.lang.image.insert}" disabled>`;

    this.dialogEl = this.ui.dialog({
      title: this.lang.image.insert,
      fade: this.options.dialogsFade,
      body: body,
      footer: footer,
    }).render2();
    containerEl.appendChild(this.dialogEl);
  }

  destroy() {
    this.ui.hideDialog(func.htmlElementToJquery(this.dialogEl));
    this.dialogEl.remove();
  }

  show() {
    this.context.invoke('editor.saveRange');
    this.showImageDialog().then((data) => {
      // [workaround] hide dialog before restore range for IE range focus
      this.ui.hideDialog(func.htmlElementToJquery(this.dialogEl));
      this.context.invoke('editor.restoreRange');

      if (typeof data === 'string') { // image url
        // If onImageLinkInsert set,
        if (this.options.callbacks.onImageLinkInsert) {
          this.context.triggerEvent('image.link.insert', data);
        } else {
          this.context.invoke('editor.insertImage', data);
        }
      } else { // array of files
        this.context.invoke('editor.insertImagesOrCallback', data);
      }
    }).catch(() => {
      this.context.invoke('editor.restoreRange');
    });
  }

  /**
   * show image dialog
   *
   * @return {Promise}
   */
  showImageDialog() {
    return new Promise((resolve) => {
      const imageInputEl = this.dialogEl.querySelector('.note-image-input');
      const imageUrlEl = this.dialogEl.querySelector('.note-image-url');
      const imageBtnEl = this.dialogEl.querySelector('.note-image-btn');

      let listeners = [];

      const listen = (node, event, callback) => {
        event.trim().replace(/ +/, ' ').split(' ').forEach((eachEvent) => {
          node.addEventListener(eachEvent, callback);

          listeners.push({node, event: eachEvent, callback});
        });
      };

      const bindEnterKey = (inputEl, btnEl) => {
        listen(inputEl, 'keypress', (event) => {
          if (event.keyCode === key.code.ENTER) {
            event.preventDefault();
            btnEl.click();
          }
        });
      };

      this.ui.onDialogShown(func.htmlElementToJquery(this.dialogEl), () => {
        this.context.triggerEvent('dialog.shown');

        const newImageInputEl = imageInputEl.cloneNode();

        newImageInputEl.value = '';

        listen(newImageInputEl, 'change', (event) => {
          resolve(event.target.files || event.target.value);
        });

        // Cloning imageInput to clear element.
        imageInputEl.parentNode.replaceChild(newImageInputEl, imageInputEl);

        listen(imageUrlEl, 'input paste propertychange', () => {
          this.ui.toggleBtn(func.htmlElementToJquery(imageBtnEl), imageUrlEl.value);
        });
        imageUrlEl.value = '';
        imageUrlEl.focus();

        listen(imageBtnEl, 'click', (event) => {
          event.preventDefault();
          resolve(imageUrlEl.value);
        });

        bindEnterKey(imageUrlEl, imageBtnEl);
      });

      this.ui.onDialogHidden(func.htmlElementToJquery(this.dialogEl), () => {
        listeners.forEach(x => x.node.removeEventListener(x.event, x.callback));
        listeners = [];
      });

      this.ui.showDialog(func.htmlElementToJquery(this.dialogEl));
    });
  }
}
