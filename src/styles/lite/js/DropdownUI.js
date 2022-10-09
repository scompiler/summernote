import func from "../../../js/core/func";

class DropdownUI {
  constructor(nodeEl, options) {
    this.buttonEl = nodeEl;
    this.options = Object.assign({}, {
      target: options.container,
    }, options);
    this.setEvent();
  }

  setEvent() {
    this.buttonEl.addEventListener('click', (domEvent) => {
      this.toggle();
      domEvent.stopImmediatePropagation();
    });
  }

  clear() {
    const parentEls = [].slice.call(document.querySelectorAll('.note-btn-group.open'));

    parentEls.forEach((parentEl) => {
      const activeBtnEls = [].slice.call(parentEl.querySelectorAll('.note-btn.active'));

      activeBtnEls.forEach(x => x.classList.remove('active'));

      parentEl.classList.remove('open');
    });
  }

  show() {
    this.buttonEl.classList.add('active');
    this.buttonEl.parentElement.classList.add('open');

    const dropDownEl = this.buttonEl.nextElementSibling;
    const offset = func.getElementOffset(this.buttonEl);
    const width = dropDownEl.offsetWidth;
    const containerWidth = document.scrollingElement.clientWidth;

    if (offset.left + width > containerWidth) {
      dropDownEl.style.marginLeft = (containerWidth - (offset.left + width)) + 'px';
    } else {
      dropDownEl.style.marginLeft = '';
    }
  }

  hide() {
    this.buttonEl.classList.remove('active');
    this.buttonEl.parentElement.classList.remove('open');
  }

  toggle() {
    const isOpened = this.buttonEl.parentElement.classList.contains('open');

    this.clear();

    if (isOpened) {
      this.hide();
    } else {
      this.show();
    }
  }
}

document.addEventListener('click', (e) => {
  const btnGroupEl = e.target.closest('.note-btn-group');

  if (!btnGroupEl) {
    [].slice.call(document.querySelectorAll('.note-btn-group.open .note-btn.active')).forEach((el) => {
      el.classList.remove('active');
    });
    [].slice.call(document.querySelectorAll('.note-btn-group.open')).forEach((el) => {
      el.classList.remove('open');
    });
  }

  const dropdownMenuEl = e.target.closest('.note-dropdown-menu');

  if (dropdownMenuEl && dropdownMenuEl.parentElement) {
    dropdownMenuEl.parentElement.classList.remove('open');

    const activeBtnEls = [].slice.call(dropdownMenuEl.parentElement.querySelectorAll('.note-btn.active'));

    activeBtnEls.forEach(x => x.classList.remove('active'));
  }
});

export default DropdownUI;
