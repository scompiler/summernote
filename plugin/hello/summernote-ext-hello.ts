import { Layout } from "src/js/core/types";

(function() {
    // Extends plugins for adding hello.
    //  - plugin is external module for customizing.
    window.Summernote.meta.plugins['hello'] = function(context) {
        let panelEl: HTMLElement;

        // ui has renders to build ui elements.
        //  - you can create a button with `ui.button`
        const ui = window.Summernote.meta.ui;

        // add hello button
        context.memo('button.hello', function() {
            // create button
            const button = ui.button({
                contents: '<i class="fa fa-child"/> Hello',
                tooltip: 'hello',
                click: function() {
                    panelEl.style.display = 'block';

                    setTimeout(() => {
                        panelEl.style.display = 'none';
                    }, 500);

                    // invoke insertText method with 'hello' on editor module.
                    context.invoke('editor.insertText', 'hello');
                },
            });

            // create jQuery object from button instance.
            return button.render2();
        });

        // This events will be attached when editor is initialized.
        this.events = {
            // This will be called after modules are initialized.
            'summernote.init': function(event: CustomEvent<[Layout]>) {
                // eslint-disable-next-line
                console.log('summernote initialized', event, event.detail[0]);
            },
            // This will be called when user releases a key on editable.
            'summernote.keyup': function(event: CustomEvent<[Layout]>) {
                // eslint-disable-next-line
                console.log('summernote keyup', event, event.detail[0]);
            },
        };

        // You can create elements for plugin
        this.initialize = function() {
            panelEl = document.createElement('div');
            panelEl.classList.add('hello-panel');
            panelEl.style.position = 'absolute';
            panelEl.style.width = '100px';
            panelEl.style.height = '100px';
            panelEl.style.left = '50%';
            panelEl.style.top = '50%';
            panelEl.style.background = 'red';
            panelEl.style.display = 'none';

            document.body.appendChild(panelEl);
        };

        // You should remove elements on `initialize`.
        this.destroy = function() {
            panelEl.remove();
            panelEl = null;
        };
    };
})();
