import func from '../core/func';
import lists from '../core/lists';
import env from '../core/env';

export default class Buttons {
  constructor(context) {
    this.ui = func.getJquery().summernote.ui;
    this.context = context;
    this.toolbarEl = func.jqueryToHtmlElement(context.layoutInfo.toolbar);
    this.options = context.options;
    this.lang = this.options.langInfo;
    this.invertedKeyMap = func.invertObject(
      this.options.keyMap[env.isMac ? 'mac' : 'pc']
    );
  }

  representShortcut(editorMethod) {
    let shortcut = this.invertedKeyMap[editorMethod];
    if (!this.options.shortcuts || !shortcut) {
      return '';
    }

    if (env.isMac) {
      shortcut = shortcut.replace('CMD', '⌘').replace('SHIFT', '⇧');
    }

    shortcut = shortcut.replace('BACKSLASH', '\\')
      .replace('SLASH', '/')
      .replace('LEFTBRACKET', '[')
      .replace('RIGHTBRACKET', ']');

    return ' (' + shortcut + ')';
  }

  button(o) {
    if (!this.options.tooltip && o.tooltip) {
      delete o.tooltip;
    }
    o.container = this.options.container;
    return this.ui.button(o);
  }

  initialize() {
    this.addToolbarButtons();
    this.addImagePopoverButtons();
    this.addLinkPopoverButtons();
    this.addTablePopoverButtons();
    this.fontInstalledMap = {};
  }

  destroy() {
    delete this.fontInstalledMap;
  }

  isFontInstalled(name) {
    if (!Object.prototype.hasOwnProperty.call(this.fontInstalledMap, name)) {
      this.fontInstalledMap[name] = env.isFontInstalled(name) ||
        lists.contains(this.options.fontNamesIgnoreCheck, name);
    }
    return this.fontInstalledMap[name];
  }

  isFontDeservedToAdd(name) {
    name = name.toLowerCase();
    return (name !== '' && this.isFontInstalled(name) && env.genericFontFamilies.indexOf(name) === -1);
  }

