/**
 * LinkDialog.spec.js
 * (c) 2015~ Summernote Team
 * summernote may be freely distributed under the MIT license./
 */
import chai from 'chai';
import range from 'src/js/core/range';
import Context from 'src/js/Context';
import LinkDialog from 'src/js/module/LinkDialog';
import 'src/styles/bs5/summernote-bs5';
import Summernote from "src/js/class";
import func from "src/js/core/func";

describe('LinkDialog', () => {
    const expect = chai.expect;
    let context: Context;
    let dialog: LinkDialog;
    let editableEl: HTMLElement;

    beforeEach(() => {
        const options = {...Summernote.meta.options};
        options.toolbar = [
            ['insert', ['link']],
        ];
        context = new Context(
            func.makeElement([
                '<div>' +
                    '<p><a href="https://summernote.org/" target="_blank">hello</a></p>' +
                    '<p><a href="https://summernote.org/">world</a></p>' +
                    '<p><a href="summernote.org/">summer</a></p>' +
                    '<p>summer</p>' +
                    '<p>http://summer</p>' +
                '</div>',
            ].join()),
            options,
        );
        context.initialize();

        dialog = new LinkDialog(context);
        dialog.initialize();

        editableEl = context.layoutInfo.editableEl;

        document.body.appendChild(editableEl);
    });

    describe('LinkDialog', () => {
        // open-in-new-window
        it('should check new window when target=_blank', () => {
            range.createFromNode(editableEl.querySelectorAll('a')[0]).normalize().select();
            context.invoke('editor.setLastRange');
            dialog.show();

            const checkbox: HTMLInputElement = dialog.dialogEl.querySelector('.sn-checkbox-open-in-new-window input[type=checkbox]');
            expect(checkbox.checked).to.be.true;
        });

        it('should uncheck new window without target=_blank', () => {
            range.createFromNode(editableEl.querySelectorAll('a')[1]).normalize().select();
            context.invoke('editor.setLastRange');
            dialog.show();

            const checkbox: HTMLInputElement = dialog.dialogEl.querySelector('.sn-checkbox-open-in-new-window input[type=checkbox]');
            expect(checkbox.checked).to.be.false;
        });

        // use default protocol
        it('should uncheck default protocol if link (with protocol) exists', () => {
            range.createFromNode(editableEl.querySelectorAll('a')[1]).normalize().select();
            context.invoke('editor.setLastRange');
            dialog.show();

            const checkbox: HTMLInputElement = dialog.dialogEl.querySelector('.sn-checkbox-use-protocol input[type=checkbox]');
            expect(checkbox.checked).to.be.false;
        });

        it('should uncheck default protocol if link (without protocol) exists', () => {
            range.createFromNode(editableEl.querySelectorAll('a')[2]).normalize().select();
            context.invoke('editor.setLastRange');
            dialog.show();

            const checkbox: HTMLInputElement = dialog.dialogEl.querySelector('.sn-checkbox-use-protocol input[type=checkbox]');
            expect(checkbox.checked).to.be.false;
        });

        it('should check default protocol if link not exists', () => {
            range.createFromNode(editableEl.querySelectorAll('p')[3]).normalize().select();
            context.invoke('editor.setLastRange');
            dialog.show();

            const checkbox: HTMLInputElement = dialog.dialogEl.querySelector('.sn-checkbox-use-protocol input[type=checkbox]');
            expect(checkbox.checked).to.be.true;
        });

        it('should check default protocol if link not exists although it has protocol', () => {
            range.createFromNode(editableEl.querySelectorAll('p')[4]).normalize().select();
            context.invoke('editor.setLastRange');
            dialog.show();

            const checkbox: HTMLInputElement = dialog.dialogEl.querySelector('.sn-checkbox-use-protocol input[type=checkbox]');
            expect(checkbox.checked).to.be.true;
        });
    });
});
