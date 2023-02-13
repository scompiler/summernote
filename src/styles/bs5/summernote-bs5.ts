import 'src/js/settings';
import renderer from 'src/js/renderer';
import './summernote-bs5.scss';
import 'src/js/summernote';
import Summernote from "src/js/class";
import { Layout, Options } from "../../js/core/types";
import * as bootstrap from 'bootstrap';

const editor = renderer.create('<div class="note-editor note-frame card"/>');
const toolbar = renderer.create('<div class="note-toolbar card-header" role="toolbar"/>');
const editingArea = renderer.create('<div class="note-editing-area"/>');
const codable = renderer.create('<textarea class="note-codable" aria-multiline="true"/>');
const editable = renderer.create('<div class="note-editable card-block" contentEditable="true" role="textbox" aria-multiline="true"/>');
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

const airEditor = renderer.create('<div class="note-editor note-airframe"/>');
const airEditable = renderer.create([
    '<div class="note-editable" contentEditable="true" role="textbox" aria-multiline="true"></div>',
    '<output class="note-status-output" role="status" aria-live="polite"></output>',
].join(''));

const buttonGroup = renderer.create('<div class="note-btn-group btn-group">');

const dropdown = renderer.create('<div class="note-dropdown-menu dropdown-menu" role="list">', function(nodeEls, options) {
    const markup = Array.isArray(options.items) ? options.items.map(function(item) {
        const value = (typeof item === 'string') ? item : (item.value || '');
        const content = options.template ? options.template(item) : item;
        const option = (typeof item === 'object') ? item.option : undefined;

        const dataValue = 'data-value="' + value + '"';
        const dataOption = (option !== undefined) ? ' data-option="' + option + '"' : '';
        return '<a class="dropdown-item" href="#" ' + (dataValue + dataOption) + ' role="listitem" aria-label="' + value + '">' + content + '</a>';
    }).join('') : options.items;

    nodeEls.forEach((nodeEl) => {
        if (!(nodeEl instanceof HTMLElement)) {
            return;
        }

        nodeEl.innerHTML = markup;
        nodeEl.setAttribute('aria-label', options.title);

        if (options && options.codeviewKeepButton) {
            nodeEl.classList.add('note-codeview-keep');
        }
    });
});

const dropdownButtonContents = function(contents: string) {
    return contents;
};

const dropdownCheck = renderer.create('<div class="note-dropdown-menu dropdown-menu note-check" role="list">', function(nodeEls, options) {
    const markup = Array.isArray(options.items) ? options.items.map(function(item) {
        const value = (typeof item === 'string') ? item : (item.value || '');
        const content = options.template ? options.template(item) : item;
        return '<a class="dropdown-item" href="#" data-value="' + value + '" role="listitem" aria-label="' + item + '">' + icon(options.checkClassName) + ' ' + content + '</a>';
    }).join('') : options.items;

    nodeEls.forEach((nodeEl) => {
        if (!(nodeEl instanceof HTMLElement)) {
            return;
        }

        nodeEl.innerHTML = markup;
        nodeEl.setAttribute('aria-label', options.title);

        if (options && options.codeviewKeepButton) {
            nodeEl.classList.add('note-codeview-keep');
        }
    });
});

const dialog = renderer.create('<div class="modal note-modal" aria-hidden="false" tabindex="-1" role="dialog"/>', function(nodeEls, options) {
    const markup = [
        '<div class="modal-dialog">',
            '<div class="modal-content">',
                (options.title ? '<div class="modal-header">' +
                    '<h4 class="modal-title">' + options.title + '</h4>' +
                    '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" aria-hidden="true"></button>' +
                '</div>' : ''),
                '<div class="modal-body">' + options.body + '</div>',
                (options.footer ? '<div class="modal-footer">' + options.footer + '</div>' : ''),
            '</div>',
        '</div>',
    ].join('');

    nodeEls.forEach((nodeEl) => {
        if (!(nodeEl instanceof HTMLElement)) {
            return;
        }

        nodeEl.innerHTML = markup;
        nodeEl.setAttribute('aria-label', options.title);

        if (options.fade) {
            nodeEl.classList.add('fade');
        }
    });
});

const popover = renderer.create([
    '<div class="note-popover popover bs-popover-auto show">',
    '<div class="popover-arrow"></div>',
    '<div class="popover-body note-popover-content popover-content note-children-container"></div>',
    '</div>',
].join(''), function(nodeEls, options) {
    const direction = typeof options.direction !== 'undefined' ? options.direction : 'bottom';

    nodeEls.forEach((nodeEl) => {
        if (!(nodeEl instanceof HTMLElement)) {
            return;
        }

        if (direction) {
            nodeEl.setAttribute('data-popper-placement', direction);
        } else {
            nodeEl.removeAttribute('data-popper-placement');
        }

        if (options.hideArrow) {
            const arrowEl = nodeEl.querySelector('.popover-arrow');

            if (arrowEl instanceof HTMLElement) {
                arrowEl.style.display = 'none';
            }
        }
    });
});