  colorPalette(className, tooltip, backColor, foreColor) {
    return this.ui.buttonGroup({
      className: 'note-color ' + className,
      children: [
        this.button({
          className: 'tea-editor__button--current-color note-current-color-button',
          contents: this.ui.icon(this.options.icons.font),
          tooltip: tooltip,
          click: (domEvent) => {
            const buttonEl = domEvent.currentTarget;
            if (backColor && foreColor) {
              this.context.invoke('editor.color', {
                backColor: buttonEl.getAttribute('data-backColor'),
                foreColor: buttonEl.getAttribute('data-foreColor'),
              });
            } else if (backColor) {
              this.context.invoke('editor.color', {
                backColor: buttonEl.getAttribute('data-backColor'),
              });
            } else if (foreColor) {
              this.context.invoke('editor.color', {
                foreColor: buttonEl.getAttribute('data-foreColor'),
              });
            }
          },
          /**
           * @param {HTMLElement[]} buttonEls
           */
          callback2: (buttonEls) => {
            buttonEls.forEach((buttonEl) => {
              /** @type {HTMLElement} */
              const recentColorEl = buttonEl.querySelector('.note-recent-color');

              if (backColor) {
                if (recentColorEl) {
                  recentColorEl.style.backgroundColor = this.options.colorButton.backColor;
                }
                buttonEl.setAttribute('data-backColor', this.options.colorButton.backColor);
                buttonEl.style.setProperty('--background-color', this.options.colorButton.backColor);
              }
              if (foreColor) {
                if (recentColorEl) {
                  recentColorEl.style.color = this.options.colorButton.foreColor;
                }
                buttonEl.setAttribute('data-foreColor', this.options.colorButton.foreColor);
              } else {
                if (recentColorEl) {
                  recentColorEl.style.color = 'transparent';
                }
              }
            });
          },
        }),
        this.button({
          className: 'dropdown-toggle',
          contents: this.ui.dropdownButtonContents('', this.options),
          tooltip: this.lang.color.more,
          data: {
            toggle: 'dropdown',
          },
        }),
        this.ui.dropdown({
          items: (backColor ? [
            '<div class="note-palette">',
              '<div class="note-palette-title">' + this.lang.color.background + '</div>',
              '<div>',
                '<button type="button" class="note-color-reset btn btn-light btn-default" data-event="backColor" data-value="transparent">',
                  this.lang.color.transparent,
                '</button>',
              '</div>',
              '<div class="note-holder" data-event="backColor"><!-- back colors --></div>',
              '<div>',
                '<button type="button" class="note-color-select btn btn-light btn-default" data-event="openPalette" data-value="backColorPicker-'+this.options.id+'">',
                  this.lang.color.cpSelect,
                '</button>',
                '<input type="color" id="backColorPicker-'+this.options.id+'" class="note-btn note-color-select-btn" value="' + this.options.colorButton.backColor + '" data-event="backColorPalette-'+this.options.id+'">',
              '</div>',
              '<div class="note-holder-custom" id="backColorPalette-'+this.options.id+'" data-event="backColor"></div>',
            '</div>',
          ].join('') : '') +
          (foreColor ? [
            '<div class="note-palette">',
              '<div class="note-palette-title">' + this.lang.color.foreground + '</div>',
              '<div>',
                '<button type="button" class="note-color-reset btn btn-light btn-default" data-event="removeFormat" data-value="foreColor">',
                  this.lang.color.resetToDefault,
                '</button>',
              '</div>',
              '<div class="note-holder" data-event="foreColor"><!-- fore colors --></div>',
              '<div>',
                '<button type="button" class="note-color-select btn btn-light btn-default" data-event="openPalette" data-value="foreColorPicker-'+this.options.id+'">',
                  this.lang.color.cpSelect,
                '</button>',
                '<input type="color" id="foreColorPicker-'+this.options.id+'" class="note-btn note-color-select-btn" value="' + this.options.colorButton.foreColor + '" data-event="foreColorPalette-'+this.options.id+'">',
              '</div>', // Fix missing Div, Commented to find easily if it's wrong
              '<div class="note-holder-custom" id="foreColorPalette-'+this.options.id+'" data-event="foreColor"></div>',
            '</div>',
          ].join('') : ''),
          callback2: (dropdownEls) => {
            dropdownEls.forEach((dropdownEl) => {
              [].slice.call(dropdownEl.querySelectorAll('.note-holder')).forEach((item) => {
                item.appendChild(this.ui.palette({
                  colors: this.options.colors,
                  colorsName: this.options.colorsName,
                  eventName: item.getAttribute('data-event'),
                  container: this.options.container,
                  tooltip: this.options.tooltip,
                }).render2());
              });
              /* TODO: do we have to record recent custom colors within cookies? */
              const customColors = [
                ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF'],
              ];
              [].slice.call(dropdownEl.querySelectorAll('.note-holder-custom')).forEach((item) => {
                item.appendChild(this.ui.palette({
                  colors: customColors,
                  colorsName: customColors,
                  eventName: item.getAttribute('data-event'),
                  container: this.options.container,
                  tooltip: this.options.tooltip,
                }).render2());
              });
              [].slice.call(dropdownEl.querySelectorAll('input[type=color]')).forEach((item) => {
                item.addEventListener('change', function() {
                  const chipEl = dropdownEl
                    .querySelector('#' + this.getAttribute('data-event'))
                    .querySelector('.note-color-btn');
                  const color = this.value.toUpperCase();

                  chipEl.style.backgroundColor = color;
                  chipEl.setAttribute('aria-label', color);
                  chipEl.setAttribute('data-value', color);
                  chipEl.setAttribute('data-original-title', color);
                  chipEl.click();
                });
              });
            });
          },
          click: (domEvent) => {
            domEvent.stopPropagation();

            const buttonEl = domEvent.target;
            const parentEl = domEvent.target.closest('.note-dropdown-menu');
            const eventName = buttonEl.getAttribute('data-event');
            const value = buttonEl.getAttribute('data-value');

            if (eventName === 'openPalette') {
              const pickerEl = parentEl.querySelector('#' + value);
              const paletteEl = parentEl
                .querySelector('#' + pickerEl.getAttribute('data-event'))
                .querySelector('.note-color-row');

              // Shift palette chips
              const chipEls = paletteEl.querySelectorAll('.note-color-btn');
              const chipEl = chipEls[chipEls.length - 1];

              chipEl.remove();

              // Set chip attributes
              const color = pickerEl.value;

              chipEl.style.backgroundColor = color;
              chipEl.setAttribute('aria-label', color);
              chipEl.setAttribute('data-value', color);
              chipEl.setAttribute('data-original-title', color);

              paletteEl.insertBefore(chipEl, paletteEl.firstChild);

              pickerEl.click();
            } else {
              if (lists.contains(['backColor', 'foreColor'], eventName)) {
                const key = eventName === 'backColor' ? 'background-color' : 'color';
                const colorEl = buttonEl.closest('.note-color').querySelector('.note-recent-color');
                const currentButtonEl = buttonEl.closest('.note-color').querySelector('.tea-editor__button--current-color');

                if (colorEl) {
                  colorEl.style.setProperty(key, value);
                }

                currentButtonEl.setAttribute('data-' + eventName, value);

                if (eventName === 'backColor') {
                  currentButtonEl.style.setProperty('--background-color', value);
                } else if (eventName === 'foreColor') {
                  currentButtonEl.style.setProperty('--font-color', value);
                }
              }
              this.context.invoke('editor.' + eventName, value);
            }
          },
        }),
      ],
    }).render2();
  }

