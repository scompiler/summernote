import lists from '../core/lists';
import func from '../core/func';
import dom from '../core/dom';
import range from '../core/range';

export default class Bullet {
    /**
     * toggle ordered list
     */
    insertOrderedList(editable: HTMLElement) {
        this.toggleList('OL', editable);
    }

    /**
     * toggle unordered list
     */
    insertUnorderedList(editable: HTMLElement) {
        this.toggleList('UL', editable);
    }

    /**
     * indent
     */
    indent(editable: HTMLElement) {
        const rng = range.create(editable).wrapBodyInlineWithPara();

        const paras = rng.nodes(dom.isPara, { includeAncestor: true });
        const clustereds = lists.clusterBy(paras, func.peq2('parentNode'));

        clustereds.forEach((paras) => {
            const head = lists.head(paras);
            if (dom.isLi(head) && head instanceof HTMLLIElement) {
                const previousList = head.previousSibling instanceof Element
                    ? this.findList(head.previousSibling)
                    : undefined;
                if (previousList) {
                    paras
                        .map(para => previousList.appendChild(para));
                } else {
                    this.wrapList(paras, head.parentNode.nodeName);
                    paras
                        .map((para) => para.parentNode)
                        .map((para) => this.appendToPrevious(para));
                }
            } else {
                paras.forEach((para) => {
                    if (para instanceof HTMLElement) {
                        para.style.marginLeft = ((parseInt(para.style.marginLeft, 10) || 0) + 25) + 'px';
                    }
                });
            }
        });

        rng.select();
    }

    /**
     * outdent
     */
    outdent(editable: HTMLElement) {
        const rng = range.create(editable).wrapBodyInlineWithPara();

        const paras = rng.nodes(dom.isPara, { includeAncestor: true });
        const clustereds = lists.clusterBy(paras, func.peq2('parentNode'));

        clustereds.forEach((paras) => {
            const head = lists.head(paras);
            if (dom.isLi(head)) {
                this.releaseList([paras]);
            } else {
                paras.forEach((para) => {
                    if (para instanceof HTMLElement) {
                        const marginLeft = (parseInt(para.style.marginLeft, 10) || 0);

                        para.style.marginLeft = marginLeft > 25 ? (marginLeft - 25) + 'px' : '';
                    }
                });
            }
        });

        rng.select();
    }

    /**
     * Toggle list.
     */
    toggleList(listName: string, editable: HTMLElement) {
        const rng = range.create(editable).wrapBodyInlineWithPara();

        let paras = rng.nodes(dom.isPara, { includeAncestor: true });
        const bookmark = rng.paraBookmark(paras);
        const clustereds = lists.clusterBy(paras, func.peq2('parentNode'));

        // paragraph to list
        if (lists.find(paras, dom.isPurePara)) {
            let wrappedParas: Node[] = [];
            clustereds.forEach((paras) => {
                wrappedParas = wrappedParas.concat(this.wrapList(paras, listName));
            });
            paras = wrappedParas;
            // list to paragraph or change list style
        } else {
            const diffLists = rng.nodes(dom.isList, {
                includeAncestor: true,
            }).filter((listNode) => {
                return !(listNode.nodeName && listNode.nodeName.toLowerCase() === listName.toLowerCase());
            });

            if (diffLists.length) {
                diffLists.forEach((listNode) => {
                    dom.replace(listNode, listName);
                });
            } else {
                paras = this.releaseList(clustereds, true);
            }
        }

        range.createFromParaBookmark(bookmark, paras).select();
    }

    wrapList(paras: Node[], listName: string): Node[] {
        const head = lists.head(paras);
        const last = lists.last(paras);

        const prevList = dom.isList(head.previousSibling) && head.previousSibling;
        const nextList = dom.isList(last.nextSibling) && last.nextSibling;

        const listNode = prevList || dom.insertAfter(dom.create(listName || 'UL'), last);

        // P to LI
        paras = paras.map((para) => {
            return dom.isPurePara(para) ? dom.replace(para, 'LI') : para;
        });

        // append to list(<ul>, <ol>)
        dom.appendChildNodes(listNode, paras);

        if (nextList) {
            dom.appendChildNodes(listNode, lists.from(nextList.childNodes));
            dom.remove(nextList);
        }

        return paras;
    }

    releaseList(clustereds: Node[][], isEscapseToBody = false): Node[] {
        let releasedParas: Node[] = [];

        clustereds.forEach((paras) => {
            const head = lists.head(paras);
            const last = lists.last(paras);

            const headList = isEscapseToBody ? dom.lastAncestor(head, dom.isList) : head.parentNode;
            const parentItem = headList.parentNode;

            if (headList.parentNode.nodeName === 'LI') {
                paras.map(para => {
                    const newList = this.findNextSiblings(para);

                    if (parentItem.nextSibling) {
                        parentItem.parentNode.insertBefore(
                            para,
                            parentItem.nextSibling
                        );
                    } else {
                        parentItem.parentNode.appendChild(para);
                    }

                    if (newList.length) {
                        this.wrapList(newList, headList.nodeName);
                        para.appendChild(newList[0].parentNode);
                    }
                });

                if (headList instanceof Element && headList.children.length === 0) {
                    parentItem.removeChild(headList);
                }

                if (parentItem.childNodes.length === 0) {
                    parentItem.parentNode.removeChild(parentItem);
                }
            } else {
                const lastList = headList.childNodes.length > 1 ? dom.splitTree(headList, {
                    node: last.parentNode,
                    offset: dom.position(last) + 1,
                }, {
                    isSkipPaddingBlankHTML: true,
                }) : null;

                const middleList = dom.splitTree(headList, {
                    node: head.parentNode,
                    offset: dom.position(head),
                }, {
                    isSkipPaddingBlankHTML: true,
                });

                paras = isEscapseToBody ? dom.listDescendant(middleList, dom.isLi)
                    : lists.from(middleList.childNodes).filter(dom.isLi);

                // LI to P
                if (isEscapseToBody || !dom.isList(headList.parentNode)) {
                    paras = paras.map((para) => {
                        return dom.replace(para, 'P');
                    });
                }

                lists.from(paras).reverse().forEach((para) => {
                    dom.insertAfter(para, headList);
                });

                // remove empty lists
                const rootLists = lists.compact([headList, middleList, lastList]);
                rootLists.forEach((rootList) => {
                    const listNodes = [rootList].concat(dom.listDescendant(rootList, dom.isList));
                    listNodes.reverse().forEach((listNode) => {
                        if (!dom.nodeLength(listNode)) {
                            dom.remove(listNode, true);
                        }
                    });
                });
            }

            releasedParas = releasedParas.concat(paras);
        });

        return releasedParas;
    }

    /**
     * Appends list to previous list item, if none exist it wraps the list in a new list item.
     */
    appendToPrevious(node: Node): Node | Node[] {
        return node.previousSibling
            ? dom.appendChildNodes(node.previousSibling, [node])
            : this.wrapList([node], 'LI');
    }

    /**
     * Finds an existing list in list item.
     */
    findList(node: Element): Element | null {
        const children = [].slice.call(node.children) as Element[];

        return node
            ? lists.find(children, child => ['OL', 'UL'].indexOf(child.nodeName) > -1)
            : null;
    }

    /**
     * Finds all list item siblings that follow it.
     */
    findNextSiblings(node: Node): Node[] {
        const siblings = [];
        while (node.nextSibling) {
            siblings.push(node.nextSibling);
            node = node.nextSibling;
        }
        return siblings;
    }
}
