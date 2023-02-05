import func from './func';
import lists from './lists';
import dom from './dom';
import { Bookmark, BoundaryPoint } from "./types";

/**
 * Wrapped Range.
 */
export class WrappedRange {
    sc: Node;

    so: number;

    ec: Node;

    eo: number;

    constructor(sc: Node, so: number, ec: Node, eo: number) {
        this.sc = sc;
        this.so = so;
        this.ec = ec;
        this.eo = eo;
    }

    // isOnEditable: judge whether range is on editable or not
    isOnEditable = this.makeIsOn(dom.isEditable);

    // isOnList: judge whether range is on list node or not
    isOnList = this.makeIsOn(dom.isList);

    // isOnAnchor: judge whether range is on anchor node or not
    isOnAnchor = this.makeIsOn(dom.isAnchor);

    // isOnCell: judge whether range is on cell node or not
    isOnCell = this.makeIsOn(dom.isCell);

    // isOnData: judge whether range is on data node or not
    isOnData = this.makeIsOn(dom.isData);

    // nativeRange: get nativeRange from sc, so, ec, eo
    nativeRange(): Range {
        const w3cRange = document.createRange();
        w3cRange.setStart(this.sc, this.so);
        w3cRange.setEnd(this.ec, this.eo);

        return w3cRange;
    }

    getPoints() {
        return {
            sc: this.sc,
            so: this.so,
            ec: this.ec,
            eo: this.eo,
        };
    }

    getStartPoint() {
        return {
            node: this.sc,
            offset: this.so,
        };
    }

    getEndPoint() {
        return {
            node: this.ec,
            offset: this.eo,
        };
    }

    /**
     * select update visible range
     */
    select() {
        const nativeRng = this.nativeRange();

        const selection = document.getSelection();
        if (selection.rangeCount > 0) {
            selection.removeAllRanges();
        }
        selection.addRange(nativeRng);

        return this;
    }

    /**
     * Moves the scrollbar to start container(sc) of current range.
     */
    scrollIntoView(container: HTMLElement): WrappedRange {
        const containerStyle = getComputedStyle(container);
        const containerPaddingY = parseFloat(containerStyle.paddingTop) + parseFloat(containerStyle.paddingBottom);
        const height = container.offsetHeight - containerPaddingY;
        if (this.sc instanceof HTMLElement && container.scrollTop + height < this.sc.offsetTop) {
            container.scrollTop += Math.abs(container.scrollTop + height - this.sc.offsetTop);
        }

        return this;
    }

    normalize(): WrappedRange {
        /**
         * @param {BoundaryPoint} point
         * @param {Boolean} isLeftToRight - true: prefer to choose right node
         *                                - false: prefer to choose left node
         * @return {BoundaryPoint}
         */
        const getVisiblePoint = function(point: BoundaryPoint, isLeftToRight: boolean): BoundaryPoint {
            if (!point) {
                return point;
            }

            // Just use the given point [XXX:Adhoc]
            //  - case 01. if the point is in the middle of the node
            //  - case 02. if the point is on the right edge and prefer to choose left node
            //  - case 03. if the point is on the left edge and prefer to choose right node
            //  - case 04. if the point is on the right edge and prefer to choose right node but the node is void
            //  - case 05. if the point is on the left edge and prefer to choose left node but the node is void
            //  - case 06. if the point is on the block node and there is no children
            if (dom.isVisiblePoint(point)) {
                if (!dom.isEdgePoint(point) ||
                    (dom.isRightEdgePoint(point) && !isLeftToRight) ||
                    (dom.isLeftEdgePoint(point) && isLeftToRight) ||
                    (dom.isRightEdgePoint(point) && isLeftToRight && dom.isVoid(point.node.nextSibling)) ||
                    (dom.isLeftEdgePoint(point) && !isLeftToRight && dom.isVoid(point.node.previousSibling)) ||
                    (dom.isBlock(point.node) && dom.isEmpty(point.node))) {
                    return point;
                }
            }

            // point on block's edge
            const block = dom.ancestor(point.node, dom.isBlock);
            let hasRightNode = false;

            if (!hasRightNode) {
                const prevPoint = dom.prevPoint(point) || {node: null} as BoundaryPoint;
                hasRightNode = (dom.isLeftEdgePointOf(point, block) || dom.isVoid(prevPoint.node)) && !isLeftToRight;
            }

            let hasLeftNode = false;
            if (!hasLeftNode) {
                const nextPoint = dom.nextPoint(point) || {node: null} as BoundaryPoint;
                hasLeftNode = (dom.isRightEdgePointOf(point, block) || dom.isVoid(nextPoint.node)) && isLeftToRight;
            }

            if (hasRightNode || hasLeftNode) {
                // returns point already on visible point
                if (dom.isVisiblePoint(point)) {
                    return point;
                }
                // reverse direction
                isLeftToRight = !isLeftToRight;
            }

            const nextPoint = isLeftToRight ? dom.nextPointUntil(dom.nextPoint(point), dom.isVisiblePoint)
                : dom.prevPointUntil(dom.prevPoint(point), dom.isVisiblePoint);
            return nextPoint || point;
        };

        const endPoint = getVisiblePoint(this.getEndPoint(), false);
        const startPoint = this.isCollapsed() ? endPoint : getVisiblePoint(this.getStartPoint(), true);

        return new WrappedRange(
            startPoint.node,
            startPoint.offset,
            endPoint.node,
            endPoint.offset
        );
    }

