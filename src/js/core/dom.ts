import func from './func';
import lists from './lists';
import env from './env';
import { BoundaryPoint } from "./types";

const NBSP_CHAR = String.fromCharCode(160);
const ZERO_WIDTH_NBSP_CHAR = '\ufeff';

/**
 * Returns whether node is `note-editable` or not.
 */
function isEditable(node: Node) {
    return node && node instanceof Element && node.classList.contains('note-editable');
}

/**
 * Returns whether node is `note-control-sizing` or not.
 */
function isControlSizing(node: Node) {
    return node && node instanceof Element && node.classList.contains('note-control-sizing');
}

/**
 * Returns predicate which judge whether nodeName is same.
 */
function makePredByNodeName(nodeName: string): (node: Node) => boolean {
    nodeName = nodeName.toUpperCase();
    return (node) => node && node.nodeName.toUpperCase() === nodeName;
}

/**
 * Returns true if the passed node is a text node.
 */
function isText(node: Node) {
    return node && node.nodeType === 3;
}

/**
 Returns true if the passed node is an element node.
 */
function isElement(node: Node) {
    return node && node.nodeType === 1;
}

/**
 * Returns true if the passed node is a void element.
 *
 * @see http://www.w3.org/html/wg/drafts/html/master/syntax.html#void-elements
 */
function isVoid(node: Node) {
    return node && /^BR|^IMG|^HR|^IFRAME|^BUTTON|^INPUT|^AUDIO|^VIDEO|^EMBED/.test(node.nodeName.toUpperCase());
}

function isPara(node: Node) {
    if (isEditable(node)) {
        return false;
    }

    // Chrome(v31.0), FF(v25.0.1) use DIV for paragraph
    return node && /^DIV|^P|^LI|^H[1-7]/.test(node.nodeName.toUpperCase());
}

function isHeading(node: Node) {
    return node && /^H[1-7]/.test(node.nodeName.toUpperCase());
}

const isPre = makePredByNodeName('PRE');

const isLi = makePredByNodeName('LI');

function isPurePara(node: Node) {
    return isPara(node) && !isLi(node);
}

const isTable = makePredByNodeName('TABLE');

const isData = makePredByNodeName('DATA');

function isInline(node: Node) {
    return !isBodyContainer(node) &&
        !isList(node) &&
        !isHr(node) &&
        !isPara(node) &&
        !isTable(node) &&
        !isBlockquote(node) &&
        !isData(node);
}

function isList(node: Node) {
    return node && /^UL|^OL/.test(node.nodeName.toUpperCase());
}

const isHr = makePredByNodeName('HR');

function isCell(node: Node) {
    return node && /^TD|^TH/.test(node.nodeName.toUpperCase());
}

const isBlockquote = makePredByNodeName('BLOCKQUOTE');

function isBodyContainer(node: Node) {
    return isCell(node) || isBlockquote(node) || isEditable(node);
}

const isAnchor = makePredByNodeName('A');

function isParaInline(node: Node) {
    return isInline(node) && !!ancestor(node, isPara);
}

function isBodyInline(node: Node) {
    return isInline(node) && !!ancestor(node, isPara);
}

const isBody = makePredByNodeName('BODY');

/**
 * Returns whether nodeB is the closest sibling of nodeA.
 */
function isClosestSibling(nodeA: Node, nodeB: Node): boolean {
    return nodeA.nextSibling === nodeB || nodeA.previousSibling === nodeB;
}

/**
 * Returns array of the closest siblings with node.
 */
function withClosestSiblings(node: Node, pred: (node: Node) => boolean): Node[] {
    pred = pred || func.ok;

    const siblings: Node[] = [];
    if (node.previousSibling && pred(node.previousSibling)) {
        siblings.push(node.previousSibling);
    }
    siblings.push(node);
    if (node.nextSibling && pred(node.nextSibling)) {
        siblings.push(node.nextSibling);
    }
    return siblings;
}

/**
 * blank HTML for cursor position
 * - [workaround] old IE only works with &nbsp;
 * - [workaround] IE11 and other browser works with bogus br
 */