const checkbox = renderer.create('<div class="form-check"></div>', function(nodeEls, options) {
    const markup = [
        '<label class="form-check-label"' + (options.id ? ' for="note-' + options.id + '"' : '') + '>',
            '<input type="checkbox" class="form-check-input"' + (options.id ? ' id="note-' + options.id + '"' : ''),
                (options.checked ? ' checked' : ''),
                ' aria-label="' + (options.text ? options.text : '') + '"',
                ' aria-checked="' + (options.checked ? 'true' : 'false') + '"/>',
            ' ' + (options.text ? options.text : '') +
        '</label>',
    ].join('');

    nodeEls.forEach((nodeEl) => {
        if (!(nodeEl instanceof HTMLElement)) {
            return;
        }

        nodeEl.innerHTML = markup;
    });
});

const icon = function(iconClassName: string, tagName?: string) {
    if (iconClassName.match(/^</)) {
        return iconClassName;
    }
    tagName = tagName || 'i';
    return '<' + tagName + ' class="' + iconClassName + '"></' + tagName+'>';
};

const ui = function(editorOptions: Options) {
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
        icon: icon,
        checkbox: checkbox,
        options: editorOptions,

        palette: function(options: Options) {
            return renderer.create('<div class="note-color-palette"/>', function(nodeEls, options) {
                const contents: string[] = [];
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
                    if (!(nodeEl instanceof HTMLElement)) {
                        return;
                    }

                    nodeEl.innerHTML = contents.join('');

                    if (options.tooltip) {
                        const btnEls = [].slice.call(nodeEl.querySelectorAll('.note-color-btn')) as HTMLElement[];

                        btnEls.forEach((btnEl) => {
                            new bootstrap.Tooltip(btnEl, {
                                container: options.container || editorOptions.container,
                                trigger: 'hover',
                                placement: 'bottom',
                            });
                        });
                    }
                });
            })(options);
        },

        button: function(options: Options) {
            return renderer.create('<button type="button" class="note-btn btn btn-outline-secondary btn-sm" tabindex="-1">', function(nodeEls, options) {
                nodeEls.forEach((nodeEl) => {
                    if (!(nodeEl instanceof HTMLElement)) {
                        return;
                    }

                    if (options && options.data && options.data.toggle === 'dropdown') {
                        nodeEl.removeAttribute('data-toggle');
                        nodeEl.setAttribute('data-bs-toggle', 'dropdown');

                        if (options && options.tooltip) {
                            nodeEl.setAttribute('title', options.tooltip);
                            nodeEl.setAttribute('aria-label', options.tooltip);
                        }
                    } else if (options && options.tooltip) {
                        nodeEl.setAttribute('title', options.tooltip);
                        nodeEl.setAttribute('aria-label', options.tooltip);

                        const tooltip = new bootstrap.Tooltip(nodeEl, {
                            container: options.container || editorOptions.container,
                            trigger: 'hover',
                            placement: 'bottom',
                        });

                        nodeEl.addEventListener('click', () => tooltip.hide());
                    }
                    if (options && options.codeviewButton) {
                        nodeEl.classList.add('note-codeview-keep');
                    }
                });
            })(options);
        },

        toggleBtn: function(btnEl: HTMLElement, isEnable: boolean) {
            btnEl.classList.toggle('disabled', !isEnable);
            btnEl.toggleAttribute('disabled', !isEnable);
        },

        toggleBtnActive: function(btnEl: HTMLElement, isActive: boolean) {
            btnEl.classList.toggle('active', isActive);
        },

        onDialogShown: function(dialogEl: HTMLElement, handler: (...args: any[]) => void) {
            const listener = function(...args: any[]) {
                dialogEl.removeEventListener('shown.bs.modal', listener);
                handler(...args);
            };

            dialogEl.addEventListener('shown.bs.modal', listener);
        },

        onDialogHidden: function(dialogEl: HTMLElement, handler: (...args: any[]) => void) {
            const listener = function(...args: any[]) {
                dialogEl.removeEventListener('hidden.bs.modal', listener);
                handler(...args);
            };

            dialogEl.addEventListener('hidden.bs.modal', listener);
        },

        showDialog: function(dialogEl: HTMLElement) {
            let instance = bootstrap.Modal.getInstance(dialogEl);

            if (!instance) {
                instance = new bootstrap.Modal(dialogEl);
            }

            instance.show();
        },

        hideDialog: function(dialogEl: HTMLElement) {
            const instance = bootstrap.Modal.getInstance(dialogEl);

            if (!instance) {
                return;
            }

            instance.hide();
        },

        createLayout: function(noteEl: Node) {
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
            )).render2() as HTMLElement;

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

        removeLayout: function(noteEl: HTMLElement, layoutInfo: Layout) {
            noteEl.innerHTML = layoutInfo.editableEl.innerHTML;
            layoutInfo.editorEl.remove();
            noteEl.style.display = 'block';
        },
    };
};

Summernote.meta = Object.assign(Summernote.meta, {
    ui_template: ui,
    interface: 'bs5',
});

Summernote.meta.options.styleTags = [
    'p',
    { title: 'Blockquote', tag: 'blockquote', className: 'blockquote', value: 'blockquote' },
    'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
];
