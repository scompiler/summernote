import func from '../core/func';
import lists from '../core/lists';
import dom from '../core/dom';
import { WrappedRange } from "../core/range";

export interface StyleInfo {
    'font-family'?: string;
    'font-size'?: string;
    'font-size-unit'?: string;
    'text-align'?: string;
    'list-style'?: string;
    'list-style-type'?: string;
    'line-height'?: string;
}

export interface CurrentStyleInfo extends StyleInfo {
    anchor: Node;
    ancestors: Node[];
    range: WrappedRange;
}

export default class Style {
    /**
     * [workaround] for old jQuery
     * passing an array of style properties to .css()
     * will result in an object of property-value pairs.
     * (compatibility with version < 1.9)
     *
     * @param objEl
     * @param propertyNames - An array of one or more CSS properties.
     */
    private jQueryCSS(objEl: HTMLElement, propertyNames: (keyof StyleInfo)[]): StyleInfo {
        const result: StyleInfo = {};
        const style = getComputedStyle(objEl);
        propertyNames.forEach((propertyName) => {
            result[propertyName] = style.getPropertyValue(propertyName);
        });
        return result;
    }

    /**
     * Returns style object from node.
     *
     * @param {HTMLElement} nodeEl
     * @return {Object}
     */
    fromNode(nodeEl: Node): StyleInfo {
        if (!(nodeEl instanceof HTMLElement)) {
            return {};
        }

        const styleInfo = this.jQueryCSS(nodeEl, [
            'font-family',
            'font-size',
            'text-align',
            'list-style-type',
            'line-height',
        ]) || {};

        const fontSize = nodeEl.style.fontSize || styleInfo['font-size'];

        styleInfo['font-size'] = parseInt(fontSize, 10).toString();
        styleInfo['font-size-unit'] = (fontSize.match(/[a-z%]+$/) || [''])[0];

        return styleInfo;
    }

    /**
     * Paragraph level style.
     */
    stylePara(rng: WrappedRange, styleInfo: CSSStyleDeclaration) {
        rng.nodes(dom.isPara, {
            includeAncestor: true,
        }).forEach((para: HTMLParagraphElement) => {
            for (const property in styleInfo) {
                para.style[property] = styleInfo[property];
            }
        });
    }

    /**
     * Insert and returns styleNodes on range.
     */
    styleNodes(rng: WrappedRange, options: {
        nodeName?: string;
        expandClosestSibling?: boolean;
        onlyPartialContains?: boolean;
    }): Node[] {
        rng = rng.splitText();

        const nodeName = (options && options.nodeName) || 'SPAN';
        const expandClosestSibling = !!(options && options.expandClosestSibling);
        const onlyPartialContains = !!(options && options.onlyPartialContains);

        if (rng.isCollapsed()) {
            return [rng.insertNode(dom.create(nodeName))];
        }

        let pred = dom.makePredByNodeName(nodeName);
        const nodes = rng.nodes(dom.isText, {
            fullyContains: true,
        }).map((text) => {
            return dom.singleChildAncestor(text, pred) || dom.wrap(text, nodeName);
        });

        if (expandClosestSibling) {
            if (onlyPartialContains) {
                const nodesInRange = rng.nodes();
                // compose with partial contains predication
                pred = func.and(pred, (node) => {
                    return lists.contains(nodesInRange, node);
                });
            }

            return nodes.map((node) => {
                const siblings = dom.withClosestSiblings(node, pred);
                const head = lists.head(siblings);
                const tails = lists.tail(siblings);
                tails.forEach((elem) => {
                    dom.appendChildNodes(head, lists.from(elem.childNodes));
                    dom.remove(elem);
                });
                return lists.head(siblings);
            });
        } else {
            return nodes;
        }
    }

    /**
     * Get current style on cursor.
     * @return {Object} - object contains style properties.
     */
    current(rng: WrappedRange): CurrentStyleInfo {
        const contEl = !dom.isElement(rng.sc) ? rng.sc.parentNode : rng.sc;
        let styleInfo = this.fromNode(contEl);

        // document.queryCommandState for toggle state
        // [workaround] prevent Firefox nsresult: "0x80004005 (NS_ERROR_FAILURE)"
        try {
            styleInfo = Object.assign(styleInfo, {
                'font-bold': document.queryCommandState('bold') ? 'bold' : 'normal',
                'font-italic': document.queryCommandState('italic') ? 'italic' : 'normal',
                'font-underline': document.queryCommandState('underline') ? 'underline' : 'normal',
                'font-subscript': document.queryCommandState('subscript') ? 'subscript' : 'normal',
                'font-superscript': document.queryCommandState('superscript') ? 'superscript' : 'normal',
                'font-strikethrough': document.queryCommandState('strikethrough') ? 'strikethrough' : 'normal',
                'font-family': document.queryCommandValue('fontname') || styleInfo['font-family'],
            });
        } catch (e) {
            // eslint-disable-next-line
        }

        // list-style-type to list-style(unordered, ordered)
        if (!rng.isOnList()) {
            styleInfo['list-style'] = 'none';
        } else {
            const orderedTypes = ['circle', 'disc', 'disc-leading-zero', 'square'];
            const isUnordered = orderedTypes.indexOf(styleInfo['list-style-type']) > -1;
            styleInfo['list-style'] = isUnordered ? 'unordered' : 'ordered';
        }

        const para = dom.ancestor(rng.sc, dom.isPara);
        if (para && para instanceof HTMLElement && para.style.lineHeight) {
            styleInfo['line-height'] = para.style.lineHeight;
        } else {
            const lineHeight = parseInt(styleInfo['line-height'], 10) / parseInt(styleInfo['font-size'], 10);
            styleInfo['line-height'] = lineHeight.toFixed(1);
        }

        return {
            ...styleInfo,
            anchor: rng.isOnAnchor() && dom.ancestor(rng.sc, dom.isAnchor),
            ancestors: dom.listAncestor(rng.sc, dom.isEditable),
            range: rng,
        };
    }
}