const blankHTML = env.isMSIE && env.browserVersion < 11 ? '&nbsp;' : '<br>';

/**
 * Returns #text's text size or element's childNodes size.
 */
function nodeLength(node: Node): number {
    if (isText(node)) {
        return node.nodeValue.length;
    }

    if (node) {
        return node.childNodes.length;
    }

    return 0;
}

/**
 * Returns whether deepest child node is empty or not.
 */
function deepestChildIsEmpty(node: Node): boolean {
    do {
        if (!(node instanceof Element) || node.firstElementChild === null || node.firstElementChild.innerHTML === '') {
            break;
        }
    } while ((node = node.firstElementChild));

    return isEmpty(node);
}

/**
 * Returns whether node is empty or not.
 *
 * @param {Node} node
 * @return {Boolean}
 */
function isEmpty(node: Node): boolean {
    const len = nodeLength(node);

    if (len === 0) {
        return true;
    } else if (!isText(node) && len === 1 && node instanceof Element && node.innerHTML === blankHTML) {
        // ex) <p><br></p>, <span><br></span>
        return true;
    } else if (lists.all(lists.from(node.childNodes), isText) && node instanceof Element && node.innerHTML === '') {
        // ex) <p></p>, <span></span>
        return true;
    }

    return false;
}

/**
 * Padding blankHTML if node is empty (for cursor position).
 */
function paddingBlankHTML(node: Node) {
    if (!isVoid(node) && !nodeLength(node) && node instanceof Element) {
        node.innerHTML = blankHTML;
    }
}

/**
 * Find the nearest ancestor predicate hit.
 */
function ancestor(node: Node, pred: (node: Node) => boolean) {
    while (node) {
        if (pred(node)) { return node; }
        if (isEditable(node)) { break; }

        node = node.parentNode;
    }
    return null;
}

/**
 * Find the nearest ancestor only single child bloodline and predicate hit.
 */
function singleChildAncestor(node: Node, pred: (node: Node) => boolean) {
    node = node.parentNode;

    while (node) {
        if (nodeLength(node) !== 1) { break; }
        if (pred(node)) { return node; }
        if (isEditable(node)) { break; }

        node = node.parentNode;
    }
    return null;
}

/**
 * returns new array of ancestor nodes (until predicate hit).
 */
function listAncestor(node: Node, pred?: (node: Node) => boolean) {
    pred = pred || func.fail;

    const ancestors: Node[] = [];
    ancestor(node, function(el) {
        if (!isEditable(el)) {
            ancestors.push(el);
        }

        return pred(el);
    });
    return ancestors;
}

/**
 * Find the farthest ancestor predicate hit.
 */
function lastAncestor(node: Node, pred: (node: Node) => boolean) {
    const ancestors = listAncestor(node);
    return lists.last(ancestors.filter(pred));
}

/**
 * Returns common ancestor node between two nodes.
 */
function commonAncestor(nodeA: Node, nodeB: Node) {
    const ancestors = listAncestor(nodeA);
    for (let n = nodeB; n; n = n.parentNode) {
        if (ancestors.indexOf(n) > -1) return n;
    }
    return null; // difference document area
}

/**
 * listing all previous siblings (until predicate hit).
 */
function listPrev(node: Node, pred?: (node: Node) => boolean) {
    pred = pred || func.fail;

    const nodes = [];
    while (node) {
        if (pred(node)) { break; }
        nodes.push(node);
        node = node.previousSibling;
    }
    return nodes;
}

/**
 * Listing next siblings (until predicate hit).
 */
function listNext(node: Node, pred?: (node: Node) => boolean) {
    pred = pred || func.fail;

    const nodes = [];
    while (node) {
        if (pred(node)) { break; }
        nodes.push(node);
        node = node.nextSibling;
    }
    return nodes;
}

/**
 * Listing descendant nodes.
 */
