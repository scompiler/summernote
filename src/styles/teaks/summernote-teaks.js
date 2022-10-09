import '/js/settings';
import renderer from '/js/renderer';
import Summernote from "../../js/class";

import './summernote-teaks.scss';
import TooltipUI from './js/TooltipUI';
import DropdownUI from './js/DropdownUI';
import ModalUI from './js/ModalUI';
import func from "../../js/core/func";

const editor = renderer.create('<div class="tea-editor    note-editor note-frame" data-mode="frame"></div>');
const toolbar = renderer.create([
  '<div class="tea-editor__toolbar">',
    '<div class="tea-editor__toolbar-body    note-toolbar" role="toolbar" />',
  '</div>',
].join(''));
const editingArea = renderer.create('<div class="note-editing-area"></div>');
const codable = renderer.create('<textarea class="note-codable" aria-multiline="true"></textarea>');
const editable = renderer.create('<div class="note-editable" contentEditable="true" role="textbox" aria-multiline="true"></div>');
const statusbar = renderer.create([
  '<output class="note-status-output" role="status" aria-live="polite"></output>',
  '<div class="tea-editor__statusbar    note-statusbar" role="status">',
    '<div class="tea-editor__resizebar    note-resizebar" aria-label="Resize">',
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="4" viewBox="0 0 24 4" fill="currentColor">',
        '<path d="M0 0H24V1H0V0Z" />',
        '<path d="M0 3H24V4H0V3Z" />',
      '</svg>',
    '</div>',
  '</div>',
].join(''));

const airEditor = renderer.create('<div class="note-editor note-airframe"></div>');
const airEditable = renderer.create([
  '<div class="note-editable" contentEditable="true" role="textbox" aria-multiline="true"></div>',
  '<output class="note-status-output" role="status" aria-live="polite"></output>',
].join(''));

