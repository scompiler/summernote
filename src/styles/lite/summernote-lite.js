import '/js/settings';
import renderer from '/js/renderer';
import Summernote from "../../js/class";

import './summernote-lite.scss';
import TooltipUI from './js/TooltipUI';
import DropdownUI from './js/DropdownUI';
import ModalUI from './js/ModalUI';
import func from "../../js/core/func";

const editor = renderer.create('<div class="note-editor note-frame"></div>');
const toolbar = renderer.create('<div class="note-toolbar" role="toolbar"></div>');
const editingArea = renderer.create('<div class="note-editing-area"></div>');
const codable = renderer.create('<textarea class="note-codable" aria-multiline="true"></textarea>');
const editable = renderer.create('<div class="note-editable" contentEditable="true" role="textbox" aria-multiline="true"></div>');
const statusbar = renderer.create([
  '<output class="note-status-output" role="status" aria-live="polite"></output>',
  '<div class="note-statusbar" role="status">',
    '<div class="note-resizebar" aria-label="resize">',
      '<div class="note-icon-bar"></div>',
      '<div class="note-icon-bar"></div>',
      '<div class="note-icon-bar"></div>',
    '</div>',
  '</div>',
].join(''));

const airEditor = renderer.create('<div class="note-editor note-airframe"></div>');
const airEditable = renderer.create([
  '<div class="note-editable" contentEditable="true" role="textbox" aria-multiline="true"></div>',
  '<output class="note-status-output" role="status" aria-live="polite"></output>',
].join(''));

const buttonGroup = renderer.create('<div class="note-btn-group"></div>');
const button = renderer.create('<button type="button" class="note-btn" tabindex="-1"></button>', function(nodeEls, options) {
  nodeEls.forEach((nodeEl) => {
    // set button type
    if (options && options.tooltip) {
      nodeEl.setAttribute('aria-label', options.tooltip);

      const tooltip = new TooltipUI(nodeEl, {
        title: options.tooltip,
        container: options.container,
      });

      nodeEl.addEventListener('click', () => {
        tooltip.hide();
      });
    }
    if (options.contents) {
      nodeEl.innerHTML = options.contents;
    }

    if (options && options.data && options.data.toggle === 'dropdown') {
      new DropdownUI(nodeEl, {
        container: options.container,
      });
    }

    if (options && options.codeviewKeepButton) {
      nodeEl.classList.add('note-codeview-keep');
    }
  });
});

const dropdown = renderer.create('<div class="note-dropdown-menu" role="list"></div>', function(nodeEls, options) {
  const markup = Array.isArray(options.items) ? options.items.map(function(item) {
    const value = (typeof item === 'string') ? item : (item.value || '');
    const content = options.template ? options.template(item) : item;
    const aEl = func.makeElement('<a class="note-dropdown-item" href="#" data-value="' + value + '" role="listitem" aria-label="' + value + '"></a>');

    aEl.innerHTML = content;
    aEl.__itemData = item;

    return aEl;
  }) : options.items;

  nodeEls.forEach((nodeEl) => {
    if (Array.isArray(markup)) {
      nodeEl.innerHTML = '';

      markup.forEach((itemEl) => nodeEl.appendChild(itemEl));
    } else if (markup !== undefined) {
      nodeEl.innerHTML = markup;
    }

    nodeEl.setAttribute('aria-label', options.title);
    nodeEl.addEventListener('click', (domEvent) => {
      const itemEl = domEvent.target.closest('.note-dropdown-item');

      if (!itemEl || itemEl.parentNode !== nodeEl) {
        return;
      }

      const item = itemEl.__itemData;
      const value = itemEl.getAttribute('data-value');

      if (item.click) {
        item.click(itemEl);
      } else if (options.itemClick) {
        options.itemClick(domEvent, item, value);
      }
    });

    if (options && options.codeviewKeepButton) {
      nodeEl.classList.add('note-codeview-keep');
    }
  });
});