function listDescendant(node: Node, pred?: (node: Node) => boolean) {
    const descendants = [];
    pred = pred || func.ok;

    // start DFS(depth first search) with node
    (function fnWalk(current) {
        if (node !== current && pred(current)) {
            descendants.push(current);
        }
        for (let idx = 0, len = current.childNodes.length; idx < len; idx++) {
            fnWalk(current.childNodes[idx]);
        }
    })(node);

    return descendants;
}

/**
 * Wrap node with new tag.
 */
function wrap(node: Node, wrapperName: string): Node {
    const parent = node.parentNode;
    const wrapper = document.createElement(wrapperName.toLowerCase());

    parent.insertBefore(wrapper, node);
    wrapper.appendChild(node);

    return wrapper;
}

/**
 * Insert node after preceding.
 */
function insertAfter(node: Node, preceding: Node) {
    const next = preceding.nextSibling;
    const parent = preceding.parentNode;
    if (next) {
        parent.insertBefore(node, next);
    } else {
        parent.appendChild(node);
    }
    return node;
}

/**
 * Append elements.
 */
function appendChildNodes(node: Node, aChild: Node[]) {
    aChild.forEach((child) => {
        node.appendChild(child);
    });
    return node;
}

/**
 * Returns whether boundaryPoint is left edge or not.
 */
function isLeftEdgePoint(point: BoundaryPoint): boolean {
    return point.offset === 0;
}

/**
 * Returns whether boundaryPoint is right edge or not.
 */
function isRightEdgePoint(point: BoundaryPoint): boolean {
    return point.offset === nodeLength(point.node);
}

/**
 * Returns whether boundaryPoint is edge or not.
 */
function isEdgePoint(point: BoundaryPoint): boolean {
    return isLeftEdgePoint(point) || isRightEdgePoint(point);
}

/**
 * Returns whether node is left edge of ancestor or not.
 */
function isLeftEdgeOf(node: Node, ancestor: Node): boolean {
    while (node && node !== ancestor) {
        if (position(node) !== 0) {
            return false;
        }
        node = node.parentNode;
    }

    return true;
}

/**
 * Returns whether node is right edge of ancestor or not.
 */
function isRightEdgeOf(node: Node, ancestor: Node): boolean {
    if (!ancestor) {
        return false;
    }
    while (node && node !== ancestor) {
        if (position(node) !== nodeLength(node.parentNode) - 1) {
            return false;
        }
        node = node.parentNode;
    }

    return true;
}

/**
 * Returns whether point is left edge of ancestor or not.
 */
function isLeftEdgePointOf(point: BoundaryPoint, ancestor: Node): boolean {
    return isLeftEdgePoint(point) && isLeftEdgeOf(point.node, ancestor);
}

/**
 * Returns whether point is right edge of ancestor or not.
 */
function isRightEdgePointOf(point: BoundaryPoint, ancestor: Node): boolean {
    return isRightEdgePoint(point) && isRightEdgeOf(point.node, ancestor);
}

/**
 * Returns offset from parent.
 */
function position(node: Node): number {
    let offset = 0;
    while ((node = node.previousSibling)) {
        offset += 1;
    }
    return offset;
}

function hasChildren(node: Node) {
    return !!(node && node.childNodes && node.childNodes.length);
}

/**
 * Returns previous boundaryPoint.
 */
function prevPoint(point: BoundaryPoint, isSkipInnerOffset = false): BoundaryPoint {
    let node;
    let offset;

    if (point.offset === 0) {
        if (isEditable(point.node)) {
            return null;
        }

        node = point.node.parentNode;
        offset = position(point.node);
    } else if (hasChildren(point.node)) {
        node = point.node.childNodes[point.offset - 1];
        offset = nodeLength(node);
    } else {
        node = point.node;
        offset = isSkipInnerOffset ? 0 : point.offset - 1;
    }

    return {
        node: node,
        offset: offset,
    };
}

/**
 * Returns next boundaryPoint.
 */