    /**
     * Returns matched nodes on range.
     */
    nodes(pred?: (node: Node) => boolean, options?: {
        includeAncestor?: boolean;
        fullyContains?: boolean;
    }): Node[] {
        pred = pred || func.ok;

        const includeAncestor = options && options.includeAncestor;
        const fullyContains = options && options.fullyContains;

        // TODO compare points and sort
        const startPoint = this.getStartPoint();
        const endPoint = this.getEndPoint();

        const nodes: Node[] = [];
        const leftEdgeNodes: Node[] = [];

        dom.walkPoint(startPoint, endPoint, function(point) {
            if (dom.isEditable(point.node)) {
                return;
            }

            let node;
            if (fullyContains) {
                if (dom.isLeftEdgePoint(point)) {
                    leftEdgeNodes.push(point.node);
                }
                if (dom.isRightEdgePoint(point) && lists.contains(leftEdgeNodes, point.node)) {
                    node = point.node;
                }
            } else if (includeAncestor) {
                node = dom.ancestor(point.node, pred);
            } else {
                node = point.node;
            }

            if (node && pred(node)) {
                nodes.push(node);
            }
        }, true);

        return lists.unique(nodes);
    }

    /**
     * Returns commonAncestor of range.
     */
    commonAncestor(): Node {
        return dom.commonAncestor(this.sc, this.ec);
    }

    /**
     * Returns expanded range by pred.
     */
    expand(pred: (node: Node) => boolean) {
        const startAncestor = dom.ancestor(this.sc, pred);
        const endAncestor = dom.ancestor(this.ec, pred);

        if (!startAncestor && !endAncestor) {
            return new WrappedRange(this.sc, this.so, this.ec, this.eo);
        }

        const boundaryPoints = this.getPoints();

        if (startAncestor) {
            boundaryPoints.sc = startAncestor;
            boundaryPoints.so = 0;
        }

        if (endAncestor) {
            boundaryPoints.ec = endAncestor;
            boundaryPoints.eo = dom.nodeLength(endAncestor);
        }

        return new WrappedRange(
            boundaryPoints.sc,
            boundaryPoints.so,
            boundaryPoints.ec,
            boundaryPoints.eo
        );
    }

    collapse(isCollapseToStart = false): WrappedRange {
        if (isCollapseToStart) {
            return new WrappedRange(this.sc, this.so, this.sc, this.so);
        } else {
            return new WrappedRange(this.ec, this.eo, this.ec, this.eo);
        }
    }

    /**
     * splitText on range
     */
    splitText() {
        const isSameContainer = this.sc === this.ec;
        const boundaryPoints = this.getPoints();

        if (dom.isText(this.ec) && this.ec instanceof Text && !dom.isEdgePoint(this.getEndPoint())) {
            this.ec.splitText(this.eo);
        }

        if (dom.isText(this.sc) && this.sc instanceof Text && !dom.isEdgePoint(this.getStartPoint())) {
            boundaryPoints.sc = this.sc.splitText(this.so);
            boundaryPoints.so = 0;

            if (isSameContainer) {
                boundaryPoints.ec = boundaryPoints.sc;
                boundaryPoints.eo = this.eo - this.so;
            }
        }

        return new WrappedRange(
            boundaryPoints.sc,
            boundaryPoints.so,
            boundaryPoints.ec,
            boundaryPoints.eo
        );
    }