const dropdownCheck = renderer.create('<div class="note-dropdown-menu note-check" role="list"></div>', function(nodeEls, options) {
  const markup = Array.isArray(options.items) ? options.items.map(function(item) {
    const value = (typeof item === 'string') ? item : (item.value || '');
    const content = options.template ? options.template(item) : item;
    const aEl = func.makeElement('<a class="note-dropdown-item" href="#" data-value="' + value + '" role="listitem" aria-label="' + item + '"></a>');

    aEl.innerHTML = [icon(options.checkClassName), ' ', content].join('');
    aEl.__itemData = item;

    return aEl;
  }) : options.items;

  nodeEls.forEach((nodeEl) => {
    if (Array.isArray(markup)) {
      nodeEl.innerHTML = '';

      markup.forEach((itemEl) => nodeEl.appendChild(itemEl));
    } else if (markup !== undefined) {
      nodeEl.innerHTML = markup;
    }

    nodeEl.setAttribute('aria-label', options.title);
    nodeEl.addEventListener('click', (domEvent) => {
      const itemEl = domEvent.target.closest('.note-dropdown-item');

      if (!itemEl || itemEl.parentNode !== nodeEl) {
        return;
      }

      const item = itemEl.__itemData;
      const value = itemEl.getAttribute('data-value');

      if (item.click) {
        item.click(itemEl);
      } else if (options.itemClick) {
        options.itemClick(domEvent, item, value);
      }
    });

    if (options && options.codeviewKeepButton) {
      nodeEl.classList.add('note-codeview-keep');
    }
  });
});

const dropdownButtonContents = function(contents, options) {
  return contents + ' ' + icon(options.icons.caret, 'span');
};

const dropdownButton = function(opt, callback) {
  return buttonGroup([
    button({
      className: 'dropdown-toggle',
      contents: opt.title + ' ' + icon('note-icon-caret'),
      tooltip: opt.tooltip,
      data: {
        toggle: 'dropdown',
      },
    }),
    dropdown({
      className: opt.className,
      items: opt.items,
      template: opt.template,
      itemClick: opt.itemClick,
    }),
  ], { callback: callback }).render2();
};

const palette = renderer.create('<div class="note-color-palette"></div>', function(nodeEls, options) {
  const contents = [];
  for (let row = 0, rowSize = options.colors.length; row < rowSize; row++) {
    const eventName = options.eventName;
    const colors = options.colors[row];
    const colorsName = options.colorsName[row];
    const buttons = [];
    for (let col = 0, colSize = colors.length; col < colSize; col++) {
      const color = colors[col];
      const colorName = colorsName[col];
      buttons.push([
        '<button type="button" class="note-btn note-color-btn"',
        'style="background-color:', color, '" ',
        'data-event="', eventName, '" ',
        'data-value="', color, '" ',
        'data-title="', colorName, '" ',
        'aria-label="', colorName, '" ',
        'data-toggle="button" tabindex="-1"></button>',
      ].join(''));
    }
    contents.push('<div class="note-color-row">' + buttons.join('') + '</div>');
  }

  nodeEls.forEach((nodeEl) => {
    nodeEl.innerHTML = contents.join('');

    [].slice.call(nodeEl.querySelectorAll('.note-color-btn')).forEach((colorBtnEl) => new TooltipUI(colorBtnEl, {
      container: options.container,
    }));
  });
});

const dialog = renderer.create('<div class="note-modal" aria-hidden="false" tabindex="-1" role="dialog"></div>', function(nodeEls, options) {
  const markup = [
    '<div class="note-modal-content">',
    (options.title ? '<div class="note-modal-header"><button type="button" class="close" aria-label="Close" aria-hidden="true"><i class="note-icon-close"></i></button><h4 class="note-modal-title">' + options.title + '</h4></div>' : ''),
    '<div class="note-modal-body">' + options.body + '</div>',
    (options.footer ? '<div class="note-modal-footer">' + options.footer + '</div>' : ''),
    '</div>',
  ].join('');

  nodeEls.forEach((nodeEl) => {
    if (options.fade) {
      nodeEl.classList.add('fade');
    }

    nodeEl.setAttribute('aria-label', options.title);
    nodeEl.innerHTML = markup;
    nodeEl.__modalInstance = new ModalUI(nodeEl, options);
  });
});

