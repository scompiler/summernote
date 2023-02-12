import Context from "../Context";
import { Renderer } from "../renderer";
import { CodeMirrorConstructor } from "../module/Codeview";

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
        onApplyCustomStyle?: (...args: any) => any | null;
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
    toolbarPosition?: string;

    popatmouse?: boolean;
    popover?: {
        image?: [string, string[]][];
        link?: [string, string[]][];
        table?: [string, string[]][];
        air?: [string, string[]][];
    },

    toolbar?: [string, string[]][];
    followingToolbar?: boolean;
    otherStaticBar?: HTMLElement;
    toolbarContainer?: Element | string;

    showDomainOnlyForAutolink?: boolean;
    linkTargetBlank?: boolean;

    replace?: {
        match?: (keyword: string, callback: (match: Node | string | null) => void) => void;
    };

    disableResizeImage?: boolean;

    langInfo?: {
        image: {
            image: string;
            original: string;
            maximumFileSize: string;
            selectFromFiles: string;
            url: string;
            insert: string;
            dragImageHere: string;
            dropImage: string;
            resizeFull: string;
            resizeHalf: string;
            resizeQuarter: string;
            resizeNone: string;
            floatLeft: string;
            floatRight: string;
            floatNone: string;
            remove: string;
            maximumFileSizeError: string;
        };
        options: {
            help: string;
            fullscreen: string;
            codeview: string;
        };
        link: {
            link: string;
            textToDisplay: string;
            url: string;
            openInNewWindow: string;
            useProtocol: string;
            insert: string;
            edit: string;
            unlink: string;
        };
        help: {
            'linkDialog.show': string;
            escape: string;
            undo: string;
            redo: string;
            tab: string;
            untab: string;
            insertParagraph: string;
            insertOrderedList: string;
            insertUnorderedList: string;
            indent: string;
            outdent: string;
            formatPara: string;
            insertHorizontalRule: string;
            fontName: string;
            formatH1: string;
            formatH2: string;
            formatH3: string;
            formatH4: string;
            formatH5: string;
            formatH6: string;
            bold: string;
            italic: string;
            underline: string;
            strikethrough: string;
            superscript: string;
            subscript: string;
            justifyLeft: string;
            justifyCenter: string;
            justifyRight: string;
            justifyFull: string;
            formatBlock: string;
            removeFormat: string;
            backColor: string;
        };
        video: {
            video: string;
            url: string;
            providers: string;
            insert: string;
        };
        color: {
            more: string;
            background: string;
            transparent: string;
            cpSelect: string;
            foreground: string;
            resetToDefault: string;
            recent: string;
        };
        font: {
            bold: string;
            italic: string;
            underline: string;
            clear: string;
            strikethrough: string;
            superscript: string;
            subscript: string;
            name: string;
            size: string;
            sizeunit: string;
            height: string;
        };
        lists: {
            unordered: string;
            ordered: string;
        };
        paragraph: {
            paragraph: string;
            left: string;
            center: string;
            right: string;
            justify: string;
            outdent: string;
            indent: string;
        };
        style: {
            style: string;
        };
        table: {
            table: string;
            addRowAbove: string;
            addRowBelow: string;
            addColLeft: string;
            addColRight: string;
            delRow: string;
            delCol: string;
            delTable: string;
        };
        hr: {
            insert: string;
        };
        history: {
            redo: string;
            undo: string;
        };
        output: {
            noSelection: string;
        };
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

    disableDragAndDrop?: boolean;

    codeviewFilter?: boolean;
    codeviewFilterRegex?: RegExp;
    codeviewIframeFilter?: boolean;
    codeviewIframeWhitelistSrc?: string[];
    codeviewIframeWhitelistSrcBase?: string[];
    prettifyHtml?: boolean;
    height?: number;
    width?: number;
    codemirror?: {
        tern?: any;
        CodeMirrorConstructor?: CodeMirrorConstructor;
    };

    tooltip?: 'auto';
    fontNamesIgnoreCheck?: string[];
    colorButton?: {
        foreColor: string;
        backColor: string;
    };
    shortcuts?: boolean;
    colors?: string[][];
    colorsName?: string[][];
    styleTags?: string[];
    addDefaultFonts?: boolean;
    fontNames?: string[];
    fontSizes?: string[];
    fontSizeUnits?: string[];
    lineHeights?: string[];
    insertTableMaxSize?: {
        row: number;
        col: number;
    };

    tableClassName?: string;
    linkAddNoReferrer?: boolean;
    linkAddNoOpener?: boolean;
    onCreateLink?: (url: string) => string;
    defaultProtocol?: string;
    maxTextLength?: number;
    recordEveryKeystroke?: boolean;
    spellCheck?: boolean;
    disableGrammar?: boolean;
    overrideContextMenu?: boolean;
    tabDisable?: boolean;
    styleWithCSS?: boolean;
    tabSize?: number;
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
        callback2?: (nodeEls: Node[]) => void;
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

    button(options: {
        className?: string;
        contents: string;
        tooltip: string;
        click?: (domEvent: MouseEvent) => void;
        callback2?: (nodeEls: Node[]) => void;
        container?: Element | string;
        data?: {[key: string]: string};
    }): Renderer;

    buttonGroup(options: {
        className: string;
        children?: Renderer[];
    } | Renderer[], options2?: {
        callback2?: (nodeEls: Node[]) => void;
    }): Renderer;

    buttonsStack(options: Renderer[]): Renderer;

    dropdownButtonContents(contents: string, options?: Options): string;

    dropdown(options: {
        className?: string;
        title?: string;
        items?: string[] | string;
        callback2?: (nodeEls: Node[]) => void;
        click?: (domEvent: MouseEvent) => void;
        template?: (item: {
            tag: string;
            title: string;
            style?: string;
            className?: string;
        } | string) => string;
    } | Renderer[]): Renderer;

    dropdownCheck(options: {
        className: string;
        checkClassName: string;
        items: string[];
        title: string;
        template?: (item: string) => string;
        click: (domEvent: MouseEvent) => void;
    }): Renderer;

    palette(options: {
        colors: string[][];
        colorsName: string[][];
        eventName: string;
        container: Element | string;
        tooltip: 'auto';
    }): Renderer;

    icon(className: string, tagName?: string): string;

    hideDialog(dialogEl: HTMLElement): void;

    showDialog(dialogEl: HTMLElement): void;

    onDialogShown(dialogEl: HTMLElement, callback: () => void): void;

    onDialogHidden(dialogEl: HTMLElement, callback: () => void): void;
}