    /**
     * Delete contents on range.
     */
    deleteContents(): WrappedRange {
        if (this.isCollapsed()) {
            return this;
        }

        const rng = this.splitText();
        const nodes = rng.nodes(null, {
            fullyContains: true,
        });

        // find new cursor point
        const point = dom.prevPointUntil(rng.getStartPoint(), function(point) {
            return !lists.contains(nodes, point.node);
        });

        const emptyParents: Node[] = [];
        nodes.forEach((node) => {
            // find empty parents
            const parent = node.parentNode;
            if (point.node !== parent && dom.nodeLength(parent) === 1) {
                emptyParents.push(parent);
            }
            dom.remove(node, false);
        });

        // remove empty parents
        emptyParents.forEach((node) => {
            dom.remove(node, false);
        });

        return new WrappedRange(
            point.node,
            point.offset,
            point.node,
            point.offset
        ).normalize();
    }

    /**
     * makeIsOn: return isOn(pred) function.
     */
    makeIsOn<T extends Node>(pred: (item: T) => boolean) {
        return () => {
            const ancestor = dom.ancestor(this.sc, pred);
            return !!ancestor && (ancestor === dom.ancestor(this.ec, pred));
        };
    }

    isLeftEdgeOf(pred: (node: Node) => boolean): boolean {
        if (!dom.isLeftEdgePoint(this.getStartPoint())) {
            return false;
        }

        const node = dom.ancestor(this.sc, pred);
        return node && dom.isLeftEdgeOf(this.sc, node);
    }

    /**
     * returns whether range was collapsed or not
     */
    isCollapsed() {
        return this.sc === this.ec && this.so === this.eo;
    }

    /**
     * Wrap inline nodes which children of body with paragraph.
     */
    wrapBodyInlineWithPara(): WrappedRange {
        if (dom.isBodyContainer(this.sc) && this.sc instanceof Element && dom.isEmpty(this.sc)) {
            this.sc.innerHTML = dom.emptyPara;
            return new WrappedRange(this.sc.firstChild, 0, this.sc.firstChild, 0);
        }

        /**
         * [workaround] firefox often create range on not visible point. so normalize here.
         *  - firefox: |<p>text</p>|
         *  - chrome: <p>|text|</p>
         */
        const rng = this.normalize();
        if (dom.isParaInline(this.sc) || dom.isPara(this.sc)) {
            return rng;
        }

        // find inline top ancestor
        let topAncestor;
        if (dom.isInline(rng.sc)) {
            const ancestors = dom.listAncestor(rng.sc, func.not(dom.isInline));
            topAncestor = lists.last(ancestors);
            if (!dom.isInline(topAncestor)) {
                topAncestor = ancestors[ancestors.length - 2] || rng.sc.childNodes[rng.so];
            }
        } else {
            topAncestor = rng.sc.childNodes[rng.so > 0 ? rng.so - 1 : 0];
        }

        if (topAncestor) {
            // siblings not in paragraph
            let inlineSiblings = dom.listPrev(topAncestor, dom.isParaInline).reverse();
            inlineSiblings = inlineSiblings.concat(dom.listNext(topAncestor.nextSibling, dom.isParaInline));

            // wrap with paragraph
            if (inlineSiblings.length) {
                const para = dom.wrap(lists.head(inlineSiblings), 'p');
                dom.appendChildNodes(para, lists.tail(inlineSiblings));
            }
        }

        return this.normalize();
    }

    /**
     * Insert node at current cursor.
     *
     * @param {Node} node
     * @param {Boolean} doNotInsertPara - default is false, removes added <p> that's added if true
     */
    insertNode(node: Node, doNotInsertPara = false): Node {
        let rng: WrappedRange = this;

        if (dom.isText(node) || dom.isInline(node)) {
            rng = this.wrapBodyInlineWithPara().deleteContents();
        }

        const info = dom.splitPoint(rng.getStartPoint(), dom.isInline(node));
        if (info.rightNode) {
            info.rightNode.parentNode.insertBefore(node, info.rightNode);
            if (dom.isEmpty(info.rightNode) && (doNotInsertPara || dom.isPara(node))) {
                info.rightNode.parentNode.removeChild(info.rightNode);
            }
        } else {
            info.container.appendChild(node);
        }

        return node;
    }

