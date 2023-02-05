import env from '../core/env';
import key from '../core/key';
import func from '../core/func';
import Summernote from "../class";
import Context from "../Context";
import { Options, UserInterface } from "../core/types";
import { WrappedRange } from "../core/range";

export default class LinkDialog {
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

        context.memo('help.linkDialog.show', this.options.langInfo.help['linkDialog.show']);
    }

    initialize() {
        const containerEl = this.options.dialogsInBody ? document.body : this.options.container;

        if (!(containerEl instanceof HTMLElement)) {
            throw new Error('Container must be of type HTMLElement');
        }

        const body = [
            '<div class="form-group note-form-group">',
                `<label for="note-dialog-link-txt-${this.options.id}" class="note-form-label">${this.lang.link.textToDisplay}</label>`,
                `<input id="note-dialog-link-txt-${this.options.id}" class="note-link-text form-control note-form-control note-input" type="text"/>`,
            '</div>',
            '<div class="form-group note-form-group">',
                `<label for="note-dialog-link-url-${this.options.id}" class="note-form-label">${this.lang.link.url}</label>`,
                `<input id="note-dialog-link-url-${this.options.id}" class="note-link-url form-control note-form-control note-input" type="text" value="http://"/>`,
            '</div>',
            (() => {
                if (!this.options.disableLinkTarget) {
                    const div = document.createElement('div');

                    div.appendChild(this.ui.checkbox({
                        className: 'sn-checkbox-open-in-new-window',
                        text: this.lang.link.openInNewWindow,
                        checked: true,
                    }).render2());

                    return div.innerHTML;
                }

                return '';
            })(),
            (() => {
                const div = document.createElement('div');

                div.appendChild(this.ui.checkbox({
                    className: 'sn-checkbox-use-protocol',
                    text: this.lang.link.useProtocol,
                    checked: true,
                }).render2());

                return div.innerHTML;
            })(),
        ].join('');

        const buttonClass = 'btn btn-primary note-btn note-btn-primary note-link-btn';
        const footer = `<input type="button" href="#" class="${buttonClass}" value="${this.lang.link.insert}" disabled>`;

        const dialogEl = this.ui.dialog({
            className: 'link-dialog',
            title: this.lang.link.insert,
            fade: this.options.dialogsFade,
            body: body,
            footer: footer,
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

    /**
     * toggle update button
     */
    toggleLinkBtn(linkBtnEl: Element, linkTextEl: HTMLInputElement, linkUrlEl: HTMLInputElement) {
        this.ui.toggleBtn(linkBtnEl, !!(linkTextEl.value && linkUrlEl.value));
    }

    /**
     * Show link dialog and set event handlers on dialog controls.
     */
    showLinkDialog(linkInfo: {range: WrappedRange; text: string; url: string; isNewWindow: boolean}): Promise<{
        range: WrappedRange,
        url: string,
        text: string,
        isNewWindow: boolean,
        checkProtocol: boolean,
    }> {
        return new Promise((resolve) => {
            const linkTextEl = this.dialogEl.querySelector('.note-link-text') as HTMLInputElement;
            const linkUrlEl = this.dialogEl.querySelector('.note-link-url') as HTMLInputElement;
            const linkBtnEl = this.dialogEl.querySelector('.note-link-btn') as HTMLElement;
            const openInNewWindowEl = this.dialogEl.querySelector('.sn-checkbox-open-in-new-window input[type=checkbox]') as HTMLInputElement;
            const useProtocolEl = this.dialogEl.querySelector('.sn-checkbox-use-protocol input[type=checkbox]') as HTMLInputElement;

            let listeners: {
                node: Node;
                type: string;
                callback: (domEvent: Event) => void;
            }[] = [];

            const listen = (node: Node, types: string, callback: (domEvent: Event) => void, once = false) => {
                once = !!once;
                const originalCallback = callback;

                types.trim().replace(/ +/, ' ').split(' ').forEach((type: string) => {
                    const callback = (domEvent: Event) => {
                        if (once) {
                            node.removeEventListener(type, callback);

                            listeners = listeners.filter(x => x !== entry);
                        }

                        return originalCallback(domEvent);
                    };
                    const entry = {node, type, callback};

                    node.addEventListener(type, callback);

                    listeners.push(entry);
                });
            };

            const bindEnterKey = (inputEl: HTMLElement, btnEl: HTMLElement) => {
                listen(inputEl, 'keypress', (domEvent: KeyboardEvent) => {
                    if (domEvent.keyCode === key.code.ENTER) {
                        domEvent.preventDefault();
                        btnEl.click();
                    }
                });
            };

            this.ui.onDialogShown(this.dialogEl, () => {
                this.context.triggerEvent('dialog.shown');

                // If no url was given and given text is valid URL then copy that into URL Field
                if (!linkInfo.url && func.isValidUrl(linkInfo.text)) {
                    linkInfo.url = linkInfo.text;
                }

                listen(linkTextEl, 'input paste propertychange', () => {
                    // If linktext was modified by input events,
                    // cloning text from linkUrl will be stopped.
                    linkInfo.text = linkTextEl.value;
                    this.toggleLinkBtn(linkBtnEl, linkTextEl, linkUrlEl);
                });
                linkTextEl.value = linkInfo.text;

                listen(linkUrlEl, 'input paste propertychange', () => {
                    // Display same text on `Text to display` as default
                    // when linktext has no text
                    if (!linkInfo.text) {
                        linkTextEl.value = linkUrlEl.value;
                    }
                    this.toggleLinkBtn(linkBtnEl, linkTextEl, linkUrlEl);
                });
                linkUrlEl.value = linkInfo.url;

                if (!env.isSupportTouch) {
                    linkUrlEl.focus();
                }

                this.toggleLinkBtn(linkBtnEl, linkTextEl, linkUrlEl);

                bindEnterKey(linkUrlEl, linkBtnEl);
                bindEnterKey(linkTextEl, linkBtnEl);

                openInNewWindowEl.checked = linkInfo.isNewWindow !== undefined
                    ? linkInfo.isNewWindow : this.context.options.linkTargetBlank;

                useProtocolEl.checked = linkInfo.url
                    ? false : this.context.options.useProtocol;

                const onBtnClick = (domEvent: MouseEvent) => {
                    domEvent.preventDefault();

                    resolve({
                        range: linkInfo.range,
                        url: linkUrlEl.value,
                        text: linkTextEl.value,
                        isNewWindow: openInNewWindowEl.checked,
                        checkProtocol: useProtocolEl.checked,
                    });
                    this.ui.hideDialog(this.dialogEl);
                };
                listen(linkBtnEl, 'click', onBtnClick, true);
            });

            this.ui.onDialogHidden(this.dialogEl, () => {
                listeners.forEach(x => x.node.removeEventListener(x.type, x.callback));
                listeners = [];
            });

            this.ui.showDialog(this.dialogEl);
        });
    }

    show() {
        const linkInfo = this.context.invoke('editor.getLinkInfo');

        this.context.invoke('editor.saveRange');
        this.showLinkDialog(linkInfo).then((linkInfo) => {
            this.context.invoke('editor.restoreRange');
            this.context.invoke('editor.createLink', linkInfo);
        }).catch(() => {
            this.context.invoke('editor.restoreRange');
        });
    }
}
