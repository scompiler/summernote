import dom from '../core/dom';
import range, { WrappedRange } from '../core/range';
import lists from '../core/lists';
import func from "../core/func";

interface Cell {
    baseRow: HTMLTableRowElement;
    baseCell: HTMLTableCellElement;
    isRowSpan: boolean;
    isColSpan: boolean;
    isVirtual: boolean;
}

interface ActionCell {
    baseCell: HTMLTableCellElement;
    action: number;
    virtualTable: {
        rowIndex: number,
        cellIndex: number,
    };
}

class TableResultAction {
    /**
     * Where action occours enum.
     */
    static where = { 'Row': 0, 'Column': 1 };

    /**
     *
     * Requested action to apply enum.
     */
    static requestAction = { 'Add': 0, 'Delete': 1 };
    /**
     *
     * Result action to be executed enum.
     */
    static resultAction = { 'Ignore': 0, 'SubtractSpanCount': 1, 'RemoveCell': 2, 'AddCell': 3, 'SumSpanCount': 4 };

    private _startPoint = { 'colPos': 0, 'rowPos': 0 };

    private _virtualTable: Cell[][] = [];

    private _actionCellList: ActionCell[] = [];

    private readonly _where: number;

    private readonly _action: number;

    private _domTable: HTMLTableElement;

    /**
     * @param startPoint - Cell selected to apply change.
     * @param where      - Where change will be applied Row or Col. Use enum: TableResultAction.where.
     * @param action     - Action to be applied. Use enum: TableResultAction.requestAction.
     * @param domTable   - Dom element of table to make changes.
     */
    constructor(startPoint: Node, where: number, action: number, domTable: HTMLTableElement) {
        this._where = where;
        this._action = action;
        this._domTable = domTable;
        this.setStartPoint(startPoint);
        this.createVirtualTable();
    }
    /**
     * Set the startPoint of action.
     */
    private setStartPoint(startPoint: Node) {
        if (!startPoint || !(startPoint instanceof Element) || !startPoint.tagName || !(startPoint instanceof HTMLTableCellElement)) {
            // Impossible to identify start Cell point
            return;
        }
        this._startPoint.colPos = startPoint.cellIndex;
        if (!startPoint.parentElement || !startPoint.parentElement.tagName || !(startPoint.parentElement instanceof HTMLTableRowElement)) {
            // Impossible to identify start Row point
            return;
        }
        this._startPoint.rowPos = startPoint.parentElement.rowIndex;
    }

    /**
     * Define virtual table position info object.
     *
     * @param rowIndex      - Index position in line of virtual table.
     * @param cellIndex     - Index position in column of virtual table.
     * @param baseRow       - Row affected by this position.
     * @param baseCell      - Cell affected by this position.
     * @param isRowSpan     - Inform if it is a span row.
     * @param isColSpan     - Inform if it is a span cell.
     * @param isVirtualCell - Inform if it is a virtual cell.
     */
    private setVirtualTablePosition(
        rowIndex: number,
        cellIndex: number,
        baseRow: HTMLTableRowElement,
        baseCell: HTMLTableCellElement,
        isRowSpan: boolean,
        isColSpan: boolean,
        isVirtualCell: boolean,
    ) {
        const objPosition: Cell = {
            'baseRow': baseRow,
            'baseCell': baseCell,
            'isRowSpan': isRowSpan,
            'isColSpan': isColSpan,
            'isVirtual': isVirtualCell,
        };
        if (!this._virtualTable[rowIndex]) {
            this._virtualTable[rowIndex] = [];
        }
        this._virtualTable[rowIndex][cellIndex] = objPosition;
    }

    /**
     * Create action cell object.
     *
     * @param virtualTableCellObj - Object of specific position on virtual table.
     * @param resultAction        - Action to be applied in that item.
     * @param virtualRowPosition
     * @param virtualColPosition
     */
    private getActionCell(
        virtualTableCellObj: Cell,
        resultAction: number,
        virtualRowPosition: number,
        virtualColPosition: number,
    ): ActionCell {
        return {
            'baseCell': virtualTableCellObj.baseCell,
            'action': resultAction,
            'virtualTable': {
                'rowIndex': virtualRowPosition,
                'cellIndex': virtualColPosition,
            },
        };
    }