  addToolbarButtons() {
    this.context.memo('button.style', () => {
      return this.ui.buttonGroup([
        this.button({
          className: 'dropdown-toggle',
          contents: this.ui.dropdownButtonContents(
            this.ui.icon(this.options.icons.magic), this.options
          ),
          tooltip: this.lang.style.style,
          data: {
            toggle: 'dropdown',
          },
        }),
        this.ui.dropdown({
          className: 'dropdown-style',
          items: this.options.styleTags,
          title: this.lang.style.style,
          template: (item) => {
            // TBD: need to be simplified
            if (typeof item === 'string') {
              item = {
                tag: item,
                title: (Object.prototype.hasOwnProperty.call(this.lang.style, item) ? this.lang.style[item] : item),
              };
            }

            const tag = item.tag;
            const title = item.title;
            const style = item.style ? ' style="' + item.style + '" ' : '';
            const className = item.className ? ' class="' + item.className + '"' : '';

            return '<' + tag + style + className + '>' + title + '</' + tag + '>';
          },
          click: this.context.createInvokeHandler('editor.formatBlock'),
        }),
      ]).render2();
    });

    for (let styleIdx = 0, styleLen = this.options.styleTags.length; styleIdx < styleLen; styleIdx++) {
      const item = this.options.styleTags[styleIdx];

      this.context.memo('button.style.' + item, () => {
        return this.button({
          className: 'note-btn-style-' + item,
          contents: '<div data-value="' + item + '">' + item.toUpperCase() + '</div>',
          tooltip: this.lang.style[item],
          click: this.context.createInvokeHandler('editor.formatBlock'),
        }).render2();
      });
    }

    this.context.memo('button.bold', () => {
      return this.button({
        className: 'note-btn-bold',
        contents: this.ui.icon(this.options.icons.bold),
        tooltip: this.lang.font.bold + this.representShortcut('bold'),
        click: this.context.createInvokeHandlerAndUpdateState('editor.bold'),
      }).render2();
    });

    this.context.memo('button.italic', () => {
      return this.button({
        className: 'note-btn-italic',
        contents: this.ui.icon(this.options.icons.italic),
        tooltip: this.lang.font.italic + this.representShortcut('italic'),
        click: this.context.createInvokeHandlerAndUpdateState('editor.italic'),
      }).render2();
    });

    this.context.memo('button.underline', () => {
      return this.button({
        className: 'note-btn-underline',
        contents: this.ui.icon(this.options.icons.underline),
        tooltip: this.lang.font.underline + this.representShortcut('underline'),
        click: this.context.createInvokeHandlerAndUpdateState('editor.underline'),
      }).render2();
    });

    this.context.memo('button.clear', () => {
      return this.button({
        contents: this.ui.icon(this.options.icons.eraser),
        tooltip: this.lang.font.clear + this.representShortcut('removeFormat'),
        click: this.context.createInvokeHandler('editor.removeFormat'),
      }).render2();
    });

    this.context.memo('button.strikethrough', () => {
      return this.button({
        className: 'note-btn-strikethrough',
        contents: this.ui.icon(this.options.icons.strikethrough),
        tooltip: this.lang.font.strikethrough + this.representShortcut('strikethrough'),
        click: this.context.createInvokeHandlerAndUpdateState('editor.strikethrough'),
      }).render2();
    });

    this.context.memo('button.superscript', () => {
      return this.button({
        className: 'note-btn-superscript',
        contents: this.ui.icon(this.options.icons.superscript),
        tooltip: this.lang.font.superscript,
        click: this.context.createInvokeHandlerAndUpdateState('editor.superscript'),
      }).render2();
    });

    this.context.memo('button.subscript', () => {
      return this.button({
        className: 'note-btn-subscript',
        contents: this.ui.icon(this.options.icons.subscript),
        tooltip: this.lang.font.subscript,
        click: this.context.createInvokeHandlerAndUpdateState('editor.subscript'),
      }).render2();
    });

    this.context.memo('button.fontname', () => {
      const styleInfo = this.context.invoke('editor.currentStyle');

      if (this.options.addDefaultFonts) {
        // Add 'default' fonts into the fontnames array if not exist
        styleInfo['font-family'].split(',').forEach((fontname) => {
          fontname = fontname.trim().replace(/['"]+/g, '');
          if (this.isFontDeservedToAdd(fontname)) {
            if (this.options.fontNames.indexOf(fontname) === -1) {
              this.options.fontNames.push(fontname);
            }
          }
        });
      }

      return this.ui.buttonGroup([
        this.button({
          className: 'dropdown-toggle',
          contents: this.ui.dropdownButtonContents(
            '<span class="note-current-fontname"></span>', this.options
          ),
          tooltip: this.lang.font.name,
          data: {
            toggle: 'dropdown',
          },
        }),
        this.ui.dropdownCheck({
          className: 'dropdown-fontname',
          checkClassName: this.options.icons.menuCheck,
          items: this.options.fontNames.filter(this.isFontInstalled.bind(this)),
          title: this.lang.font.name,
          template: (item) => {
            return '<span style="font-family: ' + env.validFontName(item) + '">' + item + '</span>';
          },
          click: this.context.createInvokeHandlerAndUpdateState('editor.fontName'),
        }),
      ]).render2();
    });

    this.context.memo('button.fontsize', () => {
      return this.ui.buttonGroup([
        this.button({
          className: 'dropdown-toggle',
          contents: this.ui.dropdownButtonContents('<span class="note-current-fontsize"></span>', this.options),
          tooltip: this.lang.font.size,
          data: {
            toggle: 'dropdown',
          },
        }),
        this.ui.dropdownCheck({
          className: 'dropdown-fontsize',
          checkClassName: this.options.icons.menuCheck,
          items: this.options.fontSizes,
          title: this.lang.font.size,
          click: this.context.createInvokeHandlerAndUpdateState('editor.fontSize'),
        }),
      ]).render2();
    });

    this.context.memo('button.fontsizeunit', () => {
      return this.ui.buttonGroup([
        this.button({
          className: 'dropdown-toggle',
          contents: this.ui.dropdownButtonContents('<span class="note-current-fontsizeunit"></span>', this.options),
          tooltip: this.lang.font.sizeunit,
          data: {
            toggle: 'dropdown',
          },
        }),
        this.ui.dropdownCheck({
          className: 'dropdown-fontsizeunit',
          checkClassName: this.options.icons.menuCheck,
          items: this.options.fontSizeUnits,
          title: this.lang.font.sizeunit,
          click: this.context.createInvokeHandlerAndUpdateState('editor.fontSizeUnit'),
        }),
      ]).render2();
    });

    this.context.memo('button.color', () => {
      return this.colorPalette('note-color-all', this.lang.color.recent, true, true);
    });

    this.context.memo('button.forecolor', () => {
      return this.colorPalette('note-color-fore', this.lang.color.foreground, false, true);
    });

    this.context.memo('button.backcolor', () => {
      return this.colorPalette('note-color-back', this.lang.color.background, true, false);
    });

    this.context.memo('button.ul', () => {
      return this.button({
        contents: this.ui.icon(this.options.icons.unorderedlist),
        tooltip: this.lang.lists.unordered + this.representShortcut('insertUnorderedList'),
        click: this.context.createInvokeHandler('editor.insertUnorderedList'),
      }).render2();
    });

    this.context.memo('button.ol', () => {
      return this.button({
        contents: this.ui.icon(this.options.icons.orderedlist),
        tooltip: this.lang.lists.ordered + this.representShortcut('insertOrderedList'),
        click: this.context.createInvokeHandler('editor.insertOrderedList'),
      }).render2();
    });

    const justifyLeft = this.button({
      contents: this.ui.icon(this.options.icons.alignLeft),
      tooltip: this.lang.paragraph.left + this.representShortcut('justifyLeft'),
      click: this.context.createInvokeHandler('editor.justifyLeft'),
    });

    const justifyCenter = this.button({
      contents: this.ui.icon(this.options.icons.alignCenter),
      tooltip: this.lang.paragraph.center + this.representShortcut('justifyCenter'),
      click: this.context.createInvokeHandler('editor.justifyCenter'),
    });

    const justifyRight = this.button({
      contents: this.ui.icon(this.options.icons.alignRight),
      tooltip: this.lang.paragraph.right + this.representShortcut('justifyRight'),
      click: this.context.createInvokeHandler('editor.justifyRight'),
    });

    const justifyFull = this.button({
      contents: this.ui.icon(this.options.icons.alignJustify),
      tooltip: this.lang.paragraph.justify + this.representShortcut('justifyFull'),
      click: this.context.createInvokeHandler('editor.justifyFull'),
    });

    const outdent = this.button({
      contents: this.ui.icon(this.options.icons.outdent),
      tooltip: this.lang.paragraph.outdent + this.representShortcut('outdent'),
      click: this.context.createInvokeHandler('editor.outdent'),
    });

    const indent = this.button({
      contents: this.ui.icon(this.options.icons.indent),
      tooltip: this.lang.paragraph.indent + this.representShortcut('indent'),
      click: this.context.createInvokeHandler('editor.indent'),
    });

    this.context.memo('button.justifyLeft', func.invoke(justifyLeft, 'render2'));
    this.context.memo('button.justifyCenter', func.invoke(justifyCenter, 'render2'));
    this.context.memo('button.justifyRight', func.invoke(justifyRight, 'render2'));
    this.context.memo('button.justifyFull', func.invoke(justifyFull, 'render2'));
    this.context.memo('button.outdent', func.invoke(outdent, 'render2'));
    this.context.memo('button.indent', func.invoke(indent, 'render2'));

    this.context.memo('button.paragraph', () => {
      let children = [
        this.ui.buttonGroup({
          className: 'note-align',
          children: [justifyLeft, justifyCenter, justifyRight, justifyFull],
        }),
        this.ui.buttonGroup({
          className: 'note-list',
          children: [outdent, indent],
        }),
      ];

      if (this.ui.buttonsStack) {
        children = [this.ui.buttonsStack(children)];
      }

      return this.ui.buttonGroup([
        this.button({
          className: 'dropdown-toggle',
          contents: this.ui.dropdownButtonContents(this.ui.icon(this.options.icons.alignLeft), this.options),
          tooltip: this.lang.paragraph.paragraph,
          data: {
            toggle: 'dropdown',
          },
        }),
        this.ui.dropdown(children),
      ]).render2();
    });

    this.context.memo('button.height', () => {
      return this.ui.buttonGroup([
        this.button({
          className: 'dropdown-toggle',
          contents: this.ui.dropdownButtonContents(this.ui.icon(this.options.icons.textHeight), this.options),
          tooltip: this.lang.font.height,
          data: {
            toggle: 'dropdown',
          },
        }),
        this.ui.dropdownCheck({
          items: this.options.lineHeights,
          checkClassName: this.options.icons.menuCheck,
          className: 'dropdown-line-height',
          title: this.lang.font.height,
          click: this.context.createInvokeHandler('editor.lineHeight'),
        }),
      ]).render2();
    });

    this.context.memo('button.table', () => {
      return this.ui.buttonGroup([
        this.button({
          className: 'dropdown-toggle',
          contents: this.ui.dropdownButtonContents(this.ui.icon(this.options.icons.table), this.options),
          tooltip: this.lang.table.table,
          data: {
            toggle: 'dropdown',
          },
        }),
        this.ui.dropdown({
          title: this.lang.table.table,
          className: 'note-table',
          items: [
            '<div class="note-dimension-picker">',
              '<div class="note-dimension-picker-mousecatcher" data-event="insertTable" data-value="1x1"></div>',
              '<div class="note-dimension-picker-highlighted"></div>',
              '<div class="note-dimension-picker-unhighlighted"></div>',
            '</div>',
            '<div class="note-dimension-display">1 x 1</div>',
          ].join(''),
        }),
      ], {
        callback2: (nodeEls) => {
          nodeEls.forEach((nodeEl) => {
            const catcherEl = nodeEl.querySelector('.note-dimension-picker-mousecatcher');

            catcherEl.style.width = this.options.insertTableMaxSize.col + 'em';
            catcherEl.style.height = this.options.insertTableMaxSize.row + 'em';

            catcherEl.addEventListener('mousedown', this.context.createInvokeHandler('editor.insertTable'));
            catcherEl.addEventListener('mousemove', this.tableMoveHandler.bind(this));
          });
        },
      }).render2();
    });

    this.context.memo('button.link', () => {
      return this.button({
        contents: this.ui.icon(this.options.icons.link),
        tooltip: this.lang.link.link + this.representShortcut('linkDialog.show'),
        click: this.context.createInvokeHandler('linkDialog.show'),
      }).render2();
    });

    this.context.memo('button.picture', () => {
      return this.button({
        contents: this.ui.icon(this.options.icons.picture),
        tooltip: this.lang.image.image,
        click: this.context.createInvokeHandler('imageDialog.show'),
      }).render2();
    });

    this.context.memo('button.video', () => {
      return this.button({
        contents: this.ui.icon(this.options.icons.video),
        tooltip: this.lang.video.video,
        click: this.context.createInvokeHandler('videoDialog.show'),
      }).render2();
    });

    this.context.memo('button.hr', () => {
      return this.button({
        contents: this.ui.icon(this.options.icons.minus),
        tooltip: this.lang.hr.insert + this.representShortcut('insertHorizontalRule'),
        click: this.context.createInvokeHandler('editor.insertHorizontalRule'),
      }).render2();
    });

    this.context.memo('button.fullscreen', () => {
      return this.button({
        className: 'btn-fullscreen note-codeview-keep',
        contents: this.ui.icon(this.options.icons.arrowsAlt),
        tooltip: this.lang.options.fullscreen,
        click: this.context.createInvokeHandler('fullscreen.toggle'),
      }).render2();
    });

    this.context.memo('button.codeview', () => {
      return this.button({
        className: 'btn-codeview note-codeview-keep',
        contents: this.ui.icon(this.options.icons.code),
        tooltip: this.lang.options.codeview,
        click: this.context.createInvokeHandler('codeview.toggle'),
      }).render2();
    });

    this.context.memo('button.redo', () => {
      return this.button({
        contents: this.ui.icon(this.options.icons.redo),
        tooltip: this.lang.history.redo + this.representShortcut('redo'),
        click: this.context.createInvokeHandler('editor.redo'),
      }).render2();
    });

    this.context.memo('button.undo', () => {
      return this.button({
        contents: this.ui.icon(this.options.icons.undo),
        tooltip: this.lang.history.undo + this.representShortcut('undo'),
        click: this.context.createInvokeHandler('editor.undo'),
      }).render2();
    });

    this.context.memo('button.help', () => {
      return this.button({
        contents: this.ui.icon(this.options.icons.question),
        tooltip: this.lang.options.help,
        click: this.context.createInvokeHandler('helpDialog.show'),
      }).render2();
    });
  }

  /**
   * image: [
   *   ['imageResize', ['resizeFull', 'resizeHalf', 'resizeQuarter', 'resizeNone']],
   *   ['float', ['floatLeft', 'floatRight', 'floatNone']],
   *   ['remove', ['removeMedia']],
   * ],
   */
  addImagePopoverButtons() {
    // Image Size Buttons
    this.context.memo('button.resizeFull', () => {
      return this.button({
        contents: '<span class="note-fontsize-10">100%</span>',
        tooltip: this.lang.image.resizeFull,
        click: this.context.createInvokeHandler('editor.resize', '1'),
      }).render2();
    });
    this.context.memo('button.resizeHalf', () => {
      return this.button({
        contents: '<span class="note-fontsize-10">50%</span>',
        tooltip: this.lang.image.resizeHalf,
        click: this.context.createInvokeHandler('editor.resize', '0.5'),
      }).render2();
    });
    this.context.memo('button.resizeQuarter', () => {
      return this.button({
        contents: '<span class="note-fontsize-10">25%</span>',
        tooltip: this.lang.image.resizeQuarter,
        click: this.context.createInvokeHandler('editor.resize', '0.25'),
      }).render2();
    });
    this.context.memo('button.resizeNone', () => {
      return this.button({
        contents: this.ui.icon(this.options.icons.rollback),
        tooltip: this.lang.image.resizeNone,
        click: this.context.createInvokeHandler('editor.resize', '0'),
      }).render2();
    });

    // Float Buttons
    this.context.memo('button.floatLeft', () => {
      return this.button({
        contents: this.ui.icon(this.options.icons.floatLeft),
        tooltip: this.lang.image.floatLeft,
        click: this.context.createInvokeHandler('editor.floatMe', 'left'),
      }).render2();
    });

    this.context.memo('button.floatRight', () => {
      return this.button({
        contents: this.ui.icon(this.options.icons.floatRight),
        tooltip: this.lang.image.floatRight,
        click: this.context.createInvokeHandler('editor.floatMe', 'right'),
      }).render2();
    });

    this.context.memo('button.floatNone', () => {
      return this.button({
        contents: this.ui.icon(this.options.icons.rollback),
        tooltip: this.lang.image.floatNone,
        click: this.context.createInvokeHandler('editor.floatMe', 'none'),
      }).render2();
    });

    // Remove Buttons
    this.context.memo('button.removeMedia', () => {
      return this.button({
        contents: this.ui.icon(this.options.icons.trash),
        tooltip: this.lang.image.remove,
        click: this.context.createInvokeHandler('editor.removeMedia'),
      }).render2();
    });
  }

  addLinkPopoverButtons() {
    this.context.memo('button.linkDialogShow', () => {
      return this.button({
        contents: this.ui.icon(this.options.icons.link),
        tooltip: this.lang.link.edit,
        click: this.context.createInvokeHandler('linkDialog.show'),
      }).render2();
    });

    this.context.memo('button.unlink', () => {
      return this.button({
        contents: this.ui.icon(this.options.icons.unlink),
        tooltip: this.lang.link.unlink,
        click: this.context.createInvokeHandler('editor.unlink'),
      }).render2();
    });
  }

  /**
   * table : [
   *  ['add', ['addRowDown', 'addRowUp', 'addColLeft', 'addColRight']],
   *  ['delete', ['deleteRow', 'deleteCol', 'deleteTable']]
   * ],
   */
  addTablePopoverButtons() {
    this.context.memo('button.addRowUp', () => {
      return this.button({
        className: 'btn-md',
        contents: this.ui.icon(this.options.icons.rowAbove),
        tooltip: this.lang.table.addRowAbove,
        click: this.context.createInvokeHandler('editor.addRow', 'top'),
      }).render2();
    });
    this.context.memo('button.addRowDown', () => {
      return this.button({
        className: 'btn-md',
        contents: this.ui.icon(this.options.icons.rowBelow),
        tooltip: this.lang.table.addRowBelow,
        click: this.context.createInvokeHandler('editor.addRow', 'bottom'),
      }).render2();
    });
    this.context.memo('button.addColLeft', () => {
      return this.button({
        className: 'btn-md',
        contents: this.ui.icon(this.options.icons.colBefore),
        tooltip: this.lang.table.addColLeft,
        click: this.context.createInvokeHandler('editor.addCol', 'left'),
      }).render2();
    });
    this.context.memo('button.addColRight', () => {
      return this.button({
        className: 'btn-md',
        contents: this.ui.icon(this.options.icons.colAfter),
        tooltip: this.lang.table.addColRight,
        click: this.context.createInvokeHandler('editor.addCol', 'right'),
      }).render2();
    });
    this.context.memo('button.deleteRow', () => {
      return this.button({
        className: 'btn-md',
        contents: this.ui.icon(this.options.icons.rowRemove),
        tooltip: this.lang.table.delRow,
        click: this.context.createInvokeHandler('editor.deleteRow'),
      }).render2();
    });
    this.context.memo('button.deleteCol', () => {
      return this.button({
        className: 'btn-md',
        contents: this.ui.icon(this.options.icons.colRemove),
        tooltip: this.lang.table.delCol,
        click: this.context.createInvokeHandler('editor.deleteCol'),
      }).render2();
    });
    this.context.memo('button.deleteTable', () => {
      return this.button({
        className: 'btn-md',
        contents: this.ui.icon(this.options.icons.trash),
        tooltip: this.lang.table.delTable,
        click: this.context.createInvokeHandler('editor.deleteTable'),
      }).render2();
    });
  }

  build(containerEl, groups) {
    for (let groupIdx = 0, groupLen = groups.length; groupIdx < groupLen; groupIdx++) {
      const group = groups[groupIdx];
      const groupName = Array.isArray(group) ? group[0] : group;
      const buttons = Array.isArray(group) ? ((group.length === 1) ? [group[0]] : group[1]) : [group];

      const groupEl = this.ui.buttonGroup({
        className: 'note-' + groupName,
      }).render2();

      for (let idx = 0, len = buttons.length; idx < len; idx++) {
        const btn = this.context.memo('button.' + buttons[idx]);
        if (btn) {
          groupEl.appendChild(typeof btn === 'function' ? btn(this.context) : btn);
        }
      }
      containerEl.appendChild(groupEl);
    }
  }

  /**
   * @param {jQuery} containerEl
   */
  updateCurrentStyle(containerEl) {
    const cont = containerEl || this.toolbarEl;

    if (!cont) {
      return;
    }

    const styleInfo = this.context.invoke('editor.currentStyle');
    this.updateBtnStates(cont, {
      '.note-btn-bold': () => {
        return styleInfo['font-bold'] === 'bold';
      },
      '.note-btn-italic': () => {
        return styleInfo['font-italic'] === 'italic';
      },
      '.note-btn-underline': () => {
        return styleInfo['font-underline'] === 'underline';
      },
      '.note-btn-subscript': () => {
        return styleInfo['font-subscript'] === 'subscript';
      },
      '.note-btn-superscript': () => {
        return styleInfo['font-superscript'] === 'superscript';
      },
      '.note-btn-strikethrough': () => {
        return styleInfo['font-strikethrough'] === 'strikethrough';
      },
    });

    if (styleInfo['font-family']) {
      const fontNames = styleInfo['font-family'].split(',').map((name) => {
        return name.replace(/[\'\"]/g, '')
          .replace(/\s+$/, '')
          .replace(/^\s+/, '');
      });
      const fontName = lists.find(fontNames, this.isFontInstalled.bind(this));

      [].slice.call(cont.querySelectorAll('.dropdown-fontname a')).forEach((item) => {
        // always compare string to avoid creating another func.
        const isChecked = (item.getAttribute('data-value') + '') === (fontName + '');
        item.classList.toggle('checked', isChecked);
      });
      const currentFontNameEl = cont.querySelector('.note-current-fontname');
      if (currentFontNameEl) {
        currentFontNameEl.textContent = fontName;
        // currentFontNameEl.style.fontFamily = fontName;
      }
    }

    if (styleInfo['font-size']) {
      const fontSize = styleInfo['font-size'];
      [].slice.call(cont.querySelectorAll('.dropdown-fontsize a')).forEach((item) => {
        // always compare with string to avoid creating another func.
        const isChecked = (item.getAttribute('data-value') + '') === (fontSize + '');
        item.classList.toggle('checked', isChecked);
      });
      const currentFontSizeEl = cont.querySelector('.note-current-fontsize');
      if (currentFontSizeEl) {
        currentFontSizeEl.textContent = fontSize;
      }

      const fontSizeUnit = styleInfo['font-size-unit'];
      [].slice.call(cont.querySelectorAll('.dropdown-fontsizeunit a')).forEach((item) => {
        const isChecked = (item.getAttribute('data-value') + '') === (fontSizeUnit + '');
        item.classList.toggle('checked', isChecked);
      });
      const currentFontSizeUnitEl = cont.querySelector('.note-current-fontsizeunit');
      if (currentFontSizeUnitEl) {
        currentFontSizeUnitEl.textContent = fontSizeUnit;
      }
    }

    if (styleInfo['line-height']) {
      const lineHeight = styleInfo['line-height'];
      [].slice.call(cont.querySelectorAll('.dropdown-line-height a')).forEach((item) => {
        // always compare with string to avoid creating another func.
        const isChecked = parseFloat(item.getAttribute('data-value')).toFixed(8) === parseFloat(lineHeight).toFixed(8);
        item.classList.toggle('checked', isChecked);
      });
      const currentLineHeightEl = cont.querySelector('.note-current-line-height');
      if (currentLineHeightEl) {
        currentLineHeightEl.textContent = lineHeight;
      }
    }
  }

  updateBtnStates(containerEl, infos) {
    for (const selector in infos) {
      const pred = infos[selector];
      this.ui.toggleBtnActive(func.htmlElementToJquery(containerEl.querySelector(selector)), pred());
    }
  }

  tableMoveHandler(event) {
    const PX_PER_EM = 18;
    const pickerEl = event.target.parentNode; // target is mousecatcher
    const dimensionDisplayEl = pickerEl.nextElementSibling;
    const catcherEl = pickerEl.querySelector('.note-dimension-picker-mousecatcher');
    const highlightedEl = pickerEl.querySelector('.note-dimension-picker-highlighted');
    const unhighlightedEl = pickerEl.querySelector('.note-dimension-picker-unhighlighted');

    const dim = {
      c: Math.ceil(event.offsetX / PX_PER_EM) || 1,
      r: Math.ceil(event.offsetY / PX_PER_EM) || 1,
    };

    highlightedEl.style.width = dim.c + 'em';
    highlightedEl.style.height = dim.r + 'em';
    catcherEl.setAttribute('data-value', dim.c + 'x' + dim.r);

    if (dim.c > 3 && dim.c < this.options.insertTableMaxSize.col) {
      unhighlightedEl.style.width = dim.c + 1 + 'em';
    }

    if (dim.r > 3 && dim.r < this.options.insertTableMaxSize.row) {
      unhighlightedEl.style.height = dim.r + 1 + 'em';
    }

    dimensionDisplayEl.innerHTML = dim.c + ' x ' + dim.r;
  }
}