function nextPoint(point: BoundaryPoint, isSkipInnerOffset = false): BoundaryPoint {
    let node, offset;

    if (nodeLength(point.node) === point.offset) {
        if (isEditable(point.node)) {
            return null;
        }

        const nextTextNode = getNextTextNode(point.node);
        if (nextTextNode) {
            node = nextTextNode;
            offset = 0;
        } else {
            node = point.node.parentNode;
            offset = position(point.node) + 1;
        }
    } else if (hasChildren(point.node)) {
        node = point.node.childNodes[point.offset];
        offset = 0;
    } else {
        node = point.node;
        offset = isSkipInnerOffset ? nodeLength(point.node) : point.offset + 1;
    }

    return {
        node: node,
        offset: offset,
    };
}

/**
 * Returns next boundaryPoint with empty node.
 */
function nextPointWithEmptyNode(point: BoundaryPoint, isSkipInnerOffset = false): BoundaryPoint {
    let node, offset = 0;

    // if node is empty string node, return current node's sibling.
    if (isEmpty(point.node)) {
        if(point.node === null){
            return null;
        }

        node = point.node.nextSibling;
        offset = 0;

        return {
            node: node,
            offset: offset,
        };
    }

    if (nodeLength(point.node) === point.offset) {
        if (isEditable(point.node)) {
            return null;
        }

        node = point.node.parentNode;
        offset = position(point.node) + 1;

        // if next node is editable ,  return current node's sibling node.
        if (isEditable(node)) {
            node = point.node.nextSibling;
            offset = 0;
        }

    } else if (hasChildren(point.node)) {
        node = point.node.childNodes[point.offset];
        offset = 0;
        if (isEmpty(node)) {
            if (!isEmpty(point.node.nextSibling)) {
                return {
                    node: point.node.nextSibling,
                    offset: offset,
                };
            }
            return null;
        }
    } else {
        node = point.node;
        offset = isSkipInnerOffset ? nodeLength(point.node) : point.offset + 1;

        if (isEmpty(node)) {
            return null;
        }
    }

    return {
        node: node,
        offset: offset,
    };
}

/*
 * Returns the next Text node index or 0 if not found.
 */
function getNextTextNode(actual: Node): Node {
    if(!actual.nextSibling) {
        return undefined;
    }

    if(isText(actual.nextSibling) ) {
        return actual.nextSibling;
    } else {
        return getNextTextNode(actual.nextSibling);
    }
}

/**
 * Returns whether pointA and pointB is same or not.
 */
function isSamePoint(pointA: BoundaryPoint, pointB: BoundaryPoint): boolean {
    return pointA.node === pointB.node && pointA.offset === pointB.offset;
}

/**
 * Returns whether point is visible (can set cursor) or not.
 */
function isVisiblePoint(point: BoundaryPoint): boolean {
    if (isText(point.node) || !hasChildren(point.node) || isEmpty(point.node)) {
        return true;
    }

    const leftNode = point.node.childNodes[point.offset - 1];
    const rightNode = point.node.childNodes[point.offset];

    return (!leftNode || isVoid(leftNode)) && (!rightNode || isVoid(rightNode)) || isTable(rightNode);
}

function prevPointUntil(point: BoundaryPoint, pred: (point: BoundaryPoint) => boolean): BoundaryPoint | null {
    while (point) {
        if (pred(point)) {
            return point;
        }

        point = prevPoint(point);
    }

    return null;
}

function nextPointUntil(point: BoundaryPoint, pred: (point: BoundaryPoint) => boolean): BoundaryPoint | null {
    while (point) {
        if (pred(point)) {
            return point;
        }

        point = nextPoint(point);
    }

    return null;
}

/**
 * Returns whether point has character or not.
 */
function isCharPoint(point: BoundaryPoint): boolean {
    if (!isText(point.node)) {
        return false;
    }

    const ch = point.node.nodeValue.charAt(point.offset - 1);
    return ch && (ch !== ' ' && ch !== NBSP_CHAR);
}

/**
 * Returns whether point has space or not.
 */