    /**
     * Recover free index of row to append Cell.
     *
     * @param rowIndex Index of row to find free space.
     * @param cellIndex Index of cell to find free space in table.
     */
    private recoverCellIndex(rowIndex: number, cellIndex: number) {
        if (!this._virtualTable[rowIndex]) {
            return cellIndex;
        }
        if (!this._virtualTable[rowIndex][cellIndex]) {
            return cellIndex;
        }

        let newCellIndex = cellIndex;
        while (this._virtualTable[rowIndex][newCellIndex]) {
            newCellIndex++;
            if (!this._virtualTable[rowIndex][newCellIndex]) {
                return newCellIndex;
            }
        }
    }

    /**
     * Recover info about row and cell and add information to virtual table.
     *
     * @param row Row to recover information.
     * @param cell Cell to recover information.
     */
    private addCellInfoToVirtual(row: HTMLTableRowElement, cell: HTMLTableCellElement) {
        const cellIndex = this.recoverCellIndex(row.rowIndex, cell.cellIndex);
        const cellHasColspan = (cell.colSpan > 1);
        const cellHasRowspan = (cell.rowSpan > 1);
        const isThisSelectedCell = (row.rowIndex === this._startPoint.rowPos && cell.cellIndex === this._startPoint.colPos);
        this.setVirtualTablePosition(row.rowIndex, cellIndex, row, cell, cellHasRowspan, cellHasColspan, false);



        // Add span rows to virtual Table.
        const rowspanNumber = parseInt(cell.attributes.getNamedItem('rowspan')?.value || '0', 10);
        if (rowspanNumber > 1) {
            for (let rp = 1; rp < rowspanNumber; rp++) {
                const rowspanIndex = row.rowIndex + rp;
                this.adjustStartPoint(rowspanIndex, cellIndex, cell, isThisSelectedCell);
                this.setVirtualTablePosition(rowspanIndex, cellIndex, row, cell, true, cellHasColspan, true);
            }
        }

        // Add span cols to virtual table.
        const colspanNumber = parseInt(cell.attributes.getNamedItem('colspan')?.value || '0', 10);
        if (colspanNumber > 1) {
            for (let cp = 1; cp < colspanNumber; cp++) {
                const cellspanIndex = this.recoverCellIndex(row.rowIndex, (cellIndex + cp));
                this.adjustStartPoint(row.rowIndex, cellspanIndex, cell, isThisSelectedCell);
                this.setVirtualTablePosition(row.rowIndex, cellspanIndex, row, cell, cellHasRowspan, true, true);
            }
        }
    }

    /**
     * Process validation and adjust of start point if needed.
     */
    private adjustStartPoint(rowIndex: number, cellIndex: number, cell: HTMLTableCellElement, isSelectedCell = false) {
        if (rowIndex === this._startPoint.rowPos && this._startPoint.colPos >= cell.cellIndex && cell.cellIndex <= cellIndex && !isSelectedCell) {
            this._startPoint.colPos++;
        }
    }

    /**
     * Create virtual table of cells with all cells, including span cells.
     */
    private createVirtualTable() {
        const rows = this._domTable.rows;
        for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
            const cells = rows[rowIndex].cells;
            for (let cellIndex = 0; cellIndex < cells.length; cellIndex++) {
                this.addCellInfoToVirtual(rows[rowIndex], cells[cellIndex]);
            }
        }
    }

    /**
     * Get action to be applied on the cell.
     *
     * @param cell - virtual table cell to apply action.
     */
    private getDeleteResultActionToCell(cell: Cell) {
        switch (this._where) {
            case TableResultAction.where.Column:
                if (cell.isColSpan) {
                    return TableResultAction.resultAction.SubtractSpanCount;
                }
                break;
            case TableResultAction.where.Row:
                if (!cell.isVirtual && cell.isRowSpan) {
                    return TableResultAction.resultAction.AddCell;
                } else if (cell.isRowSpan) {
                    return TableResultAction.resultAction.SubtractSpanCount;
                }
                break;
        }
        return TableResultAction.resultAction.RemoveCell;
    }

    /**
     * Get action to be applied on the cell.
     *
     * @param cell - virtual table cell to apply action
     */
    private getAddResultActionToCell(cell: Cell) {
        switch (this._where) {
            case TableResultAction.where.Column:
                if (cell.isColSpan) {
                    return TableResultAction.resultAction.SumSpanCount;
                } else if (cell.isRowSpan && cell.isVirtual) {
                    return TableResultAction.resultAction.Ignore;
                }
                break;
            case TableResultAction.where.Row:
                if (cell.isRowSpan) {
                    return TableResultAction.resultAction.SumSpanCount;
                } else if (cell.isColSpan && cell.isVirtual) {
                    return TableResultAction.resultAction.Ignore;
                }
                break;
        }
        return TableResultAction.resultAction.AddCell;
    }

    /**
     * Recover array os what to do in table.
     */
    getActionList() {
        const fixedRow = (this._where === TableResultAction.where.Row) ? this._startPoint.rowPos : -1;
        const fixedCol = (this._where === TableResultAction.where.Column) ? this._startPoint.colPos : -1;

        let actualPosition = 0;
        let canContinue = true;
        while (canContinue) {
            const rowPosition = (fixedRow >= 0) ? fixedRow : actualPosition;
            const colPosition = (fixedCol >= 0) ? fixedCol : actualPosition;
            const row = this._virtualTable[rowPosition];
            if (!row) {
                canContinue = false;
                return this._actionCellList;
            }
            const cell = row[colPosition];
            if (!cell) {
                canContinue = false;
                return this._actionCellList;
            }

            // Define action to be applied in this cell
            let resultAction = TableResultAction.resultAction.Ignore;
            switch (this._action) {
                case TableResultAction.requestAction.Add:
                    resultAction = this.getAddResultActionToCell(cell);
                    break;
                case TableResultAction.requestAction.Delete:
                    resultAction = this.getDeleteResultActionToCell(cell);
                    break;
            }
            this._actionCellList.push(this.getActionCell(cell, resultAction, rowPosition, colPosition));
            actualPosition++;
        }

        return this._actionCellList;
    }
}