    /**
     * Insert html at current cursor.
     */
    pasteHTML(markup: string): Node[] {
        markup = markup.trim();

        const contentsContainer = document.createElement('div');
        contentsContainer.innerHTML = markup;
        let childNodes = lists.from(contentsContainer.childNodes);

        // const rng = this.wrapBodyInlineWithPara().deleteContents();
        const rng = this;
        let reversed = false;

        if (rng.so >= 0) {
            childNodes = childNodes.reverse();
            reversed = true;
        }

        childNodes = childNodes.map(function(childNode) {
            return rng.insertNode(childNode, !dom.isInline(childNode));
        });

        if (reversed) {
            childNodes = childNodes.reverse();
        }
        return childNodes;
    }

    /**
     * Returns text in range.
     */
    toString(): string {
        return this.nativeRange().toString();
    }

    /**
     * Returns range for word before cursor.
     *
     * @param findAfter - find after cursor, default: false.
     */
    getWordRange(findAfter = false): WrappedRange {
        let endPoint = this.getEndPoint();

        if (!dom.isCharPoint(endPoint)) {
            return this;
        }

        const startPoint = dom.prevPointUntil(endPoint, function(point) {
            return !dom.isCharPoint(point);
        });

        if (findAfter) {
            endPoint = dom.nextPointUntil(endPoint, function(point) {
                return !dom.isCharPoint(point);
            });
        }

        return new WrappedRange(
            startPoint.node,
            startPoint.offset,
            endPoint.node,
            endPoint.offset
        );
    }

    /**
     * Returns range for words before cursor.
     *
     * @param {Boolean} [findAfter] - find after cursor, default: false
     */
    getWordsRange(findAfter: boolean): WrappedRange {
        let endPoint = this.getEndPoint();

        const isNotTextPoint = function(point: BoundaryPoint) {
            return !dom.isCharPoint(point) && !dom.isSpacePoint(point);
        };

        if (isNotTextPoint(endPoint)) {
            return this;
        }

        const startPoint = dom.prevPointUntil(endPoint, isNotTextPoint);

        if (findAfter) {
            endPoint = dom.nextPointUntil(endPoint, isNotTextPoint);
        }

        return new WrappedRange(
            startPoint.node,
            startPoint.offset,
            endPoint.node,
            endPoint.offset
        );
    }

    /**
     * Returns range for words before cursor that match with a Regex.
     *
     * example:
     *  range: 'hi @Peter Pan'
     *  regex: '/@[a-z ]+/i'
     *  return range: '@Peter Pan'
     *
     * @param {RegExp} [regex]
     */
    getWordsMatchRange(regex: RegExp): WrappedRange | null {
        const endPoint = this.getEndPoint();

        const startPoint = dom.prevPointUntil(endPoint, function(point) {
            if (!dom.isCharPoint(point) && !dom.isSpacePoint(point)) {
                return true;
            }
            const rng = new WrappedRange(
                point.node,
                point.offset,
                endPoint.node,
                endPoint.offset
            );
            const result = regex.exec(rng.toString());
            return result && result.index === 0;
        });

        const rng = new WrappedRange(
            startPoint.node,
            startPoint.offset,
            endPoint.node,
            endPoint.offset
        );

        const text = rng.toString();
        const result = regex.exec(text);

        if (result && result[0].length === text.length) {
            return rng;
        } else {
            return null;
        }
    }

    /**
     * Create offsetPath bookmark.
     */
    bookmark(editable: Node) {
        return {
            s: {
                path: dom.makeOffsetPath(editable, this.sc),
                offset: this.so,
            },
            e: {
                path: dom.makeOffsetPath(editable, this.ec),
                offset: this.eo,
            },
        };
    }

    /**
     * Create offsetPath bookmark base on paragraph.
     */
    paraBookmark(paras: Node[]): Bookmark {
        return {
            s: {
                path: lists.tail(dom.makeOffsetPath(lists.head(paras), this.sc)),
                offset: this.so,
            },
            e: {
                path: lists.tail(dom.makeOffsetPath(lists.last(paras), this.ec)),
                offset: this.eo,
            },
        };
    }

    getClientRects(): DOMRect[] {
        const nativeRng = this.nativeRange();
        return [].slice.call(nativeRng.getClientRects());
    }
}

/**
 * Create Range Object From arguments or Browser Selection.
 *
 * @param sc - start container
 */
