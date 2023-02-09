function eq(itemA: any) {
    return function(itemB: any) {
        return itemA === itemB;
    };
}

function eq2(itemA: any, itemB: any) {
    return itemA === itemB;
}

function peq2<T extends {[property: string]: any}>(propName: string) {
    return function(itemA: T, itemB: T) {
        return itemA[propName] === itemB[propName];
    };
}

function ok(): true {
    return true;
}

function fail(): false {
    return false;
}

function not<T extends any[]>(f: (...args: T) => boolean): (...args: T) => boolean {
    return (...args: T) => !f.apply(f, args);
}

function and<T extends any[]>(fA: (...args: T) => boolean, fB: (...args: T) => boolean) {
    return (...args: T) => fA(...args) && fB(...args);
}

function self(a: any) {
    return a;
}

type Func = (...args: any[]) => any;
type PropertiesWithType<T extends {[property: string]: any}, Type> = {[K in keyof T as (T[K] extends Type ? K : never)]: T[K]};

function invoke<T extends {[property: string]: any}>(obj: T, method: keyof PropertiesWithType<T, Func>) {
    return function(...args: any[]) {
        // eslint-disable-next-line prefer-spread
        return obj[method].apply(obj, args);
    };
}

let idCounter = 0;

/**
 * Reset globally-unique id.
 */
function resetUniqueId() {
    idCounter = 0;
}

/**
 * Generate a globally-unique id.
 */
function uniqueId(prefix: string) {
    const id = ++idCounter + '';
    return prefix ? prefix + id : id;
}

/**
 * Returns bnd (bounds) from rect.
 *
 * - IE Compatibility Issue: http://goo.gl/sRLOAo
 * - Scroll Issue: http://goo.gl/sNjUc
 */
function rect2bnd(rect: DOMRect) {
    return {
        top: rect.top + document.scrollingElement.scrollTop,
        left: rect.left + document.scrollingElement.scrollLeft,
        width: rect.right - rect.left,
        height: rect.bottom - rect.top,
    };
}

/**
 * Returns a copy of the object where the keys have become the values and the values the keys.
 */
function invertObject<T extends {[property: string | number]: string | number}>(obj: T) {
    const inverted: {[K in keyof T as T[K]]: K} = {} as any;

    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key) && key in obj) {
            inverted[obj[key]] = key as any;
        }
    }

    return inverted;
}

function namespaceToCamel(namespace: string, prefix?: string): string {
    prefix = prefix || '';
    return prefix + namespace.split('.').map(function(name) {
        return name.substring(0, 1).toUpperCase() + name.substring(1);
    }).join('');
}

/**
 * Returns a function, that, as long as it continues to be invoked, will not be triggered. The function will be called
 * after it stops being called for N milliseconds. If `immediate` is passed, trigger the function on the leading edge,
 * instead of the trailing.
 */
function debounce<T extends any[]>(func: (...args: T) => any, wait: number, immediate = false) {
    let timeout: NodeJS.Timeout;
    return function(...args: T) {
        const context = this;
        const later = () => {
            timeout = null;
            if (!immediate) {
                func.apply(context, args);
            }
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) {
            func.apply(context, args);
        }
    };
}

function isValidUrl(url: string): boolean {
    const expression = /[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&/=]*)/gi;
    return expression.test(url);
}

function getElementRect(element: Element) {
    const rect = element.getBoundingClientRect();

    return new DOMRect(
        rect.x + element.ownerDocument.defaultView.scrollX,
        rect.y + element.ownerDocument.defaultView.scrollY,
        rect.width,
        rect.height,
    );
}

function getElementOffset(element: Element) {
    const rect = element.getBoundingClientRect();

    return {
        top: rect.top + element.ownerDocument.defaultView.scrollY,
        left: rect.left + element.ownerDocument.defaultView.scrollX,
    };
}

function makeElement<T extends HTMLElement>(markup: string, parent?: string): T {
    const div = document.createElement(parent || 'div');

    div.innerHTML = markup;

    return div.firstElementChild as T;
}

export default {
    eq,
    eq2,
    peq2,
    ok,
    fail,
    self,
    not,
    and,
    invoke,
    resetUniqueId,
    uniqueId,
    rect2bnd,
    invertObject,
    namespaceToCamel,
    debounce,
    isValidUrl,
    getElementRect,
    getElementOffset,
    makeElement,
};