/**
 *
 * @class editing.Table
 *
 * Table
 *
 */
export default class Table {
    /**
     * Handle tab key.
     */
    tab(rng: WrappedRange, isShift = false) {
        const cell = dom.ancestor(rng.commonAncestor(), dom.isCell);
        const table = dom.ancestor(cell, dom.isTable);
        const cells = dom.listDescendant(table, dom.isCell);

        const nextCell = lists[isShift ? 'prev' : 'next'](cells, cell);
        if (nextCell) {
            range.create(nextCell, 0).select();
        }
    }

    /**
     * Add a new row.
     *
     * @param {WrappedRange} rng
     * @param {String} position (top/bottom)
     * @return {Node}
     */
    addRow(rng: WrappedRange, position?: 'top' | 'bottom'): void {
        const cell = dom.ancestor(rng.commonAncestor(), dom.isCell);

        const currentTrEl = cell instanceof Element && cell.closest('tr');
        const trAttributes = this.recoverAttributes(currentTrEl);
        const htmlEl = func.makeElement('<tr' + trAttributes + '></tr>', 'tbody');

        const vTable = new TableResultAction(
            cell,
            TableResultAction.where.Row,
            TableResultAction.requestAction.Add,
            currentTrEl.closest('table'),
        );
        const actions = vTable.getActionList();

        for (let idCell = 0; idCell < actions.length; idCell++) {
            const currentCell = actions[idCell];
            const tdAttributes = this.recoverAttributes(currentCell.baseCell);
            switch (currentCell.action) {
                case TableResultAction.resultAction.AddCell:
                    htmlEl.appendChild(func.makeElement('<td' + tdAttributes + '>' + dom.blank + '</td>', 'tr'));
                    break;
                case TableResultAction.resultAction.SumSpanCount:
                    {
                        if (position === 'top') {
                            const baseCellTr = currentCell.baseCell.parentElement;
                            const isTopFromRowSpan = (!baseCellTr ? 0 : currentCell.baseCell.closest('tr').rowIndex) <= currentTrEl.rowIndex;
                            if (isTopFromRowSpan) {
                                const newTdEl = func.makeElement('<td' + tdAttributes + '>' + dom.blank + '</td>', 'tr');

                                newTdEl.removeAttribute('rowspan');

                                htmlEl.appendChild(newTdEl);
                                break;
                            }
                        }
                        let rowspanNumber = parseInt(currentCell.baseCell.rowSpan.toString(), 10);
                        rowspanNumber++;
                        currentCell.baseCell.setAttribute('rowSpan', rowspanNumber.toString());
                    }
                    break;
            }
        }

        if (position === 'top') {
            currentTrEl.parentNode.insertBefore(htmlEl, currentTrEl);
        } else {
            if (cell instanceof HTMLTableCellElement && cell.rowSpan > 1) {
                const lastTrIndex = currentTrEl.rowIndex + (cell.rowSpan - 2);

                const targetTrEl = [].slice.call(currentTrEl.parentElement.querySelectorAll('tr'))[lastTrIndex];

                if (targetTrEl) {
                    targetTrEl.parentNode.insertBefore(htmlEl, targetTrEl.nextSibling);
                }
                return;
            }
            currentTrEl.parentNode.insertBefore(htmlEl, currentTrEl.nextSibling);
        }
    }

