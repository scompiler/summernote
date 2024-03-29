import env from '../core/env';
import func from "../core/func";
import Summernote from "../class";
import Context from "../Context";
import { Options, UserInterface } from "../core/types";

export default class HelpDialog {
    context: Context;

    ui: UserInterface;

    options: Options;

    lang: Options['langInfo'];

    dialogEl: HTMLElement;

    constructor(context: Context) {
        this.context = context;

        this.ui = Summernote.meta.ui;
        this.options = context.options;
        this.lang = this.options.langInfo;
    }

    initialize() {
        const containerEl = this.options.dialogsInBody ? document.body : this.options.container;

        if (!(containerEl instanceof HTMLElement)) {
            throw new Error('Container must be of type HTMLElement');
        }

        const body = [
            '<p class="text-center">',
                '<a href="http://summernote.org/" target="_blank" rel="noopener noreferrer">Summernote @@VERSION@@</a> · ',
                '<a href="https://github.com/summernote/summernote" target="_blank" rel="noopener noreferrer">Project</a> · ',
                '<a href="https://github.com/summernote/summernote/issues" target="_blank" rel="noopener noreferrer">Issues</a>',
            '</p>',
        ].join('');

        const dialogEl = this.ui.dialog({
            title: this.lang.options.help,
            fade: this.options.dialogsFade,
            body: this.createShortcutList(),
            footer: body,
            callback2: (nodeEls) => {
                nodeEls.forEach((nodeEl) => {
                    if (!(nodeEl instanceof Element)) {
                        return;
                    }

                    [].slice.call(nodeEl.querySelectorAll('.modal-body, .note-modal-body')).forEach((item: HTMLElement) => {
                        item.style.maxHeight = 300 + 'px';
                        item.style.overflow = 'scroll';
                    });
                });
            },
        }).render2();

        if (!(dialogEl instanceof HTMLElement)) {
            throw new Error('Dialog must be of type HTMLElement');
        }

        this.dialogEl = dialogEl;

        containerEl.appendChild(this.dialogEl);
    }

    destroy() {
        this.ui.hideDialog(this.dialogEl);
        this.dialogEl.remove();
    }

    createShortcutList() {
        const keyMap = this.options.keyMap[env.isMac ? 'mac' : 'pc'];
        return Object.keys(keyMap).map((key) => {
            const command = keyMap[key];

            const rowEl = func.makeElement('<div><div class="help-list-item"></div></div>');
            const labelEl = func.makeElement('<label><kbd>' + key + '</kdb></label>');

            labelEl.style.width = 180 + 'px';
            labelEl.style.marginRight = 10 + 'px';

            const spanEl = func.makeElement('<span></span>');

            spanEl.innerHTML = this.context.memo('help.' + command) || command;

            rowEl.appendChild(labelEl);
            rowEl.appendChild(spanEl);

            return rowEl.innerHTML;
        }).join('');
    }

    /**
     * show help dialog
     *
     * @return {Promise}
     */
    showHelpDialog() {
        return new Promise<void>((resolve) => {
            this.ui.onDialogShown(this.dialogEl, () => {
                this.context.triggerEvent('dialog.shown');
                resolve();
            });
            this.ui.showDialog(this.dialogEl);
        });
    }

    show() {
        this.context.invoke('editor.saveRange');
        this.showHelpDialog().then(() => {
            this.context.invoke('editor.restoreRange');
        });
    }
}
