import Context from "../Context";
import { Renderer } from "../renderer";

export interface BoundaryPoint {
    node: Node;
    offset: number;
}

export interface Bookmark {
    s: {
        path: number[];
        offset: number;
    };
    e: {
        path: number[];
        offset: number;
    };
}

export interface Snapshot {
    contents: string;
    bookmark: Bookmark;
}

export interface ModuleConstructor {
    new (context: Context): Module;
}
export interface Module {
    shouldInitialize?(): boolean;

    initialize?(): void;

    destroy?(): void;

    events?: {
        [event: string]: (...args: any[]) => any;
    };
}

export interface Module {
    shouldInitialize?(): boolean;

    initialize?(): void;

    events?: {
        [event: string]: (...args: any[]) => any;
    };
}

export interface SummernoteElement extends HTMLElement {
    __summernoteInstance?: Context;
}

export interface Hint {
    match: RegExp;
    content?: (item: any) => Node | string;
    search: (keyword: string, callback: (items: any[]) => void) => void;
    template?: (item: any) => string;
}

export interface Options {
    id?: string;
    container?: string | Element;
    editing?: boolean;
    buttons?: {
        [button: string]: () => void;
    };
    modules?: {
        [module: string]: ModuleConstructor;
    };
    plugins?: {
        [plugin: string]: () => void;
    };
    callbacks?: {
        onBeforeCommand?: (...args: any) => any | null;
        onBlur?: (...args: any) => any | null;
        onBlurCodeview?: (...args: any) => any | null;
        onChange?: (...args: any) => any | null;
        onChangeCodeview?: (...args: any) => any | null;
        onDialogShown?: (...args: any) => any | null;
        onEnter?: (...args: any) => any | null;
        onFocus?: (...args: any) => any | null;
        onImageLinkInsert?: (...args: any) => any | null;
        onImageUpload?: (...args: any) => any | null;
        onImageUploadError?: (...args: any) => any | null;
        onInit?: (...args: any) => any | null;
        onKeydown?: (...args: any) => any | null;
        onKeyup?: (...args: any) => any | null;
        onMousedown?: (...args: any) => any | null;
        onMouseup?: (...args: any) => any | null;
        onPaste?: (...args: any) => any | null;
        onScroll?: (...args: any) => any | null;
    };
    icons?: {[icon: string]: string};
    historyLimit?: number;
    blockquoteBreakingLevel?: number;
    airMode?: boolean;
    disableResizeEditor?: boolean;
    minHeight?: number;
    maxHeight?: number;
    inheritPlaceholder?: boolean;
    placeholder?: string;

    popatmouse?: boolean;
    popover?: {
        image?: [string, string[]][];
        link?: [string, string[]][];
        table?: [string, string[]][];
        air?: [string, string[]][];
    },

    showDomainOnlyForAutolink?: boolean;
    linkTargetBlank?: boolean;

    replace?: {
        match?: (keyword: string, callback: (match: Node | string | null) => void) => void;
    };

    disableResizeImage?: boolean;

    langInfo?: {
        image: {
            original: string;
            maximumFileSize: string;
            selectFromFiles: string;
            url: string;
            insert: string;
        };
        options: {
            help: string;
        };
        link: {
            textToDisplay: string;
            url: string;
            openInNewWindow: string;
            useProtocol: string;
            insert: string;
        };
        help: {
            'linkDialog.show': string;
        }
    };

    dialogsInBody?: boolean;
    dialogsFade?: boolean;

    keyMap?: {
        mac: {[shortcut: string]: string};
        pc: {[shortcut: string]: string};
    };

    hint?: Hint | Hint[];
    hintMode?: 'word' | 'words';
    hintSelect?: 'after' | 'next';
    hintDirection?: 'bottom' | 'top';

    maximumImageFileSize?: number | null;
    acceptImageFileTypes?: string;

    disableLinkTarget?: boolean;
    useProtocol?: boolean;
}

export interface Layout {
    noteEl: HTMLElement;
    editorEl: HTMLElement;
    toolbarEl: HTMLElement;
    toolbarContentEl: HTMLElement;
    editingAreaEl: HTMLElement;
    editableEl: HTMLElement;
    codableEl: HTMLTextAreaElement;
    statusbarEl: HTMLElement;
}

export interface UserInterface {
    createLayout(el: SummernoteElement): Layout;
    removeLayout(el: SummernoteElement, layout: Layout): void;

    popover(options: {
        className: string;
        hideArrow?: boolean;
        direction?: string;
    }): Renderer;

    toggleBtnActive(btnEl: Element, isActive: boolean): void;

    toggleBtn(btnEl: Element, isEnable: boolean): void;

    dialog(options: {
        className?: string;
        title: string;
        fade: boolean;
        body: string;
        footer: string;
        callback2?: (nodeEls: Node[]) => void;
    }): Renderer;

    checkbox(options: {
        className: string;
        text: string;
        checked: boolean;
    }): Renderer;

    hideDialog(dialogEl: HTMLElement): void;

    showDialog(dialogEl: HTMLElement): void;

    onDialogShown(dialogEl: HTMLElement, callback: () => void): void;

    onDialogHidden(dialogEl: HTMLElement, callback: () => void): void;
}