function isSpacePoint(point: BoundaryPoint): boolean {
    if (!isText(point.node)) {
        return false;
    }

    const ch = point.node.nodeValue.charAt(point.offset - 1);
    return ch === ' ' || ch === NBSP_CHAR;
}

function walkPoint(
    startPoint: BoundaryPoint,
    endPoint: BoundaryPoint,
    handler: (point: BoundaryPoint) => any,
    isSkipInnerOffset = false,
) {
    let point = startPoint;

    while (point) {
        handler(point);

        if (isSamePoint(point, endPoint)) {
            break;
        }

        const isSkipOffset = isSkipInnerOffset &&
            startPoint.node !== point.node &&
            endPoint.node !== point.node;
        point = nextPointWithEmptyNode(point, isSkipOffset);
    }
}

/**
 * Return offsetPath(array of offset) from ancestor.
 */
function makeOffsetPath(ancestor: Node, node: Node): number[] {
    const ancestors = listAncestor(node, func.eq(ancestor));
    return ancestors.map(position).reverse();
}

/**
 * Return element from offsetPath(array of offset).
 */
function fromOffsetPath(ancestor: Node, offsets: number[]): Node {
    let current = ancestor;
    for (let i = 0, len = offsets.length; i < len; i++) {
        if (current.childNodes.length <= offsets[i]) {
            current = current.childNodes[current.childNodes.length - 1];
        } else {
            current = current.childNodes[offsets[i]];
        }
    }
    return current;
}

/**
 * Split element or #text.
 *
 * @return {Node} right node of boundaryPoint
 */
function splitNode(point: BoundaryPoint, options: {
    isSkipPaddingBlankHTML?: boolean,
    isNotSplitEdgePoint?: boolean,
    isDiscardEmptySplits?: boolean,
}): Node {
    let isSkipPaddingBlankHTML = options && options.isSkipPaddingBlankHTML;
    const isNotSplitEdgePoint = options && options.isNotSplitEdgePoint;
    const isDiscardEmptySplits = options && options.isDiscardEmptySplits;

    if (isDiscardEmptySplits) {
        isSkipPaddingBlankHTML = true;
    }

    // edge case
    if (isEdgePoint(point) && (isText(point.node) || isNotSplitEdgePoint)) {
        if (isLeftEdgePoint(point)) {
            return point.node;
        } else if (isRightEdgePoint(point)) {
            return point.node.nextSibling;
        }
    }

    // split #text
    if (isText(point.node) && point.node instanceof Text) {
        return point.node.splitText(point.offset);
    } else {
        const childNode = point.node.childNodes[point.offset];
        const clone = insertAfter(point.node.cloneNode(false), point.node);
        appendChildNodes(clone, listNext(childNode));

        if (!isSkipPaddingBlankHTML) {
            paddingBlankHTML(point.node);
            paddingBlankHTML(clone);
        }

        if (isDiscardEmptySplits) {
            if (isEmpty(point.node)) {
                remove(point.node);
            }
            if (isEmpty(clone)) {
                remove(clone);
                return point.node.nextSibling;
            }
        }

        return clone;
    }
}

/**
 * Split tree by point.
 *
 * @return {Node} right node of boundaryPoint
 */
function splitTree(root: Node, point: BoundaryPoint, options?: {
    isSkipPaddingBlankHTML?: boolean,
    isNotSplitEdgePoint?: boolean,
    isDiscardEmptySplits?: boolean,
}): Node {
    // ex) [#text, <span>, <p>]
    let ancestors = listAncestor(point.node, func.eq(root));

    if (!ancestors.length) {
        return null;
    } else if (ancestors.length === 1) {
        return splitNode(point, options);
    }
    // Filter elements with sibling elements
    if (ancestors.length > 2) {
        const domList = ancestors.slice(0, ancestors.length - 1);
        const ifHasNextSibling = domList.find(item => item.nextSibling);
        if (ifHasNextSibling && point.offset != 0 && isRightEdgePoint(point)) {
            const nestSibling = ifHasNextSibling.nextSibling;
            let textNode;
            if (nestSibling.nodeType == 1) {
                textNode = nestSibling.childNodes[0];
                ancestors = listAncestor(textNode, func.eq(root));
                point = {
                    node: textNode,
                    offset: 0,
                };
            }
            else if (nestSibling.nodeType == 3 && nestSibling instanceof Text && !nestSibling.data.match(/[\n\r]/g)) {
                textNode = nestSibling;
                ancestors = listAncestor(textNode, func.eq(root));
                point = {
                    node: textNode,
                    offset: 0,
                };
            }
        }
    }
    return ancestors.reduce(function(node, parent) {
        if (node === point.node) {
            node = splitNode(point, options);
        }

        return splitNode({
            node: parent,
            offset: node ? position(node) : nodeLength(parent),
        }, options);
    });
}

