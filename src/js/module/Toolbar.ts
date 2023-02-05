import func from "../core/func";
import Summernote from "../class";
import Context from "../Context";
import { Options, UserInterface } from "../core/types";

export default class Toolbar {
    context: Context;

    ui: UserInterface;

    noteEl: HTMLElement;

    editorEl: HTMLElement;

    toolbarEl: HTMLElement;

    toolbarContentEl: HTMLElement;

    editableEl: HTMLElement;

    statusbarEl: HTMLElement;

    options: Options;

    isFollowing = false;

    constructor(context: Context) {
        this.context = context;
        this.ui = Summernote.meta.ui;
        this.noteEl = context.layoutInfo.noteEl;
        this.editorEl = context.layoutInfo.editorEl;
        this.toolbarEl = context.layoutInfo.toolbarEl;
        this.toolbarContentEl = context.layoutInfo.toolbarContentEl;
        this.editableEl = context.layoutInfo.editableEl;
        this.statusbarEl = context.layoutInfo.statusbarEl;
        this.options = context.options;
        this.followScroll = this.followScroll.bind(this);
    }

    shouldInitialize() {
        return !this.options.airMode;
    }

    initialize() {
        this.options.toolbar = this.options.toolbar || [];

        if (!this.options.toolbar.length) {
            this.toolbarEl.style.display = 'none';
        } else {
            this.context.invoke('buttons.build', this.toolbarContentEl || this.toolbarEl, this.options.toolbar);
        }

        this.changeContainer(false);

        ['summernote.keyup', 'summernote.mouseup', 'summernote.change'].forEach((type) => {
            this.noteEl.addEventListener(type, () => this.context.invoke('buttons.updateCurrentStyle'));
        });

        this.context.invoke('buttons.updateCurrentStyle');
        if (this.options.followingToolbar) {
            ['scroll', 'resize'].forEach((type) => window.addEventListener(type, this.followScroll));
        }
    }

    destroy() {
        this.toolbarEl.innerHTML = '';

        if (this.options.followingToolbar) {
            ['scroll', 'resize'].forEach((type) => window.removeEventListener(type, this.followScroll));
        }
    }

    followScroll() {
        if (this.editorEl.getAttribute('data-fullscreen') === 'true') {
            return false;
        }

        const editorStyle = getComputedStyle(this.editorEl);
        const editorPaddingX = parseFloat(editorStyle.paddingLeft) + parseFloat(editorStyle.paddingRight);
        const editorHeight = this.editorEl.offsetHeight;
        const editorWidth = this.editorEl.clientWidth - editorPaddingX;
        const toolbarHeight = this.toolbarEl.offsetHeight;
        const statusbarHeight = this.statusbarEl.offsetHeight;

        // check if the web app is currently using another static bar
        let otherBarHeight = 0;
        if (this.options.otherStaticBar) {
            otherBarHeight = this.options.otherStaticBar.offsetHeight;
        }

        const currentOffset = document.scrollingElement.scrollTop;
        const editorOffsetTop = func.getElementOffset(this.editorEl).top;
        const editorOffsetBottom = editorOffsetTop + editorHeight;
        const activateOffset = editorOffsetTop - otherBarHeight;
        const deactivateOffsetBottom = editorOffsetBottom - otherBarHeight - toolbarHeight - statusbarHeight;

        if (!this.isFollowing &&
            (currentOffset > activateOffset) && (currentOffset < deactivateOffsetBottom - toolbarHeight)) {
            this.isFollowing = true;
            this.editableEl.style.marginTop = toolbarHeight + 'px';
            this.toolbarEl.style.position = 'fixed';
            this.toolbarEl.style.top = otherBarHeight + 'px';
            this.toolbarEl.style.width = editorWidth + 'px';
            this.toolbarEl.style.zIndex = '1000';
        } else if (this.isFollowing &&
            ((currentOffset < activateOffset) || (currentOffset > deactivateOffsetBottom))) {
            this.isFollowing = false;
            this.toolbarEl.style.position = 'relative';
            this.toolbarEl.style.top = '0';
            this.toolbarEl.style.width = '100%';
            this.toolbarEl.style.zIndex = 'auto';
            this.editableEl.style.marginTop = '';
        }
    }

    changeContainer(isFullscreen: boolean) {
        if (isFullscreen) {
            this.editorEl.insertBefore(this.toolbarEl, this.editorEl.firstChild);
        } else {
            this.moveToToolbarContainer();
        }
        if (this.options.followingToolbar) {
            this.followScroll();
        }
    }

    updateFullscreen(isFullscreen: boolean) {
        const btnEl = this.toolbarEl.querySelector('.btn-fullscreen');
        this.ui.toggleBtnActive(btnEl, isFullscreen);

        this.changeContainer(isFullscreen);
    }

    updateCodeview(isCodeview: boolean) {
        const btnEl = this.toolbarEl.querySelector('.btn-codeview');
        this.ui.toggleBtnActive(btnEl, isCodeview);
        if (isCodeview) {
            this.deactivate();
        } else {
            this.activate();
        }
    }

    activate(isIncludeCodeview = false) {
        let btnEls = [].slice.call(this.toolbarEl.querySelectorAll('button')) as HTMLButtonElement[];
        if (!isIncludeCodeview) {
            btnEls = btnEls.filter((btnEl) => !btnEl.classList.contains('note-codeview-keep'));
        }
        btnEls.forEach((btnEl) => this.ui.toggleBtn(btnEl, true));
    }

    deactivate(isIncludeCodeview = false) {
        let btnEls = [].slice.call(this.toolbarEl.querySelectorAll('button')) as HTMLButtonElement[];
        if (!isIncludeCodeview) {
            btnEls = btnEls.filter((btnEl) => !btnEl.classList.contains('note-codeview-keep'));
        }
        btnEls.forEach((btnEl) => this.ui.toggleBtn(btnEl, false));
    }

    moveToToolbarContainer() {
        if (!this.options.toolbarContainer) {
            return;
        }

        const toolbarContainerEl = typeof this.options.toolbarContainer === 'string'
            ? document.querySelector(this.options.toolbarContainer)
            : this.options.toolbarContainer;

        if (!toolbarContainerEl) {
            return;
        }

        toolbarContainerEl.appendChild(this.toolbarEl);
    }
}