    /**
     * Add a new col.
     */
    addCol(rng: WrappedRange, position: 'left' | 'right') {
        const cell = dom.ancestor(rng.commonAncestor(), dom.isCell);
        const rowEl = cell instanceof Element && cell.closest('tr');

        const vTable = new TableResultAction(
            cell,
            TableResultAction.where.Column,
            TableResultAction.requestAction.Add,
            rowEl.closest('table'),
        );
        const actions = vTable.getActionList();

        for (let actionIndex = 0; actionIndex < actions.length; actionIndex++) {
            const currentCell = actions[actionIndex];
            const tdAttributes = this.recoverAttributes(currentCell.baseCell);
            switch (currentCell.action) {
                case TableResultAction.resultAction.AddCell:
                    if (position === 'right') {
                        currentCell.baseCell.parentNode.insertBefore(
                            func.makeElement('<td' + tdAttributes + '>' + dom.blank + '</td>', 'tr'),
                            currentCell.baseCell.nextSibling,
                        );
                    } else {
                        currentCell.baseCell.parentNode.insertBefore(
                            func.makeElement('<td' + tdAttributes + '>' + dom.blank + '</td>', 'tr'),
                            currentCell.baseCell,
                        );
                    }
                    break;
                case TableResultAction.resultAction.SumSpanCount:
                    if (position === 'right') {
                        let colspanNumber = parseInt(currentCell.baseCell.colSpan.toString(), 10);
                        colspanNumber++;
                        currentCell.baseCell.setAttribute('colSpan', colspanNumber.toString());
                    } else {
                        currentCell.baseCell.parentNode.insertBefore(
                            func.makeElement('<td' + tdAttributes + '>' + dom.blank + '</td>', 'tr'),
                            currentCell.baseCell,
                        );
                    }
                    break;
            }
        }
    }

    /*
    * Copy attributes from element.
    *
    * @param {object} Element to recover attributes.
    * @return {string} Copied string elements.
    */
    recoverAttributes(el: HTMLElement) {
        let resultStr = '';

        if (!el) {
            return resultStr;
        }

        const attrList: NamedNodeMap = el.attributes || [] as unknown as NamedNodeMap;

        for (let i = 0; i < attrList.length; i++) {
            if (attrList[i].name.toLowerCase() === 'id') {
                continue;
            }

            if (attrList[i].specified) {
                resultStr += ' ' + attrList[i].name + '=\'' + attrList[i].value + '\'';
            }
        }

        return resultStr;
    }

    /**
     * Delete current row.
     */
    deleteRow(rng: WrappedRange): void {
        const cell = dom.ancestor(rng.commonAncestor(), dom.isCell);
        const rowEl = cell instanceof Element && cell.closest('tr');
        const rowChildrenEls = [].slice.call(rowEl.children) as Node[];
        const cellPos = rowChildrenEls.filter(x => ['td', 'th'].includes(x.nodeName.toLowerCase())).findIndex(x => x === cell);
        const rowPos = rowEl.rowIndex;

        const vTable = new TableResultAction(
            cell,
            TableResultAction.where.Row,
            TableResultAction.requestAction.Delete,
            rowEl.closest('table'),
        );
        const actions = vTable.getActionList();

        for (let actionIndex = 0; actionIndex < actions.length; actionIndex++) {
            if (!actions[actionIndex]) {
                continue;
            }

            const baseCell = actions[actionIndex].baseCell;
            const virtualPosition = actions[actionIndex].virtualTable;
            const hasRowspan = (baseCell.rowSpan && baseCell.rowSpan > 1);
            let rowspanNumber = (hasRowspan) ? parseInt(baseCell.rowSpan.toString(), 10) : 0;
            switch (actions[actionIndex].action) {
                case TableResultAction.resultAction.Ignore:
                    continue;
                case TableResultAction.resultAction.AddCell:
                    {
                        const rowChildrenEls = [].slice.call(rowEl.parentNode.children) as Node[];
                        const rowEls = rowChildrenEls.filter(x => x.nodeName.toLowerCase() === 'tr') as HTMLTableRowElement[];
                        const currentRowIndex = rowEls.findIndex(x => x === rowEl);
                        const nextRow = currentRowIndex >= 0 && rowEls[currentRowIndex + 1];

                        if (!nextRow) { continue; }
                        const cloneRow = rowEl.cells[cellPos];
                        if (hasRowspan) {
                            if (rowspanNumber > 2) {
                                rowspanNumber--;
                                nextRow.insertBefore(cloneRow, nextRow.cells[cellPos]);
                                nextRow.cells[cellPos].setAttribute('rowSpan', rowspanNumber.toString());
                                nextRow.cells[cellPos].innerHTML = '';
                            } else if (rowspanNumber === 2) {
                                nextRow.insertBefore(cloneRow, nextRow.cells[cellPos]);
                                nextRow.cells[cellPos].removeAttribute('rowSpan');
                                nextRow.cells[cellPos].innerHTML = '';
                            }
                        }
                    }
                    continue;
                case TableResultAction.resultAction.SubtractSpanCount:
                    if (hasRowspan) {
                        if (rowspanNumber > 2) {
                            rowspanNumber--;
                            baseCell.setAttribute('rowSpan', rowspanNumber.toString());
                            if (virtualPosition.rowIndex !== rowPos && baseCell.cellIndex === cellPos) { baseCell.innerHTML = ''; }
                        } else if (rowspanNumber === 2) {
                            baseCell.removeAttribute('rowSpan');
                            if (virtualPosition.rowIndex !== rowPos && baseCell.cellIndex === cellPos) { baseCell.innerHTML = ''; }
                        }
                    }
                    continue;
                case TableResultAction.resultAction.RemoveCell:
                    // Do not need to remove cell because row will be deleted.
                    continue;
            }
        }
        rowEl.remove();
    }