const buttonGroup = renderer.create('<div class="tea-editor__button-group note-btn-group">');
const button = renderer.create('<button type="button" class="tea-editor__button    note-btn" tabindex="-1"></button>', function(nodeEls, options) {
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

const buttonsStack = renderer.create([
  '<div class="tea-editor__buttons-stack"/>',
    '<div class="tea-editor__buttons-stack-body    note-toolbar  note-children-container" role="toolbar" />',
  '</div>',
].join(''));

const dropdownButtonContents = function(contents) {
  return contents + [
    '<svg xmlns="http://www.w3.org/2000/svg" class="tea-editor__dropdown-icon" width="6" height="10" viewBox="0 0 6 10" fill="currentColor">',
      '<path d="M4.50488 4.01551H0.498883C0.0958829 4.01551 -0.140117 3.50751 0.0908829 3.13751L2.09688 0.248509C2.13779 0.176345 2.19711 0.116323 2.26879 0.0745638C2.34046 0.0328047 2.42193 0.0108032 2.50488 0.0108032C2.58784 0.0108032 2.6693 0.0328047 2.74098 0.0745638C2.81266 0.116323 2.87197 0.176345 2.91288 0.248509L4.91288 3.13751C5.14388 3.50751 4.90788 4.01551 4.50488 4.01551ZM0.498883 6.01551H4.50488C4.90788 6.01551 5.14388 6.51951 4.91288 6.88651L2.90688 9.75251C2.86576 9.82441 2.80637 9.88417 2.73472 9.92574C2.66308 9.9673 2.58171 9.98919 2.49888 9.98919C2.41605 9.98919 2.33469 9.9673 2.26304 9.92574C2.19139 9.88417 2.132 9.82441 2.09088 9.75251L0.0908829 6.88651C-0.140117 6.51951 0.0958829 6.01551 0.498883 6.01551Z" />',
    '</svg>',
  ].join('');
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
    '<div class="tea-editor__buttons-stack"/>',
      '<div class="tea-editor__buttons-stack-body    note-toolbar  note-children-container popover-content" role="toolbar" />',
    '</div>',
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
    return '<div class="tea-editor__icon">' + iconClassName + '</div>';
  }
  tagName = tagName || 'i';
  return '<' + tagName + ' class="' + iconClassName + '"></' + tagName+'>';
};

const ui = function(editorOptions) {
  return {
    editor: editor,
    toolbar: toolbar,
    buttonsStack: buttonsStack,
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
        toolbarEl: editorEl.querySelector('.tea-editor__toolbar'),
        toolbarContentEl: editorEl.querySelector('.tea-editor__toolbar-body'),
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
  interface: 'teaks',
});

Summernote.meta.options.icons = Object.assign(Summernote.meta.options.icons, {
  bold: [
    '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="currentColor">',
    '<path d="M9.31983 5.57812C9.67675 5.14215 9.8969 4.61044 9.95265 4.04977C10.1256 2.26148 8.72241 0.75 6.97444 0.75H2.30054C2.20108 0.75 2.1057 0.789509 2.03537 0.859835C1.96505 0.930161 1.92554 1.02554 1.92554 1.125V2.25C1.92554 2.34946 1.96505 2.44484 2.03537 2.51516C2.1057 2.58549 2.20108 2.625 2.30054 2.625H3.04749V9.375H2.30054C2.20108 9.375 2.1057 9.41451 2.03537 9.48483C1.96505 9.55516 1.92554 9.65054 1.92554 9.75V10.875C1.92554 10.9745 1.96505 11.0698 2.03537 11.1402C2.1057 11.2105 2.20108 11.25 2.30054 11.25H7.20647C8.86585 11.25 10.3504 10.0371 10.5112 8.38125C10.6223 7.2457 10.127 6.22359 9.31983 5.57812ZM4.91757 2.625H6.97444C7.27281 2.625 7.55896 2.74353 7.76994 2.9545C7.98092 3.16548 8.09944 3.45163 8.09944 3.75C8.09944 4.04837 7.98092 4.33452 7.76994 4.5455C7.55896 4.75647 7.27281 4.875 6.97444 4.875H4.91757V2.625ZM6.97444 9.375H4.91757V6.75H6.97444C7.32254 6.75 7.65638 6.88828 7.90252 7.13442C8.14866 7.38056 8.28694 7.7144 8.28694 8.0625C8.28694 8.4106 8.14866 8.74444 7.90252 8.99058C7.65638 9.23672 7.32254 9.375 6.97444 9.375Z" />',
    '</svg>',
  ].join(''),
  magic: [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1.125em" height="1em" viewBox="0 0 18 16" fill="currentColor">',
    '<path d="M7.33437 1.33438L6.15625 1.775C6.0625 1.80937 6 1.9 6 2C6 2.1 6.0625 2.19062 6.15625 2.225L7.33437 2.66563L7.775 3.84375C7.80938 3.9375 7.9 4 8 4C8.1 4 8.19063 3.9375 8.225 3.84375L8.66562 2.66563L9.84375 2.225C9.9375 2.19062 10 2.1 10 2C10 1.9 9.9375 1.80937 9.84375 1.775L8.66562 1.33438L8.225 0.15625C8.19063 0.0625 8.1 0 8 0C7.9 0 7.80938 0.0625 7.775 0.15625L7.33437 1.33438ZM1.44062 12.3562C0.85625 12.9406 0.85625 13.8906 1.44062 14.4781L2.52187 15.5594C3.10625 16.1437 4.05625 16.1437 4.64375 15.5594L16.5594 3.64062C17.1438 3.05625 17.1438 2.10625 16.5594 1.51875L15.4781 0.440625C14.8937 -0.14375 13.9437 -0.14375 13.3562 0.440625L1.44062 12.3562ZM15.1438 2.58125L11.8625 5.8625L11.1344 5.13438L14.4156 1.85312L15.1438 2.58125V2.58125ZM0.234375 3.6625C0.09375 3.71562 0 3.85 0 4C0 4.15 0.09375 4.28438 0.234375 4.3375L2 5L2.6625 6.76562C2.71562 6.90625 2.85 7 3 7C3.15 7 3.28438 6.90625 3.3375 6.76562L4 5L5.76562 4.3375C5.90625 4.28438 6 4.15 6 4C6 3.85 5.90625 3.71562 5.76562 3.6625L4 3L3.3375 1.23438C3.28438 1.09375 3.15 1 3 1C2.85 1 2.71562 1.09375 2.6625 1.23438L2 3L0.234375 3.6625ZM11.2344 11.6625C11.0938 11.7156 11 11.85 11 12C11 12.15 11.0938 12.2844 11.2344 12.3375L13 13L13.6625 14.7656C13.7156 14.9062 13.85 15 14 15C14.15 15 14.2844 14.9062 14.3375 14.7656L15 13L16.7656 12.3375C16.9062 12.2844 17 12.15 17 12C17 11.85 16.9062 11.7156 16.7656 11.6625L15 11L14.3375 9.23438C14.2844 9.09375 14.15 9 14 9C13.85 9 13.7156 9.09375 13.6625 9.23438L13 11L11.2344 11.6625Z" />',
    '</svg>',
  ].join(''),
  underline: [
    '<svg xmlns="http://www.w3.org/2000/svg" width="0.875em" height="1em" viewBox="0 0 14 16" fill="currentColor">',
    '<path d="M1 2H2V7C2 9.75688 4.24312 12 7 12C9.75688 12 12 9.75688 12 7V2H13C13.1326 2 13.2598 1.94732 13.3536 1.85355C13.4473 1.75979 13.5 1.63261 13.5 1.5V0.5C13.5 0.367392 13.4473 0.240215 13.3536 0.146447C13.2598 0.0526784 13.1326 0 13 0H8.5C8.36739 0 8.24021 0.0526784 8.14645 0.146447C8.05268 0.240215 8 0.367392 8 0.5V1.5C8 1.63261 8.05268 1.75979 8.14645 1.85355C8.24021 1.94732 8.36739 2 8.5 2H9.5V7C9.5 7.66304 9.23661 8.29893 8.76777 8.76777C8.29893 9.23661 7.66304 9.5 7 9.5C6.33696 9.5 5.70107 9.23661 5.23223 8.76777C4.76339 8.29893 4.5 7.66304 4.5 7V2H5.5C5.63261 2 5.75979 1.94732 5.85355 1.85355C5.94732 1.75979 6 1.63261 6 1.5V0.5C6 0.367392 5.94732 0.240215 5.85355 0.146447C5.75979 0.0526784 5.63261 0 5.5 0H1C0.867392 0 0.740215 0.0526784 0.646447 0.146447C0.552678 0.240215 0.5 0.367392 0.5 0.5V1.5C0.5 1.63261 0.552678 1.75979 0.646447 1.85355C0.740215 1.94732 0.867392 2 1 2ZM13.5 14H0.5C0.367392 14 0.240215 14.0527 0.146447 14.1464C0.0526784 14.2402 0 14.3674 0 14.5V15.5C0 15.6326 0.0526784 15.7598 0.146447 15.8536C0.240215 15.9473 0.367392 16 0.5 16H13.5C13.6326 16 13.7598 15.9473 13.8536 15.8536C13.9473 15.7598 14 15.6326 14 15.5V14.5C14 14.3674 13.9473 14.2402 13.8536 14.1464C13.7598 14.0527 13.6326 14 13.5 14Z" />',
    '</svg>',
  ].join(''),
  eraser: [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor">',
    '<path d="M15.5607 8.56066C16.1465 7.97488 16.1465 7.02513 15.5607 6.43935L10.5607 1.43935C9.9749 0.853566 9.02518 0.853535 8.43934 1.43935L0.439336 9.43935C-0.146445 10.0251 -0.146445 10.9749 0.439336 11.5607L3.43934 14.5607C3.72065 14.842 4.10219 15 4.50002 15H15.625C15.8321 15 16 14.8321 16 14.625V13.375C16 13.1679 15.8321 13 15.625 13H11.1214L15.5607 8.56066ZM6.10359 6.60357L10.3965 10.8965L8.29293 13H4.70715L2.20715 10.5L6.10359 6.60357Z" />',
    '</svg>',
  ].join(''),
  unorderedlist: [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor">',
    '<path d="M2 4.5C2.82812 4.5 3.5 3.82812 3.5 3C3.5 2.17188 2.82812 1.5 2 1.5C1.17188 1.5 0.5 2.17188 0.5 3C0.5 3.82812 1.17188 4.5 2 4.5ZM6 2C5.44687 2 5 2.44687 5 3C5 3.55313 5.44687 4 6 4H15C15.5531 4 16 3.55313 16 3C16 2.44687 15.5531 2 15 2H6ZM6 7C5.44687 7 5 7.44687 5 8C5 8.55313 5.44687 9 6 9H15C15.5531 9 16 8.55313 16 8C16 7.44687 15.5531 7 15 7H6ZM6 12C5.44687 12 5 12.4469 5 13C5 13.5531 5.44687 14 6 14H15C15.5531 14 16 13.5531 16 13C16 12.4469 15.5531 12 15 12H6ZM2 14.5C2.82812 14.5 3.5 13.8281 3.5 13C3.5 12.1719 2.82812 11.5 2 11.5C1.17188 11.5 0.5 12.1719 0.5 13C0.5 13.8281 1.17188 14.5 2 14.5ZM3.5 8C3.5 7.17188 2.82812 6.5 2 6.5C1.17188 6.5 0.5 7.17188 0.5 8C0.5 8.82812 1.17188 9.5 2 9.5C2.82812 9.5 3.5 8.82812 3.5 8Z" />',
    '</svg>',
  ].join(''),
  orderedlist: [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor">',
    '<path d="M0.749913 1.75C0.749913 1.33437 1.08429 1 1.49991 1H2.49991C2.91554 1 3.24991 1.33437 3.24991 1.75V5.5H3.74991C4.16554 5.5 4.49991 5.83437 4.49991 6.25C4.49991 6.66563 4.16554 7 3.74991 7H1.24991C0.834288 7 0.499913 6.66563 0.499913 6.25C0.499913 5.83437 0.834288 5.5 1.24991 5.5H1.74991V2.5H1.49991C1.08429 2.5 0.749913 2.16563 0.749913 1.75ZM2.70929 10.6625C2.50616 10.4313 2.13741 10.4469 1.95929 10.7L1.60929 11.1844C1.36866 11.5219 0.899913 11.6 0.562413 11.3594C0.224913 11.1188 0.146788 10.65 0.387413 10.3125L0.734288 9.825C1.47491 8.7875 2.99366 8.7125 3.83429 9.67188C4.49991 10.4344 4.48429 11.575 3.79991 12.3188L2.71241 13.5H3.74991C4.16554 13.5 4.49991 13.8344 4.49991 14.25C4.49991 14.6656 4.16554 15 3.74991 15H0.999913C0.703038 15 0.431163 14.825 0.312413 14.55C0.193663 14.275 0.246788 13.9594 0.446788 13.7406L2.69679 11.3031C2.86241 11.1219 2.86554 10.8469 2.70616 10.6625H2.70929ZM6.99991 2H14.9999C15.553 2 15.9999 2.44687 15.9999 3C15.9999 3.55313 15.553 4 14.9999 4H6.99991C6.44679 4 5.99991 3.55313 5.99991 3C5.99991 2.44687 6.44679 2 6.99991 2ZM6.99991 7H14.9999C15.553 7 15.9999 7.44687 15.9999 8C15.9999 8.55313 15.553 9 14.9999 9H6.99991C6.44679 9 5.99991 8.55313 5.99991 8C5.99991 7.44687 6.44679 7 6.99991 7ZM6.99991 12H14.9999C15.553 12 15.9999 12.4469 15.9999 13C15.9999 13.5531 15.553 14 14.9999 14H6.99991C6.44679 14 5.99991 13.5531 5.99991 13C5.99991 12.4469 6.44679 12 6.99991 12Z" />',
    '</svg>',
  ].join(''),
  alignLeft: [
    '<svg xmlns="http://www.w3.org/2000/svg" width="0.875em" height="1em" viewBox="0 0 14 16" fill="currentColor">',
    '<path d="M9 2C9 2.55313 8.55313 3 8 3H1C0.446875 3 0 2.55313 0 2C0 1.44687 0.446875 1 1 1H8C8.55313 1 9 1.44687 9 2ZM9 10C9 10.5531 8.55313 11 8 11H1C0.446875 11 0 10.5531 0 10C0 9.44687 0.446875 9 1 9H8C8.55313 9 9 9.44687 9 10ZM0 6C0 5.44687 0.446875 5 1 5H13C13.5531 5 14 5.44687 14 6C14 6.55313 13.5531 7 13 7H1C0.446875 7 0 6.55313 0 6ZM14 14C14 14.5531 13.5531 15 13 15H1C0.446875 15 0 14.5531 0 14C0 13.4469 0.446875 13 1 13H13C13.5531 13 14 13.4469 14 14Z" />',
    '</svg>',
  ].join(''),
  alignCenter: [
    '<svg xmlns="http://www.w3.org/2000/svg" width="0.875em" height="1em" viewBox="0 0 14 16" fill="currentColor">',
    '<path d="M11 2C11 1.44687 10.5531 1 10 1H4C3.44687 1 3 1.44687 3 2C3 2.55313 3.44687 3 4 3H10C10.5531 3 11 2.55313 11 2ZM14 6C14 5.44687 13.5531 5 13 5H1C0.446875 5 0 5.44687 0 6C0 6.55313 0.446875 7 1 7H13C13.5531 7 14 6.55313 14 6ZM0 14C0 14.5531 0.446875 15 1 15H13C13.5531 15 14 14.5531 14 14C14 13.4469 13.5531 13 13 13H1C0.446875 13 0 13.4469 0 14ZM11 10C11 9.44687 10.5531 9 10 9H4C3.44687 9 3 9.44687 3 10C3 10.5531 3.44687 11 4 11H10C10.5531 11 11 10.5531 11 10Z" />',
    '</svg>',
  ].join(''),
  alignRight: [
    '<svg xmlns="http://www.w3.org/2000/svg" width="0.875em" height="1em" viewBox="0 0 14 16" fill="currentColor">',
    '<path d="M14 2C14 2.55313 13.5531 3 13 3H6C5.44687 3 5 2.55313 5 2C5 1.44687 5.44687 1 6 1H13C13.5531 1 14 1.44687 14 2ZM14 10C14 10.5531 13.5531 11 13 11H6C5.44687 11 5 10.5531 5 10C5 9.44687 5.44687 9 6 9H13C13.5531 9 14 9.44687 14 10ZM0 6C0 5.44687 0.446875 5 1 5H13C13.5531 5 14 5.44687 14 6C14 6.55313 13.5531 7 13 7H1C0.446875 7 0 6.55313 0 6ZM14 14C14 14.5531 13.5531 15 13 15H1C0.446875 15 0 14.5531 0 14C0 13.4469 0.446875 13 1 13H13C13.5531 13 14 13.4469 14 14Z" />',
    '</svg>',
  ].join(''),
  alignJustify: [
    '<svg xmlns="http://www.w3.org/2000/svg" width="0.875em" height="1em" viewBox="0 0 14 16" fill="currentColor">',
    '<path d="M14 2C14 1.44687 13.5531 1 13 1H1C0.446875 1 0 1.44687 0 2C0 2.55313 0.446875 3 1 3H13C13.5531 3 14 2.55313 14 2ZM14 10C14 9.44687 13.5531 9 13 9H1C0.446875 9 0 9.44687 0 10C0 10.5531 0.446875 11 1 11H13C13.5531 11 14 10.5531 14 10ZM0 6C0 6.55313 0.446875 7 1 7H13C13.5531 7 14 6.55313 14 6C14 5.44687 13.5531 5 13 5H1C0.446875 5 0 5.44687 0 6ZM14 14C14 13.4469 13.5531 13 13 13H1C0.446875 13 0 13.4469 0 14C0 14.5531 0.446875 15 1 15H13C13.5531 15 14 14.5531 14 14Z" />',
    '</svg>',
  ].join(''),
  outdent: [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor">',
    '<path d="M0.999902 2C0.999902 1.44687 1.44678 1 1.9999 1H13.9999C14.553 1 14.9999 1.44687 14.9999 2C14.9999 2.55313 14.553 3 13.9999 3H1.9999C1.44678 3 0.999902 2.55313 0.999902 2ZM6.9999 6C6.9999 5.44687 7.44678 5 7.9999 5H13.9999C14.553 5 14.9999 5.44687 14.9999 6C14.9999 6.55313 14.553 7 13.9999 7H7.9999C7.44678 7 6.9999 6.55313 6.9999 6ZM7.9999 9H13.9999C14.553 9 14.9999 9.44687 14.9999 10C14.9999 10.5531 14.553 11 13.9999 11H7.9999C7.44678 11 6.9999 10.5531 6.9999 10C6.9999 9.44687 7.44678 9 7.9999 9ZM0.999902 14C0.999902 13.4469 1.44678 13 1.9999 13H13.9999C14.553 13 14.9999 13.4469 14.9999 14C14.9999 14.5531 14.553 15 13.9999 15H1.9999C1.44678 15 0.999902 14.5531 0.999902 14ZM1.00615 8.39375C0.749902 8.19375 0.749902 7.80313 1.00615 7.60313L4.19053 5.125C4.51865 4.86875 4.99678 5.10313 4.99678 5.51875V10.4781C4.99678 10.8937 4.51865 11.1281 4.19053 10.8719L1.00615 8.39375Z" />',
    '</svg>',
  ].join(''),
  indent: [
    '<svg xmlns="http://www.w3.org/2000/svg" width="0.875em" height="1em" viewBox="0 0 14 16" fill="currentColor">',
    '<path d="M0 2C0 1.44687 0.446875 1 1 1H13C13.5531 1 14 1.44687 14 2C14 2.55313 13.5531 3 13 3H1C0.446875 3 0 2.55313 0 2ZM6 6C6 5.44687 6.44687 5 7 5H13C13.5531 5 14 5.44687 14 6C14 6.55313 13.5531 7 13 7H7C6.44687 7 6 6.55313 6 6ZM7 9H13C13.5531 9 14 9.44687 14 10C14 10.5531 13.5531 11 13 11H7C6.44687 11 6 10.5531 6 10C6 9.44687 6.44687 9 7 9ZM0 14C0 13.4469 0.446875 13 1 13H13C13.5531 13 14 13.4469 14 14C14 14.5531 13.5531 15 13 15H1C0.446875 15 0 14.5531 0 14ZM3.99375 8.39375L0.80625 10.8719C0.478125 11.1281 0 10.8937 0 10.4781V5.52187C0 5.10625 0.478125 4.87188 0.80625 5.12813L3.99062 7.60625C4.24687 7.80625 4.24687 8.19688 3.99062 8.39688L3.99375 8.39375Z" />',
    '</svg>',
  ].join(''),
  table: [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor">',
    '<path d="M2 8V5H7V8H2ZM2 10H7V13H2V10ZM9 13V10H14V13H9ZM14 8H9V5H14V8ZM2 1C0.896875 1 0 1.89688 0 3V13C0 14.1031 0.896875 15 2 15H14C15.1031 15 16 14.1031 16 13V3C16 1.89688 15.1031 1 14 1H2Z" />',
    '</svg>',
  ].join(''),
  link: [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1.25em" height="1em" viewBox="0 0 20 16" fill="currentColor">',
    '<path d="M18.1188 8.36559C19.8845 6.59997 19.8845 3.74059 18.1188 1.97497C16.5563 0.412466 14.0938 0.209341 12.297 1.49372L12.247 1.52809C11.797 1.84997 11.6938 2.47497 12.0157 2.92184C12.3376 3.36872 12.9626 3.47497 13.4095 3.15309L13.4595 3.11872C14.4626 2.40309 15.8345 2.51559 16.7032 3.38747C17.6876 4.37184 17.6876 5.96559 16.7032 6.94997L13.197 10.4625C12.2126 11.4468 10.6188 11.4468 9.63447 10.4625C8.7626 9.59059 8.6501 8.21872 9.36572 7.21872L9.4001 7.16872C9.72197 6.71872 9.61572 6.09372 9.16885 5.77497C8.72197 5.45622 8.09385 5.55934 7.7751 6.00622L7.74072 6.05622C6.45322 7.84997 6.65635 10.3125 8.21885 11.875C9.98447 13.6406 12.8438 13.6406 14.6095 11.875L18.1188 8.36559ZM1.88135 7.63434C0.115723 9.39997 0.115723 12.2593 1.88135 14.025C3.44385 15.5875 5.90635 15.7906 7.70322 14.5062L7.75322 14.4718C8.20322 14.15 8.30635 13.525 7.98447 13.0781C7.6626 12.6312 7.0376 12.525 6.59072 12.8468L6.54072 12.8812C5.5376 13.5968 4.16572 13.4843 3.29697 12.6125C2.3126 11.625 2.3126 10.0312 3.29697 9.04684L6.80322 5.53747C7.7876 4.55309 9.38135 4.55309 10.3657 5.53747C11.2376 6.40934 11.3501 7.78122 10.6345 8.78434L10.6001 8.83434C10.2782 9.28434 10.3845 9.90934 10.8313 10.2281C11.2782 10.5468 11.9063 10.4437 12.2251 9.99684L12.2595 9.94684C13.547 8.14997 13.3438 5.68747 11.7813 4.12497C10.0157 2.35934 7.15635 2.35934 5.39072 4.12497L1.88135 7.63434Z" />',
    '</svg>',
  ].join(''),
  picture: [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor">',
    '<path d="M0 3C0 1.89688 0.896875 1 2 1H14C15.1031 1 16 1.89688 16 3V13C16 14.1031 15.1031 15 14 15H2C0.896875 15 0 14.1031 0 13V3ZM10.1187 6.32812C9.97812 6.12188 9.74688 6 9.5 6C9.25312 6 9.01875 6.12188 8.88125 6.32812L6.1625 10.3156L5.33437 9.28125C5.19062 9.10313 4.975 9 4.75 9C4.525 9 4.30625 9.10313 4.16563 9.28125L2.16563 11.7812C1.98438 12.0062 1.95 12.3156 2.075 12.575C2.2 12.8344 2.4625 13 2.75 13H5.75H6.75H13.25C13.5281 13 13.7844 12.8469 13.9125 12.6C14.0406 12.3531 14.025 12.0563 13.8687 11.8281L10.1187 6.32812ZM3.5 6C4.32812 6 5 5.32812 5 4.5C5 3.67188 4.32812 3 3.5 3C2.67188 3 2 3.67188 2 4.5C2 5.32812 2.67188 6 3.5 6Z" />',
    '</svg>',
  ].join(''),
  video: [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor">',
    '<path d="M0 3C0 1.89688 0.896875 1 2 1H14C15.1031 1 16 1.89688 16 3V13C16 14.1031 15.1031 15 14 15H2C0.896875 15 0 14.1031 0 13V3ZM1.5 11.5V12.5C1.5 12.775 1.725 13 2 13H3C3.275 13 3.5 12.775 3.5 12.5V11.5C3.5 11.225 3.275 11 3 11H2C1.725 11 1.5 11.225 1.5 11.5ZM13 11C12.725 11 12.5 11.225 12.5 11.5V12.5C12.5 12.775 12.725 13 13 13H14C14.275 13 14.5 12.775 14.5 12.5V11.5C14.5 11.225 14.275 11 14 11H13ZM1.5 7.5V8.5C1.5 8.775 1.725 9 2 9H3C3.275 9 3.5 8.775 3.5 8.5V7.5C3.5 7.225 3.275 7 3 7H2C1.725 7 1.5 7.225 1.5 7.5ZM13 7C12.725 7 12.5 7.225 12.5 7.5V8.5C12.5 8.775 12.725 9 13 9H14C14.275 9 14.5 8.775 14.5 8.5V7.5C14.5 7.225 14.275 7 14 7H13ZM1.5 3.5V4.5C1.5 4.775 1.725 5 2 5H3C3.275 5 3.5 4.775 3.5 4.5V3.5C3.5 3.225 3.275 3 3 3H2C1.725 3 1.5 3.225 1.5 3.5ZM13 3C12.725 3 12.5 3.225 12.5 3.5V4.5C12.5 4.775 12.725 5 13 5H14C14.275 5 14.5 4.775 14.5 4.5V3.5C14.5 3.225 14.275 3 14 3H13ZM5 4V6C5 6.55313 5.44687 7 6 7H10C10.5531 7 11 6.55313 11 6V4C11 3.44687 10.5531 3 10 3H6C5.44687 3 5 3.44687 5 4ZM6 9C5.44687 9 5 9.44687 5 10V12C5 12.5531 5.44687 13 6 13H10C10.5531 13 11 12.5531 11 12V10C11 9.44687 10.5531 9 10 9H6Z" />',
    '</svg>',
  ].join(''),
  arrowsAlt: [
    '<svg xmlns="http://www.w3.org/2000/svg" width="0.875em" height="1em" viewBox="0 0 14 16" fill="currentColor">',
    '<path d="M1 1C0.446875 1 0 1.44687 0 2V5C0 5.55313 0.446875 6 1 6C1.55313 6 2 5.55313 2 5V3H4C4.55313 3 5 2.55313 5 2C5 1.44687 4.55313 1 4 1H1ZM2 11C2 10.4469 1.55313 10 1 10C0.446875 10 0 10.4469 0 11V14C0 14.5531 0.446875 15 1 15H4C4.55313 15 5 14.5531 5 14C5 13.4469 4.55313 13 4 13H2V11ZM10 1C9.44687 1 9 1.44687 9 2C9 2.55313 9.44687 3 10 3H12V5C12 5.55313 12.4469 6 13 6C13.5531 6 14 5.55313 14 5V2C14 1.44687 13.5531 1 13 1H10ZM14 11C14 10.4469 13.5531 10 13 10C12.4469 10 12 10.4469 12 11V13H10C9.44687 13 9 13.4469 9 14C9 14.5531 9.44687 15 10 15H13C13.5531 15 14 14.5531 14 14V11Z" />',
    '</svg>',
  ].join(''),
  code: [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1.25em" height="1em" viewBox="0 0 20 16" fill="currentColor">',
    '<path d="M12.3,0c-0.5-0.2-1.1,0.2-1.2,0.7l-4,14c-0.2,0.5,0.2,1.1,0.7,1.2c0.5,0.2,1.1-0.2,1.2-0.7l4-14C13.1,0.7,12.8,0.2,12.3,0zM14.8,3.8c-0.4,0.4-0.4,1,0,1.4L17.6,8l-2.8,2.8c-0.4,0.4-0.4,1,0,1.4c0.4,0.4,1,0.4,1.4,0l3.5-3.5c0.4-0.4,0.4-1,0-1.4l-3.5-3.5C15.8,3.4,15.2,3.4,14.8,3.8L14.8,3.8z M5.2,3.8c-0.4-0.4-1-0.4-1.4,0L0.3,7.3c-0.4,0.4-0.4,1,0,1.4l3.5,3.5c0.4,0.4,1,0.4,1.4,0c0.4-0.4,0.4-1,0-1.4L2.4,8l2.8-2.8C5.6,4.8,5.6,4.2,5.2,3.8z" />',
    '</svg>',
  ].join(''),
  question: [
    '<svg xmlns="http://www.w3.org/2000/svg" width="0.625em" height="1em" viewBox="0 0 10 16" fill="currentColor">',
    '<path d="M3 3C2.44687 3 2 3.44687 2 4C2 4.55313 1.55313 5 1 5C0.446875 5 0 4.55313 0 4C0 2.34375 1.34375 1 3 1H6.03125C8.22187 1 10 2.77813 10 4.96875C10 6.60625 8.99375 8.075 7.46875 8.66875L5.5 9.43437V10C5.5 10.5531 5.05313 11 4.5 11C3.94687 11 3.5 10.5531 3.5 10V9.43437C3.5 8.60937 4.00625 7.86875 4.775 7.57188L6.74375 6.80625C7.5 6.50938 8 5.78125 8 4.96875C8 3.88125 7.11875 3 6.03125 3H3ZM4.5 15C3.80937 15 3.25 14.4406 3.25 13.75C3.25 13.0594 3.80937 12.5 4.5 12.5C5.19063 12.5 5.75 13.0594 5.75 13.75C5.75 14.4406 5.19063 15 4.5 15Z" />',
    '</svg>',
  ].join(''),
  font: [
    '<svg xmlns="http://www.w3.org/2000/svg" width="0.75em" height="1em" viewBox="0 0 12 16" fill="currentColor">',
    '<path d="M6 15.5C9.0375 15.5 11.5 13.0375 11.5 9.99995C11.5 7.68433 8.30313 2.7937 6.78438 0.603076C6.4 0.0499512 5.60313 0.0499512 5.21875 0.603076C3.69687 2.7937 0.5 7.68433 0.5 9.99995C0.5 13.0375 2.9625 15.5 6 15.5ZM3.5 9.99995C3.5 11.3812 4.61875 12.5 6 12.5C6.275 12.5 6.5 12.725 6.5 13C6.5 13.275 6.275 13.5 6 13.5C4.06562 13.5 2.5 11.9343 2.5 9.99995C2.5 9.72495 2.725 9.49995 3 9.49995C3.275 9.49995 3.5 9.72495 3.5 9.99995Z" />',
    '</svg>',
  ].join(''),
});