/**
 * Split point.
 */
function splitPoint(point: BoundaryPoint, isInline: boolean): {rightNode: Node; container: Node} {
    // find splitRoot, container
    //  - inline: splitRoot is a child of paragraph
    //  - block: splitRoot is a child of bodyContainer
    const pred = isInline ? isPara : isBodyContainer;
    const ancestors = listAncestor(point.node, pred);
    const topAncestor = lists.last(ancestors) || point.node;

    let splitRoot: Node, container;
    if (pred(topAncestor)) {
        splitRoot = ancestors[ancestors.length - 2];
        container = topAncestor;
    } else {
        splitRoot = topAncestor;
        container = splitRoot.parentNode;
    }

    // if splitRoot is exists, split with splitTree
    let pivot = splitRoot && splitTree(splitRoot, point, {
        isSkipPaddingBlankHTML: isInline,
        isNotSplitEdgePoint: isInline,
    });

    // if container is point.node, find pivot with point.offset
    if (!pivot && container === point.node) {
        pivot = point.node.childNodes[point.offset];
    }

    return {
        rightNode: pivot,
        container: container,
    };
}

function create(nodeName: string) {
    return document.createElement(nodeName);
}

function createText(text: string) {
    return document.createTextNode(text);
}

/**
 * Remove node, (isRemoveChild: remove child or not).
 */
function remove(node: Node, isRemoveChild = false): void {
    if (!node || !node.parentNode) {
        return;
    }

    const parent = node.parentNode;
    if (!isRemoveChild) {
        const nodes = [];
        for (let i = 0, len = node.childNodes.length; i < len; i++) {
            nodes.push(node.childNodes[i]);
        }

        for (let i = 0, len = nodes.length; i < len; i++) {
            parent.insertBefore(nodes[i], node);
        }
    }

    parent.removeChild(node);
}

function removeWhile(node: Node, pred: (node: Node) => boolean): void {
    while (node) {
        if (isEditable(node) || !pred(node)) {
            break;
        }

        const parent = node.parentNode;
        remove(node);
        node = parent;
    }
}

/**
 * Replace node with provided nodeName.
 */
function replace(node: Node, nodeName: string): Node {
    if (node.nodeName.toUpperCase() === nodeName.toUpperCase()) {
        return node;
    }

    const newNode = create(nodeName);

    if (node instanceof HTMLElement && node.style.cssText) {
        newNode.style.cssText = node.style.cssText;
    }

    appendChildNodes(newNode, lists.from(node.childNodes));
    insertAfter(newNode, node);
    remove(node);

    return newNode;
}

const isTextarea = makePredByNodeName('TEXTAREA');

function value(node: Element, stripLinebreaks = false): string {
    const val = isTextarea(node) && node instanceof HTMLTextAreaElement ? node.value : node.innerHTML;
    if (stripLinebreaks) {
        return val.replace(/[\n\r]/g, '');
    }
    return val;
}

/**
 * Get the HTML contents of node.
 */