    /**
     * Delete current col.
     */
    deleteCol(rng: WrappedRange): void {
        const cell = dom.ancestor(rng.commonAncestor(), dom.isCell);
        const rowEl = cell instanceof Element && cell.closest('tr');
        const rowChildrenEls = [].slice.call(rowEl.children) as Node[];
        const cellPos = rowChildrenEls.filter(x => ['td', 'th'].includes(x.nodeName.toLowerCase())).findIndex(x => x === cell);

        const vTable = new TableResultAction(
            cell,
            TableResultAction.where.Column,
            TableResultAction.requestAction.Delete,
            rowEl.closest('table'),
        );
        const actions = vTable.getActionList();

        for (let actionIndex = 0; actionIndex < actions.length; actionIndex++) {
            if (!actions[actionIndex]) {
                continue;
            }
            switch (actions[actionIndex].action) {
                case TableResultAction.resultAction.Ignore:
                    continue;
                case TableResultAction.resultAction.SubtractSpanCount:
                    {
                        const baseCell = actions[actionIndex].baseCell;
                        const hasColspan = (baseCell.colSpan && baseCell.colSpan > 1);
                        if (hasColspan) {
                            let colspanNumber = (baseCell.colSpan) ? parseInt(baseCell.colSpan.toString(), 10) : 0;
                            if (colspanNumber > 2) {
                                colspanNumber--;
                                baseCell.setAttribute('colSpan', colspanNumber.toString());
                                if (baseCell.cellIndex === cellPos) { baseCell.innerHTML = ''; }
                            } else if (colspanNumber === 2) {
                                baseCell.removeAttribute('colSpan');
                                if (baseCell.cellIndex === cellPos) { baseCell.innerHTML = ''; }
                            }
                        }
                    }
                    continue;
                case TableResultAction.resultAction.RemoveCell:
                    dom.remove(actions[actionIndex].baseCell, true);
                    continue;
            }
        }
    }

    /**
     * Create empty table element.
     */
    createTable(colCount: number, rowCount: number, options?: {tableClassName?: string}): HTMLTableElement {
        const tds = [];
        for (let idxCol = 0; idxCol < colCount; idxCol++) {
            tds.push('<td>' + dom.blank + '</td>');
        }
        const tdHTML = tds.join('');

        const trs = [];
        for (let idxRow = 0; idxRow < rowCount; idxRow++) {
            trs.push('<tr>' + tdHTML + '</tr>');
        }
        const trHTML = trs.join('');
        const tableEl = func.makeElement<HTMLTableElement>('<table>' + trHTML + '</table>');
        if (options && options.tableClassName) {
            tableEl.className = options.tableClassName;
        }

        return tableEl;
    }

    /**
     * Delete current table.
     */
    deleteTable(rng: WrappedRange): void {
        const cell = dom.ancestor(rng.commonAncestor(), dom.isCell);

        if (cell instanceof Element) {
            cell.closest('table').remove();
        }
    }
}
