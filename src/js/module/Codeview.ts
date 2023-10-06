import dom from '../core/dom';
import Context from "../Context";
import { Options } from "../core/types";

interface TernServer {
    updateArgHints(cm: CodeMirror): void;
}

interface TernServerConstructor {
    new (options: Options['codemirror']['tern']): TernServer;
}

interface CodeMirror {
    save(): void;
    toTextArea(): void;
    getValue(): string;
    setSize(width: string | number | null, height: string | number | null): void;
    getDoc(): {
        setValue: (html?: string) => void;
    };

    on(eventName: 'cursorActivity', callback: (cm: CodeMirror) => void): void;
    on(eventName: string, callback: (event: Event) => void): void;


    ternServer: TernServer;
}

export interface CodeMirrorConstructor {
    new (): CodeMirror;

    fromTextArea(element: HTMLTextAreaElement, options: Options['codemirror']): CodeMirror;

    TernServer: TernServerConstructor;
}

/**
 * @class Codeview
 */
export default class CodeView {
    context: Context;

    editorEl: HTMLElement;

    editableEl: HTMLElement;

    codableEl: HTMLTextAreaElement & {
        __cmEditorInstance: CodeMirror;
    };

    options: Options;

    CodeMirrorConstructor: CodeMirrorConstructor;

    constructor(context: Context) {
        this.context = context;
        this.editorEl = context.layoutInfo.editorEl;
        this.editableEl = context.layoutInfo.editableEl;
        this.codableEl = context.layoutInfo.codableEl as any;
        this.options = context.options;
        this.CodeMirrorConstructor = (window as Window & {CodeMirror?: CodeMirrorConstructor}).CodeMirror;

        if (this.options.codemirror.CodeMirrorConstructor) {
            this.CodeMirrorConstructor = this.options.codemirror.CodeMirrorConstructor;
        }
    }

    sync(html?: string) {
        const isCodeview = this.isActivated();
        const CodeMirror = this.CodeMirrorConstructor;

        if (isCodeview) {
            if (html) {
                if (CodeMirror) {
                    this.codableEl.__cmEditorInstance.getDoc().setValue(html);
                } else {
                    this.codableEl.value = html;
                }
            } else {
                if (CodeMirror) {
                    this.codableEl.__cmEditorInstance.save();
                }
            }
        }
    }

    initialize() {
        this.codableEl.addEventListener('keyup', (domEvent) => {
            if (domEvent.key === 'Escape') {
                this.deactivate();
            }
        });
    }

    isActivated(): boolean {
        return this.editorEl.classList.contains('codeview');
    }

    /**
     * Toggle codeview.
     */
    toggle() {
        if (this.isActivated()) {
            this.deactivate();
        } else {
            this.activate();
        }
        this.context.triggerEvent('codeview.toggled');
    }

    /**
     * Purify input value.
     */
    purify(value: string): string {
        if (this.options.codeviewFilter) {
            // filter code view regex
            value = value.replace(this.options.codeviewFilterRegex, '');
            // allow specific iframe tag
            if (this.options.codeviewIframeFilter) {
                const whitelist = this.options.codeviewIframeWhitelistSrc.concat(this.options.codeviewIframeWhitelistSrcBase);
                value = value.replace(/(<iframe.*?>.*?(?:<\/iframe>)?)/gi, function(tag) {
                    // remove if src attribute is duplicated
                    if (/<.+src(?==?('|"|\s)?)[\s\S]+src(?=('|"|\s)?)[^>]*?>/i.test(tag)) {
                        return '';
                    }
                    for (const src of whitelist) {
                        // pass if src is trusted
                        if ((new RegExp('src="(https?:)?\/\/' + src.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '\/(.+)"')).test(tag)) {
                            return tag;
                        }
                    }
                    return '';
                });
            }
        }
        return value;
    }

    /**
     * Activate code view.
     */
    activate() {
        const height = this.editableEl.offsetHeight;
        const CodeMirror = this.CodeMirrorConstructor;
        this.codableEl.value = dom.html(this.editableEl, this.options.prettifyHtml);
        this.codableEl.style.height = height + 'px';

        this.context.invoke('toolbar.updateCodeview', true);
        this.context.invoke('airPopover.updateCodeview', true);

        this.editorEl.classList.add('codeview');
        this.codableEl.focus();

        // activate CodeMirror as codable
        if (CodeMirror) {
            const cmEditor = CodeMirror.fromTextArea(this.codableEl, this.options.codemirror);

            // CodeMirror TernServer
            if (this.options.codemirror.tern) {
                const server = new CodeMirror.TernServer(this.options.codemirror.tern);
                cmEditor.ternServer = server;
                cmEditor.on('cursorActivity', (cm: CodeMirror) => {
                    server.updateArgHints(cm);
                });
            }

            cmEditor.on('blur', (domEvent: FocusEvent) => {
                this.codableEl.value = cmEditor.getValue();
                const value = this.purify(dom.value(this.codableEl, this.options.prettifyHtml) || dom.emptyPara);

                this.context.triggerEvent('blur.codeview', value, domEvent);
            });
            cmEditor.on('change', () => {
                this.codableEl.value = cmEditor.getValue();
                const value = this.purify(dom.value(this.codableEl, this.options.prettifyHtml) || dom.emptyPara);

                this.context.triggerEvent('change.codeview', value, cmEditor);
            });

            // CodeMirror hasn't Padding.
            cmEditor.setSize(null, height);
            this.codableEl.__cmEditorInstance = cmEditor;
        } else {
            this.codableEl.addEventListener('blur', (domEvent) => {
                const value = this.purify(dom.value(this.codableEl, this.options.prettifyHtml) || dom.emptyPara);

                this.context.triggerEvent('blur.codeview', value, domEvent);
            });
            this.codableEl.addEventListener('input', () => {
                const value = this.purify(dom.value(this.codableEl, this.options.prettifyHtml) || dom.emptyPara);

                this.context.triggerEvent('change.codeview', value, this.codableEl);
            });
        }
    }

    /**
     * deactivate code view
     */
    deactivate() {
        const CodeMirror = this.CodeMirrorConstructor;
        // deactivate CodeMirror as codable
        if (CodeMirror) {
            const cmEditor = this.codableEl.__cmEditorInstance;
            this.codableEl.value = cmEditor.getValue();
            cmEditor.toTextArea();
        }

        const value = this.purify(dom.value(this.codableEl, this.options.prettifyHtml) || dom.emptyPara);
        const isChange = this.editableEl.innerHTML !== value;

        this.editableEl.innerHTML = value;
        this.editableEl.style.height = this.options.height ? (this.codableEl.offsetHeight + 'px') : 'auto';
        this.editorEl.classList.remove('codeview');

        if (isChange) {
            this.context.triggerEvent('change', this.editableEl.innerHTML, this.editableEl);
        }

        this.editableEl.focus();

        this.context.invoke('toolbar.updateCodeview', false);
        this.context.invoke('airPopover.updateCodeview', false);
    }

    destroy() {
        if (this.isActivated()) {
            this.deactivate();
        }
    }
}