const videoDialog = function(opt) {
  const body = '<div class="note-form-group">' +
    '<label for="note-dialog-video-url-' + opt.id + '" class="note-form-label">' + opt.lang.video.url + ' <small class="text-muted">' + opt.lang.video.providers + '</small></label>' +
    '<input id="note-dialog-video-url-' + opt.id + '" class="note-video-url note-input" type="text"/>' +
  '</div>';
  const footer = [
    '<button type="button" href="#" class="note-btn note-btn-primary note-video-btn disabled" disabled>',
      opt.lang.video.insert,
    '</button>',
  ].join('');

  return dialog({
    title: opt.lang.video.insert,
    fade: opt.fade,
    body: body,
    footer: footer,
  }).render2();
};

const imageDialog = function(opt) {
  const body = '<div class="note-form-group note-group-select-from-files">' +
    '<label for="note-dialog-image-file-' + opt.id + '" class="note-form-label">' + opt.lang.image.selectFromFiles + '</label>' +
    '<input id="note-dialog-image-file-' + opt.id + '" class="note-note-image-input note-input" type="file" name="files" accept="image/*" multiple="multiple"/>' +
    opt.imageLimitation +
  '</div>' +
  '<div class="note-form-group">' +
    '<label for="note-dialog-image-url-' + opt.id + '" class="note-form-label">' + opt.lang.image.url + '</label>' +
    '<input id="note-dialog-image-url-' + opt.id + '" class="note-image-url note-input" type="text"/>' +
  '</div>';
  const footer = [
    '<button href="#" type="button" class="note-btn note-btn-primary note-btn-large note-image-btn disabled" disabled>',
      opt.lang.image.insert,
    '</button>',
  ].join('');

  return dialog({
    title: opt.lang.image.insert,
    fade: opt.fade,
    body: body,
    footer: footer,
  }).render2();
};

const linkDialog = function(opt) {
  const body = '<div class="note-form-group">' +
    '<label for="note-dialog-link-txt-' + opt.id + '" class="note-form-label">' + opt.lang.link.textToDisplay + '</label>' +
    '<input id="note-dialog-link-txt-' + opt.id + '" class="note-link-text note-input" type="text"/>' +
  '</div>' +
  '<div class="note-form-group">' +
    '<label for="note-dialog-link-url-' + opt.id + '" class="note-form-label">' + opt.lang.link.url + '</label>' +
    '<input id="note-dialog-link-url-' + opt.id + '" class="note-link-url note-input" type="text" value="http://"/>' +
  '</div>' +
  (!opt.disableLinkTarget ? '<div class="checkbox"><label for="note-dialog-link-nw-' + opt.id + '"><input id="note-dialog-link-nw-' + opt.id + '" type="checkbox" checked> ' + opt.lang.link.openInNewWindow + '</label></div>' : '') +
  '<div class="checkbox"><label for="note-dialog-link-up-' + opt.id + '"><input id="note-dialog-link-up-' + opt.id + '" type="checkbox" checked> ' + opt.lang.link.useProtocol + '</label></div>';
  const footer = [
    '<button href="#" type="button" class="note-btn note-btn-primary note-link-btn disabled" disabled>',
      opt.lang.link.insert,
    '</button>',
  ].join('');

  return dialog({
    className: 'link-dialog',
    title: opt.lang.link.insert,
    fade: opt.fade,
    body: body,
    footer: footer,
  }).render2();
};

const popover = renderer.create([
  '<div class="note-popover bottom">',
    '<div class="note-popover-arrow"></div>',
    '<div class="popover-content note-children-container"></div>',
  '</div>',
].join(''), function(nodeEls, options) {
  const direction = typeof options.direction !== 'undefined' ? options.direction : 'bottom';

  nodeEls.forEach((nodeEl) => {
    if (direction) {
      nodeEl.classList.add(direction);
    }

    nodeEl.style.display = 'none';

    if (options.hideArrow) {
      const arrowEl = nodeEl.querySelector('.note-popover-arrow');

      if (arrowEl) {
        arrowEl.style.display = 'none';
      }
    }
  });
});

