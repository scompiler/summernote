import $ from 'jquery';
import '/js/settings.js';
import './summernote-bs3.scss';
import renderer from '/js/renderer';
import Summernote from "../../js/class";

const editor = renderer.create('<div class="note-editor note-frame panel panel-default"></div>');
const toolbar = renderer.create('<div class="panel-heading note-toolbar" role="toolbar"></div>');
const editingArea = renderer.create('<div class="note-editing-area"></div>');
const codable = renderer.create('<textarea class="note-codable" aria-multiline="true"></textarea>');
const editable = renderer.create('<div class="note-editable" contentEditable="true" role="textbox" aria-multiline="true"></div>');
const statusbar = renderer.create([
  '<output class="note-status-output" role="status" aria-live="polite"></output>',
  '<div class="note-statusbar" role="status">',
    '<div class="note-resizebar" aria-label="Resize">',
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

const buttonGroup = renderer.create('<div class="note-btn-group btn-group"></div>');

const dropdown = renderer.create('<ul class="note-dropdown-menu dropdown-menu"></ul>', function(nodeEls, options) {
  const markup = Array.isArray(options.items) ? options.items.map(function(item) {
    const value = (typeof item === 'string') ? item : (item.value || '');
    const content = options.template ? options.template(item) : item;
    const option = (typeof item === 'object') ? item.option : undefined;

    const dataValue = 'data-value="' + value + '"';
    const dataOption = (option !== undefined) ? ' data-option="' + option + '"' : '';
    return '<li aria-label="' + value + '"><a href="#" ' + (dataValue + dataOption) + '>' + content + '</a></li>';
  }).join('') : options.items;

  nodeEls.forEach((nodeEl) => {
    nodeEl.innerHTML = markup;
    nodeEl.setAttribute('aria-label', options.title);

    if (options && options.codeviewKeepButton) {
      nodeEl.classList.add('note-codeview-keep');
    }
  });
});

const dropdownButtonContents = function(contents, options) {
  return contents + ' ' + icon(options.icons.caret, 'span');
};

const dropdownCheck = renderer.create('<ul class="note-dropdown-menu dropdown-menu note-check"></ul>', function(nodeEls, options) {
  const markup = Array.isArray(options.items) ? options.items.map(function(item) {
    const value = (typeof item === 'string') ? item : (item.value || '');
    const content = options.template ? options.template(item) : item;
    return '<li aria-label="' + item + '"><a href="#" data-value="' + value + '">' + icon(options.checkClassName) + ' ' + content + '</a></li>';
  }).join('') : options.items;

  nodeEls.forEach((nodeEl) => {
    nodeEl.innerHTML = markup;
    nodeEl.setAttribute('aria-label', options.title);

    if (options && options.codeviewKeepButton) {
      nodeEl.classList.add('note-codeview-keep');
    }
  });
});

const dialog = renderer.create('<div class="modal note-modal" aria-hidden="false" tabindex="-1" role="dialog"></div>', function(nodeEls, options) {
  nodeEls.forEach((nodeEl) => {
    if (options.fade) {
      nodeEl.classList.add('fade');
    }

    nodeEl.setAttribute('aria-label', options.title);
    nodeEl.innerHTML = [
      '<div class="modal-dialog">',
      '<div class="modal-content">',
      (options.title ? '<div class="modal-header">' +
        '<button type="button" class="close" data-dismiss="modal" aria-label="Close" aria-hidden="true">&times;</button>' +
        '<h4 class="modal-title">' + options.title + '</h4>' +
        '</div>' : ''),
      '<div class="modal-body">' + options.body + '</div>',
      (options.footer ? '<div class="modal-footer">' + options.footer + '</div>' : ''),
      '</div>',
      '</div>',
    ].join('');
  });
});

const popover = renderer.create([
  '<div class="note-popover popover in">',
    '<div class="arrow"></div>',
    '<div class="popover-content note-children-container"></div>',
  '</div>',
].join(''), function(nodeEls, options) {
  const direction = typeof options.direction !== 'undefined' ? options.direction : 'bottom';

  nodeEls.forEach((nodeEl) => {
    nodeEl.classList.add(direction);

    if (options.hideArrow) {
      const arrowEl = nodeEl.querySelector('.arrow');

      if (arrowEl) {
        arrowEl.style.display = 'none';
      }
    }
  });
});

const checkbox = renderer.create('<div class="checkbox"></div>', function(nodeEls, options) {
  nodeEls.forEach((nodeEl) => {
    nodeEl.innerHTML = [
      '<label' + (options.id ? ' for="note-' + options.id + '"' : '') + '>',
      '<input type="checkbox"' + (options.id ? ' id="note-' + options.id + '"' : ''),
      (options.checked ? ' checked' : ''),
      ' aria-checked="' + (options.checked ? 'true' : 'false') + '"/>',
      (options.text ? options.text : ''),
      '</label>',
    ].join('');
  });
});

const icon = function(iconClassName, tagName) {
  if (iconClassName.match(/^</)) {
    return iconClassName;
  }
  tagName = tagName || 'i';
  return '<' + tagName + ' class="' + iconClassName + '"></' + tagName+'>';
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
    dropdown: dropdown,
    dropdownButtonContents: dropdownButtonContents,
    dropdownCheck: dropdownCheck,
    dialog: dialog,
    popover: popover,
    checkbox: checkbox,
    icon: icon,
    options: editorOptions,

    palette: function( options) {
      return renderer.create('<div class="note-color-palette"></div>', function(nodeEls, options) {
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
              '<button type="button" class="note-color-btn"',
              'style="background-color:', color, '" ',
              'data-event="', eventName, '" ',
              'data-value="', color, '" ',
              'title="', colorName, '" ',
              'aria-label="', colorName, '" ',
              'data-toggle="button" tabindex="-1"></button>',
            ].join(''));
          }
          contents.push('<div class="note-color-row">' + buttons.join('') + '</div>');
        }

        nodeEls.forEach((nodeEl) => {
          nodeEl.innerHTML = contents.join('');

          if (options.tooltip) {
            const colorBtnEl = nodeEl.querySelector('.note-color-btn');

            if (colorBtnEl) {
              $(colorBtnEl).tooltip({
                container: options.container || editorOptions.container,
                trigger: 'hover',
                placement: 'bottom',
              });
            }
          }
        });
      })(options);
    },

    button: function(options) {
      return renderer.create('<button type="button" class="note-btn btn btn-default btn-sm" tabindex="-1"></button>', function(nodeEls, options) {
        nodeEls.forEach((nodeEl) => {
          if (options && options.tooltip) {
            nodeEl.setAttribute('title', options.tooltip);
            nodeEl.setAttribute('aria-label', options.tooltip);

            $(nodeEl).tooltip({
              container: options.container || editorOptions.container,
              trigger: 'hover',
              placement: 'bottom',
            });

            nodeEl.addEventListener('click', (domEvent) => {
              $(domEvent.currentTarget).tooltip('hide');
            });
          }

          if (options && options.codeviewButton) {
            nodeEl.classList.add('note-codeview-keep');
          }
        });
      })(options);
    },

    toggleBtn: function(btnEl, isEnable) {
      const $btn = $(btnEl);
      $btn.toggleClass('disabled', !isEnable);
      $btn.attr('disabled', !isEnable);
    },

    toggleBtnActive: function(btnEl, isActive) {
      const $btn = $(btnEl);
      $btn.toggleClass('active', isActive);
    },

    onDialogShown: function(dialogEl, handler) {
      const $dialog = $(dialogEl);
      $dialog.one('shown.bs.modal', handler);
    },

    onDialogHidden: function(dialogEl, handler) {
      const $dialog = $(dialogEl);
      $dialog.one('hidden.bs.modal', handler);
    },

    showDialog: function(dialogEl) {
      const $dialog = $(dialogEl);
      $dialog.modal('show');
    },

    hideDialog: function(dialogEl) {
      const $dialog = $(dialogEl);
      $dialog.modal('hide');
    },

    createLayout: function(noteEl) {
      const $note = $(noteEl);
      const editorEl = (
        editorOptions.airMode
          ? airEditor([
            editingArea([
              codable(),
              airEditable(),
            ]),
          ])
          : (
            editorOptions.toolbarPosition === 'bottom'
              ? editor([
                editingArea([
                  codable(),
                  editable(),
                ]),
                toolbar(),
                statusbar(),
              ])
              : editor([
                toolbar(),
                editingArea([
                  codable(),
                  editable(),
                ]),
                statusbar(),
              ])
          )
      ).render2();
      const $editor = $(editorEl);

      $editor.insertAfter($note);

      return {
        note: $note,
        editor: $editor,
        toolbar: $editor.find('.note-toolbar'),
        editingArea: $editor.find('.note-editing-area'),
        editable: $editor.find('.note-editable'),
        codable: $editor.find('.note-codable'),
        statusbar: $editor.find('.note-statusbar'),
      };
    },

    removeLayout: function(noteEl, layoutInfo) {
      const $note = $(noteEl);
      $note.html(layoutInfo.editable.html());
      layoutInfo.editor.remove();
      $note.show();
    },
  };
};

Summernote.meta = Object.assign(Summernote.meta, {
  ui_template: ui,
  interface: 'bs3',
});