function create(sc: Node): WrappedRange;
/**
 * Create Range Object From arguments or Browser Selection.
 *
 * @param sc - start container
 * @param so - start offset
 */
function create(sc: Node, so: number): WrappedRange;
/**
 * Create Range Object From arguments or Browser Selection.
 *
 * @param sc - start container
 * @param so - start offset
 * @param ec - end container
 * @param eo - end offset
 */
function create(sc: Node, so: number, ec: Node, eo: number): WrappedRange;
function create(sc?: Node | HTMLElement, so?: number, ec?: Node, eo?: number): WrappedRange {
    if (arguments.length === 4) {
        return new WrappedRange(sc, so, ec, eo);
    } else if (arguments.length === 2) { // collapsed
        ec = sc;
        eo = so;
        return new WrappedRange(sc, so, ec, eo);
    } else {
        const wrappedRange = this.createFromSelection();

        if (!wrappedRange && arguments.length === 1) {
            let bodyElement = sc;
            if (dom.isEditable(bodyElement)) {
                bodyElement = bodyElement.lastChild;
            }
            return this.createFromBodyElement(bodyElement, sc instanceof Element && dom.emptyPara === sc.innerHTML);
        }
        return wrappedRange;
    }
}

/**
 * Data structure
 *  * BoundaryPoint: a point of dom tree
 *  * BoundaryPoints: two boundaryPoints corresponding to the start and the end of the Range
 *
 * See to http://www.w3.org/TR/DOM-Level-2-Traversal-Range/ranges.html#Level-2-Range-Position
 */
export default {
    create,

    createFromBodyElement: function(bodyElement: Node, isCollapseToStart = false) {
        const wrappedRange = this.createFromNode(bodyElement);
        return wrappedRange.collapse(isCollapseToStart);
    },

    createFromSelection: function() {
        const selection = document.getSelection();
        if (!selection || selection.rangeCount === 0) {
            return null;
        } else if (dom.isBody(selection.anchorNode)) {
            // Firefox: returns entire body as range on initialization.
            // We never need it.
            return null;
        }

        const nativeRng = selection.getRangeAt(0);
        const sc = nativeRng.startContainer;
        const so = nativeRng.startOffset;
        const ec = nativeRng.endContainer;
        const eo = nativeRng.endOffset;

        return new WrappedRange(sc, so, ec, eo);
    },

    /**
     * Create WrappedRange from node.
     */
    createFromNode: function(node: Node): WrappedRange {
        let sc = node;
        let so = 0;
        let ec = node;
        let eo = dom.nodeLength(ec);

        // browsers can't target a picture or void node
        if (dom.isVoid(sc)) {
            so = dom.listPrev(sc).length - 1;
            sc = sc.parentNode;
        }
        if (dom.isBR(ec)) {
            eo = dom.listPrev(ec).length - 1;
            ec = ec.parentNode;
        } else if (dom.isVoid(ec)) {
            eo = dom.listPrev(ec).length;
            ec = ec.parentNode;
        }

        return this.create(sc, so, ec, eo);
    },

    /**
     * Create WrappedRange from node after position.
     */
    createFromNodeBefore: function(node: Node): WrappedRange {
        return this.createFromNode(node).collapse(true);
    },

    /**
     * Create WrappedRange from node after position.
     */
    createFromNodeAfter: function(node: Node): WrappedRange {
        return this.createFromNode(node).collapse();
    },

    /**
     * Create WrappedRange from bookmark.
     */
    createFromBookmark: function(editable: Node, bookmark: Bookmark): WrappedRange {
        const sc = dom.fromOffsetPath(editable, bookmark.s.path);
        const so = bookmark.s.offset;
        const ec = dom.fromOffsetPath(editable, bookmark.e.path);
        const eo = bookmark.e.offset;
        return new WrappedRange(sc, so, ec, eo);
    },

    /**
     * Create WrappedRange from paraBookmark.
     */
    createFromParaBookmark: function(bookmark: Bookmark, paras: Node[]): WrappedRange {
        const so = bookmark.s.offset;
        const eo = bookmark.e.offset;
        const sc = dom.fromOffsetPath(lists.head(paras), bookmark.s.path);
        const ec = dom.fromOffsetPath(lists.last(paras), bookmark.e.path);

        return new WrappedRange(sc, so, ec, eo);
    },
};