const checkbox = renderer.create('<div class="checkbox"></div>', function(nodeEls, options) {
  const markup = [
    '<label' + (options.id ? ' for="note-' + options.id + '"' : '') + '>',
    '<input role="checkbox" type="checkbox"' + (options.id ? ' id="note-' + options.id + '"' : ''),
    (options.checked ? ' checked' : ''),
    ' aria-checked="' + (options.checked ? 'true' : 'false') + '"/>',
    (options.text ? options.text : ''),
    '</label>',
  ].join('');

  nodeEls.forEach((nodeEl) => {
    nodeEl.innerHTML = markup;
  });
});

const icon = function(iconClassName, tagName) {
  if (iconClassName.match(/^</)) {
    return iconClassName;
  }
  tagName = tagName || 'i';
  return '<' + tagName + ' class="' + iconClassName + '"></' + tagName + '>';
};

const ui = function(editorOptions) {
  return {
    editor: editor,
    toolbar: toolbar,
    editingArea: editingArea,
    codable: codable,
    editable: editable,
    statusbar: statusbar,
    airEditor: airEditor,
    airEditable: airEditable,
    buttonGroup: buttonGroup,
    button: button,
    dropdown: dropdown,
    dropdownCheck: dropdownCheck,
    dropdownButton: dropdownButton,
    dropdownButtonContents: dropdownButtonContents,
    palette: palette,
    dialog: dialog,
    videoDialog: videoDialog,
    imageDialog: imageDialog,
    linkDialog: linkDialog,
    popover: popover,
    checkbox: checkbox,
    icon: icon,
    options: editorOptions,

    toggleBtn: function(btnEl, isEnable) {
      btnEl.classList.toggle('disabled', !isEnable);
      btnEl.toggleAttribute('disabled', !isEnable);
    },

    toggleBtnActive: function(btnEl, isActive) {
      btnEl.classList.toggle('active', isActive);
    },

    onDialogShown: function(dialogEl, handler) {
      const onShow = function() {
        dialogEl.removeEventListener('note.modal.show', onShow);

        handler.apply(this, arguments);
      };

      dialogEl.addEventListener('note.modal.show', onShow);
    },

    onDialogHidden: function(dialogEl, handler) {
      const onShow = function() {
        dialogEl.removeEventListener('note.modal.hide', onShow);

        handler.apply(this, arguments);
      };

      dialogEl.addEventListener('note.modal.hide', onShow);
    },

    showDialog: function(dialogEl) {
      dialogEl.__modalInstance.show();
    },

    hideDialog: function(dialogEl) {
      dialogEl.__modalInstance.hide();
    },

    createLayout: function(noteEl) {
      const airModeLayout = () => airEditor([
        editingArea([
          codable(),
          airEditable(),
        ]),
      ]);
      const toolbarTopLayout = () => editor([
        toolbar(),
        editingArea([
          codable(),
          editable(),
        ]),
        statusbar(),
      ]);
      const toolbarBottomLayout = () => editor([
        editingArea([
          codable(),
          editable(),
        ]),
        toolbar(),
        statusbar(),
      ]);

      const editorEl = (editorOptions.airMode ? airModeLayout() : (
        editorOptions.toolbarPosition === 'bottom' ? toolbarBottomLayout() : toolbarTopLayout()
      )).render2();

      noteEl.parentNode.insertBefore(editorEl, noteEl.nextSibling);

      return {
        noteEl: noteEl,
        editorEl: editorEl,
        toolbarEl: editorEl.querySelector('.note-toolbar'),
        editingAreaEl: editorEl.querySelector('.note-editing-area'),
        editableEl: editorEl.querySelector('.note-editable'),
        codableEl: editorEl.querySelector('.note-codable'),
        statusbarEl: editorEl.querySelector('.note-statusbar'),
      };
    },

    removeLayout: function(noteEl, layoutInfo) {
      noteEl.innerHTML = layoutInfo.editableEl.innerHTML;
      layoutInfo.editorEl.remove();
      noteEl.style.display = 'block';
    },
  };
};

Summernote.meta = Object.assign(Summernote.meta, {
  ui_template: ui,
  interface: 'lite',
});
