import './summernote-ext-databasic.scss';
import Context from 'src/js/Context';
import { Layout } from "../../src/js/core/types";
import { WrappedRange } from "../../src/js/core/range";

(function() {
    // define the popover plugin
    const DataBasicPlugin = function(context: Context) {
        // pull in some summernote core functions
        const ui = window.Summernote.meta.ui;
        const dom = window.Summernote.meta.dom;

        const self = this;
        const options = context.options;
        const lang = options.langInfo;
        let dialogEl: HTMLElement;
        let popoverEl: HTMLElement;

        self.icon = '<i class="fa fa-object-group"></i>';

        // add context menu button for dialog
        context.memo('button.databasic', function() {
            return ui.button({
                contents: self.icon,
                tooltip: lang.databasic.insert,
                click: context.createInvokeHandler('databasic.showDialog'),
            }).render2();
        });

        // add popover edit button
        context.memo('button.databasicDialog', function() {
            return ui.button({
                contents: self.icon,
                tooltip: lang.databasic.edit,
                click: context.createInvokeHandler('databasic.showDialog'),
            }).render2();
        });

        //  add popover size buttons
        context.memo('button.databasicSize100', function() {
            return ui.button({
                contents: '<span class="note-fontsize-10">100%</span>',
                tooltip: lang.image.resizeFull,
                click: context.createInvokeHandler('editor.resize', '1'),
            }).render2();
        });
        context.memo('button.databasicSize50', function() {
            return ui.button({
                contents: '<span class="note-fontsize-10">50%</span>',
                tooltip: lang.image.resizeHalf,
                click: context.createInvokeHandler('editor.resize', '0.5'),
            }).render2();
        });
        context.memo('button.databasicSize25', function() {
            return ui.button({
                contents: '<span class="note-fontsize-10">25%</span>',
                tooltip: lang.image.resizeQuarter,
                click: context.createInvokeHandler('editor.resize', '0.25'),
            }).render2();
        });

        self.events = {
            'summernote.init': function(event: CustomEvent<[Layout]>) {
                const elems: HTMLElement[] = [].slice.call(event.detail[0].editableEl.querySelectorAll('data.ext-databasic'));

                // update existing containers
                elems.forEach((x) => self.setContent(x));
                // TODO: make this an undo snapshot...
            },
            'summernote.keyup summernote.mouseup summernote.change summernote.scroll': function() {
                self.update();
            },
            'summernote.dialog.shown': function() {
                self.hidePopover();
            },
        };

        self.initialize = function() {
            // create dialog markup
            const containerEl = options.dialogsInBody ? document.body : context.layoutInfo.editorEl;

            const body = '<div class="form-group row-fluid">' +
                '<label>' + lang.databasic.testLabel + '</label>' +
                '<input class="ext-databasic-test form-control" type="text" />' +
                '</div>';
            const footer = '<button href="#" class="btn btn-primary ext-databasic-save">' + lang.databasic.insert + '</button>';

            dialogEl = ui.dialog({
                title: lang.databasic.name,
                fade: options.dialogsFade,
                body: body,
                footer: footer,
            }).render2() as HTMLElement;

            containerEl.appendChild(dialogEl);

            // create popover
            popoverEl = ui.popover({
                className: 'ext-databasic-popover',
            }).render2() as HTMLElement;

            document.body.appendChild(popoverEl);

            const contentEl = popoverEl.querySelector('.popover-content');

            context.invoke('buttons.build', contentEl, options.popover.databasic);
        };

        self.destroy = function() {
            popoverEl.remove();
            popoverEl = null;
            dialogEl.remove();
            dialogEl = null;
        };

        self.update = function() {
            // Prevent focusing on editable when invoke('code') is executed
            if (!context.invoke('editor.hasFocus')) {
                self.hidePopover();
                return;
            }

            const rng: WrappedRange = context.invoke('editor.createRange');
            let visible = false;

            if (rng.isOnData() && rng.sc instanceof Element) {
                const data = rng.sc.closest('data.ext-databasic') as HTMLElement;

                if (data) {
                    const pos = dom.posFromPlaceholder(data);

                    popoverEl.style.display = 'block';
                    popoverEl.style.left = pos.left + 'px';
                    popoverEl.style.top = pos.top + 'px';

                    // save editor target to let size buttons resize the container
                    context.invoke('editor.saveTarget', data);

                    visible = true;
                }
            }

            // hide if not visible
            if (!visible) {
                self.hidePopover();
            }
        };

        self.hidePopover = function() {
            popoverEl.style.display = 'none';
        };

        // define plugin dialog
        self.getInfo = function(): {node?: Element; test?: string} {
            const rng: WrappedRange = context.invoke('editor.createRange');

            if (rng.isOnData() && rng.sc instanceof Element) {
                const data = rng.sc.closest('data.ext-databasic');

                if (data) {
                    // Get the first node on range(for edit).
                    return {
                        node: data,
                        test: data.getAttribute('data-test'),
                    };
                }
            }

            return {};
        };

        self.setContent = function(node: Element) {
            node.innerHTML = '<p contenteditable="false">' + self.icon + ' ' + lang.databasic.name + ': ' + node.getAttribute('data-test') + '</p>';
        };

        self.updateNode = function(info: {node?: Element; test?: string}) {
            info.node.setAttribute('data-test', info.test);

            self.setContent(info.node);
        };

        self.createNode = function(info: {node?: Element; test?: string}) {
            const node = document.createElement('data');

            node.classList.add('ext-databasic');

            if (node) {
                // save node to info structure
                info.node = node;
                // insert node into editor dom
                context.invoke('editor.insertNode', node);
            }

            return node;
        };

        self.showDialog = function() {
            const info = self.getInfo();
            const newNode = !info.node;
            context.invoke('editor.saveRange');

            self
                .openDialog(info)
                .then(function(dialogInfo: {test: string}) {
                    // [workaround] hide dialog before restore range for IE range focus
                    ui.hideDialog(dialogEl);
                    context.invoke('editor.restoreRange');

                    // insert a new node
                    if (newNode) {
                        self.createNode(info);
                    }

                    // update info with dialog info
                    Object.assign(info, dialogInfo);

                    self.updateNode(info);
                })
                .catch(function() {
                    context.invoke('editor.restoreRange');
                });
        };

        self.openDialog = function(info: {node?: Element; test?: string}): Promise<{test: string}> {
            return new Promise((resolve, reject) => {
                const inpTestEl = dialogEl.querySelector('.ext-databasic-test') as HTMLInputElement;
                const saveBtnEl = dialogEl.querySelector('.ext-databasic-save') as HTMLButtonElement;
                const onKeyup = function(event: KeyboardEvent) {
                    if (event.keyCode === 13) {
                        saveBtnEl.click();
                    }
                };
                const onInput = function() {
                    ui.toggleBtn(saveBtnEl, !!inpTestEl.value);
                };
                const onClick = function(event: MouseEvent) {
                    event.preventDefault();

                    resolve({ test: inpTestEl.value });
                };

                ui.onDialogShown(dialogEl, function() {
                    context.triggerEvent('dialog.shown');

                    inpTestEl.value = info.test;
                    inpTestEl.addEventListener('input', onInput);
                    inpTestEl.addEventListener('keyup', onKeyup);
                    inpTestEl.focus();

                    saveBtnEl.textContent = info.node ? lang.databasic.edit : lang.databasic.insert;
                    saveBtnEl.addEventListener('click', onClick);

                    // init save button
                    ui.toggleBtn(saveBtnEl, !!inpTestEl.value);
                });

                ui.onDialogHidden(dialogEl, function() {
                    inpTestEl.removeEventListener('input', onInput);
                    inpTestEl.removeEventListener('input', onKeyup);
                    saveBtnEl.removeEventListener('click', onClick);

                    reject();
                });

                ui.showDialog(dialogEl);
            });
        };
    };

    // Extends plugins for adding hello.
    //  - plugin is external module for customizing.
    window.Summernote.meta.plugins['databasic'] = DataBasicPlugin;
    window.Summernote.meta.options.popover.databasic = [
        ['databasic', ['databasicDialog', 'databasicSize100', 'databasicSize50', 'databasicSize25']],
    ];
    window.Summernote.languages['en-US'].databasic = {
        name: 'Basic Data Container',
        insert: 'insert basic data container',
        edit: 'edit basic data container',
        testLabel: 'test input',
    };
})();
