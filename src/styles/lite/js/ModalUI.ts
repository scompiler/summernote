import func from "src/js/core/func";

class ModalUI {
    static unsubscribe = () => {};

    modalEl: HTMLElement;

    backdropEl: HTMLElement;

    onKeyDown: (event: KeyboardEvent) => void;

    constructor(nodeEl: HTMLElement) {
        this.modalEl = nodeEl;
        this.backdropEl = func.makeElement('<div class="note-modal-backdrop"></div>');

        this.onKeyDown = (domEvent) => {
            if (domEvent.which === 27) {
                domEvent.preventDefault();
                this.hide();
            }
        };
    }

    show() {
        document.body.appendChild(this.backdropEl);
        this.backdropEl.style.display = 'block';

        this.modalEl.classList.add('open');
        this.modalEl.style.display = 'block';
        this.modalEl.dispatchEvent(new Event('note.modal.show'));
        this.modalEl.addEventListener('keydown', this.onKeyDown);

        ModalUI.unsubscribe();

        const onClose = (domEvent: MouseEvent) => {
            if (!(domEvent.target instanceof Element)) {
                return;
            }

            const closeBtnEl = domEvent.target.closest('.close');

            if (!closeBtnEl) {
                return;
            }

            this.hide();
        };

        this.modalEl.addEventListener('click', onClose);
        ModalUI.unsubscribe = () => this.modalEl.removeEventListener('click', onClose);
    }

    hide() {
        this.backdropEl.style.display = 'none';
        this.modalEl.classList.remove('open');
        this.modalEl.style.display = 'none';
        this.modalEl.dispatchEvent(new Event('note.modal.hide'));
        this.modalEl.removeEventListener('keydown', this.onKeyDown);
    }
}

export default ModalUI;
