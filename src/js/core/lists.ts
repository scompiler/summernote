import func from './func';

/**
 * Returns the first item of an array.
 */
function head(array: any[]) {
    return array[0];
}

/**
 * Returns the last item of an array.
 */
function last<T>(array: T[]): T {
    return array[array.length - 1];
}

/**
 * Returns everything but the last entry of the array.
 */
function initial(array: any[]) {
    return array.slice(0, array.length - 1);
}

/**
 * Returns the rest of the items in an array.
 */
function tail<T>(array: T[]): T[] {
    return array.slice(1);
}

/**
 * Returns item of array.
 */
function find<T>(array: T[], pred: (item: T) => boolean): T | undefined {
    for (let idx = 0, len = array.length; idx < len; idx++) {
        const item = array[idx];
        if (pred(item)) {
            return item;
        }
    }
}

/**
 * Returns true if all the values in the array pass the predicate truth test.
 */
function all<T>(array: T[], pred: (item: T) => boolean): boolean {
    for (let idx = 0, len = array.length; idx < len; idx++) {
        if (!pred(array[idx])) {
            return false;
        }
    }
    return true;
}

/**
 * Returns true if the value is present in the list.
 */
function contains(array: DOMTokenList, item: string): boolean;
function contains<T>(array: T[], item: T): boolean;
function contains(array: any[] | DOMTokenList, item: any): boolean {
    if (array && array.length && item) {
        if (array instanceof DOMTokenList) {
            // `DOMTokenList` doesn't implement `.indexOf`, but it implements `.contains`
            return array.contains(item);
        } else {
            return array.indexOf(item) !== -1;
        }
    }
    return false;
}

/**
 * Get sum from a list.
 */
function sum(array: any[], fn?: (item: number) => number) {
    fn = fn || func.self;
    return array.reduce((memo, v) => memo + fn(v), 0);
}

/**
 * Returns a copy of the collection with array type.
 */
function from(collection: NodeList) {
    const result = [];
    const length = collection.length;
    let idx = -1;
    while (++idx < length) {
        result[idx] = collection[idx];
    }
    return result;
}

/**
 * Returns whether list is empty or not.
 */
function isEmpty(array: any[]) {
    return !array || !array.length;
}

/**
 * Cluster elements by predicate function.
 */
function clusterBy<T>(array: T[], fn: (itemA: T, itemB: T) => boolean): T[][] {
    if (!array.length) {
        return [];
    }
    const aTail = tail(array);
    return aTail.reduce(function(memo, v) {
        const aLast = last(memo);
        if (fn(last(aLast), v)) {
            aLast[aLast.length] = v;
        } else {
            memo[memo.length] = [v];
        }
        return memo;
    }, [[head(array)]]);
}

/**
 * Returns a copy of the array with all false values removed.
 */
function compact<T>(array: T[]): T[] {
    const aResult = [];
    for (let idx = 0, len = array.length; idx < len; idx++) {
        if (array[idx]) { aResult.push(array[idx]); }
    }
    return aResult;
}

/**
 * Produces a duplicate-free version of the array.
 */
function unique<T>(array: T[]): T[] {
    const results = [];

    for (let idx = 0, len = array.length; idx < len; idx++) {
        if (!contains(results, array[idx])) {
            results.push(array[idx]);
        }
    }

    return results;
}

/**
 * Returns next item.
 */
function next<T>(array: T[], item: T): T | null {
    if (array && array.length && item) {
        const idx = array.indexOf(item);
        return idx === -1 ? null : array[idx + 1];
    }
    return null;
}

/**
 * Returns prev item.
 */
function prev<T>(array: T[], item: T): T | null {
    if (array && array.length && item) {
        const idx = array.indexOf(item);
        return idx === -1 ? null : array[idx - 1];
    }
    return null;
}

/**
 * @class core.list
 *
 * list utils
 *
 * @singleton
 * @alternateClassName list
 */
export default {
    head,
    last,
    initial,
    tail,
    prev,
    next,
    find,
    contains,
    all,
    sum,
    from,
    isEmpty,
    clusterBy,
    compact,
    unique,
};