function html(node: Element, isNewlineOnBlock = false): string {
    let markup = value(node);

    if (isNewlineOnBlock) {
        const regexTag = /<(\/?)(\b(?!!)[^>\s]*)(.*?)(\s*\/?>)/g;
        markup = markup.replace(regexTag, function(match, endSlash, name) {
            name = name.toUpperCase();
            const isEndOfInlineContainer = /^DIV|^TD|^TH|^P|^LI|^H[1-7]/.test(name) &&
                !!endSlash;
            const isBlockNode = /^BLOCKQUOTE|^TABLE|^TBODY|^TR|^HR|^UL|^OL/.test(name);

            return match + ((isEndOfInlineContainer || isBlockNode) ? '\n' : '');
        });
        markup = markup.trim();
    }

    return markup;
}

function posFromPlaceholder(placeholderEl: HTMLElement) {
    const offset = func.getElementOffset(placeholderEl);
    const height = placeholderEl.offsetHeight;

    return {
        left: offset.left,
        top: offset.top + height,
    };
}

function attachEvents(nodeEl: Node, events: {[eventName: string]: () => any}): void {
    Object.keys(events).forEach(function(key) {
        key.trim().replace(/ +/, ' ').split(' ').forEach((type) => {
            nodeEl.addEventListener(type, events[key]);
        });
    });
}

function detachEvents(nodeEl: Node, events: {[eventName: string]: () => any}): void {
    Object.keys(events).forEach(function(key) {
        key.trim().replace(/ +/, ' ').split(' ').forEach((type) => {
            nodeEl.removeEventListener(type, events[key]);
        });
    });
}

/**
 * Assert if a node contains a "note-styletag" class, which implies that's a custom-made style tag node.
 */
function isCustomStyleTag(node: Node) {
    return node && !isText(node) && node instanceof Element && lists.contains(node.classList, 'note-styletag');
}

export default {
    /** @property {String} NBSP_CHAR */
    NBSP_CHAR,
    /** @property {String} ZERO_WIDTH_NBSP_CHAR */
    ZERO_WIDTH_NBSP_CHAR,
    /** @property {String} blank */
    blank: blankHTML,
    /** @property {String} emptyPara */
    emptyPara: `<p>${blankHTML}</p>`,
    makePredByNodeName,
    isEditable,
    isControlSizing,
    isText,
    isElement,
    isVoid,
    isPara,
    isPurePara,
    isHeading,
    isInline,
    isBlock: func.not(isInline),
    isBodyInline,
    isBody,
    isParaInline,
    isPre,
    isList,
    isTable,
    isData,
    isCell,
    isBlockquote,
    isBodyContainer,
    isAnchor,
    isDiv: makePredByNodeName('DIV'),
    isLi,
    isBR: makePredByNodeName('BR'),
    isSpan: makePredByNodeName('SPAN'),
    isB: makePredByNodeName('B'),
    isU: makePredByNodeName('U'),
    isS: makePredByNodeName('S'),
    isI: makePredByNodeName('I'),
    isImg: makePredByNodeName('IMG'),
    isTextarea,
    deepestChildIsEmpty,
    isEmpty,
    isEmptyAnchor: func.and(isAnchor, isEmpty),
    isClosestSibling,
    withClosestSiblings,
    nodeLength,
    isLeftEdgePoint,
    isRightEdgePoint,
    isEdgePoint,
    isLeftEdgeOf,
    isRightEdgeOf,
    isLeftEdgePointOf,
    isRightEdgePointOf,
    prevPoint,
    nextPoint,
    nextPointWithEmptyNode,
    isSamePoint,
    isVisiblePoint,
    prevPointUntil,
    nextPointUntil,
    isCharPoint,
    isSpacePoint,
    walkPoint,
    ancestor,
    singleChildAncestor,
    listAncestor,
    lastAncestor,
    listNext,
    listPrev,
    listDescendant,
    commonAncestor,
    wrap,
    insertAfter,
    appendChildNodes,
    position,
    hasChildren,
    makeOffsetPath,
    fromOffsetPath,
    splitTree,
    splitPoint,
    create,
    createText,
    remove,
    removeWhile,
    replace,
    html,
    value,
    posFromPlaceholder,
    attachEvents,
    detachEvents,
    isCustomStyleTag,
};
