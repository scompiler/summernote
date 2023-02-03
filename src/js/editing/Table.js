import dom from '../core/dom';
import range from '../core/range';
import lists from '../core/lists';
import func from "../core/func.ts";

/**
 * @class Create a virtual table to create what actions to do in change.
 * @param {object} startPoint Cell selected to apply change.
 * @param {enum} where  Where change will be applied Row or Col. Use enum: TableResultAction.where
 * @param {enum} action Action to be applied. Use enum: TableResultAction.requestAction
 * @param {object} domTable Dom element of table to make changes.
 */
const TableResultAction = function(startPoint, where, action, domTable) {
  const _startPoint = { 'colPos': 0, 'rowPos': 0 };
  const _virtualTable = [];
  const _actionCellList = [];

  /// ///////////////////////////////////////////
  // Private functions
  /// ///////////////////////////////////////////

  /**
   * Set the startPoint of action.
   */
  function setStartPoint() {
    if (!startPoint || !startPoint.tagName || (startPoint.tagName.toLowerCase() !== 'td' && startPoint.tagName.toLowerCase() !== 'th')) {
      // Impossible to identify start Cell point
      return;
    }
    _startPoint.colPos = startPoint.cellIndex;
    if (!startPoint.parentElement || !startPoint.parentElement.tagName || startPoint.parentElement.tagName.toLowerCase() !== 'tr') {
      // Impossible to identify start Row point
      return;
    }
    _startPoint.rowPos = startPoint.parentElement.rowIndex;
  }

  /**
   * Define virtual table position info object.
   *
   * @param {int} rowIndex Index position in line of virtual table.
   * @param {int} cellIndex Index position in column of virtual table.
   * @param {object} baseRow Row affected by this position.
   * @param {object} baseCell Cell affected by this position.
   * @param {bool} isSpan Inform if it is an span cell/row.
   */
  function setVirtualTablePosition(rowIndex, cellIndex, baseRow, baseCell, isRowSpan, isColSpan, isVirtualCell) {
    const objPosition = {
      'baseRow': baseRow,
      'baseCell': baseCell,
      'isRowSpan': isRowSpan,
      'isColSpan': isColSpan,
      'isVirtual': isVirtualCell,
    };
    if (!_virtualTable[rowIndex]) {
      _virtualTable[rowIndex] = [];
    }
    _virtualTable[rowIndex][cellIndex] = objPosition;
  }

  /**
   * Create action cell object.
   *
   * @param {object} virtualTableCellObj Object of specific position on virtual table.
   * @param {enum} resultAction Action to be applied in that item.
   */
  function getActionCell(virtualTableCellObj, resultAction, virtualRowPosition, virtualColPosition) {
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
   * @param {int} rowIndex Index of row to find free space.
   * @param {int} cellIndex Index of cell to find free space in table.
   */
  function recoverCellIndex(rowIndex, cellIndex) {
    if (!_virtualTable[rowIndex]) {
      return cellIndex;
    }
    if (!_virtualTable[rowIndex][cellIndex]) {
      return cellIndex;
    }

    let newCellIndex = cellIndex;
    while (_virtualTable[rowIndex][newCellIndex]) {
      newCellIndex++;
      if (!_virtualTable[rowIndex][newCellIndex]) {
        return newCellIndex;
      }
    }
  }

  /**
   * Recover info about row and cell and add information to virtual table.
   *
   * @param {object} row Row to recover information.
   * @param {object} cell Cell to recover information.
   */
  function addCellInfoToVirtual(row, cell) {
    const cellIndex = recoverCellIndex(row.rowIndex, cell.cellIndex);
    const cellHasColspan = (cell.colSpan > 1);
    const cellHasRowspan = (cell.rowSpan > 1);
    const isThisSelectedCell = (row.rowIndex === _startPoint.rowPos && cell.cellIndex === _startPoint.colPos);
    setVirtualTablePosition(row.rowIndex, cellIndex, row, cell, cellHasRowspan, cellHasColspan, false);

    // Add span rows to virtual Table.
    const rowspanNumber = cell.attributes.rowSpan ? parseInt(cell.attributes.rowSpan.value, 10) : 0;
    if (rowspanNumber > 1) {
      for (let rp = 1; rp < rowspanNumber; rp++) {
        const rowspanIndex = row.rowIndex + rp;
        adjustStartPoint(rowspanIndex, cellIndex, cell, isThisSelectedCell);
        setVirtualTablePosition(rowspanIndex, cellIndex, row, cell, true, cellHasColspan, true);
      }
    }

    // Add span cols to virtual table.
    const colspanNumber = cell.attributes.colSpan ? parseInt(cell.attributes.colSpan.value, 10) : 0;
    if (colspanNumber > 1) {
      for (let cp = 1; cp < colspanNumber; cp++) {
        const cellspanIndex = recoverCellIndex(row.rowIndex, (cellIndex + cp));
        adjustStartPoint(row.rowIndex, cellspanIndex, cell, isThisSelectedCell);
        setVirtualTablePosition(row.rowIndex, cellspanIndex, row, cell, cellHasRowspan, true, true);
      }
    }
  }

  /**
   * Process validation and adjust of start point if needed
   *
   * @param {int} rowIndex
   * @param {int} cellIndex
   * @param {object} cell
   * @param {bool} isSelectedCell
   */
  function adjustStartPoint(rowIndex, cellIndex, cell, isSelectedCell) {
    if (rowIndex === _startPoint.rowPos && _startPoint.colPos >= cell.cellIndex && cell.cellIndex <= cellIndex && !isSelectedCell) {
      _startPoint.colPos++;
    }
  }

  /**
   * Create virtual table of cells with all cells, including span cells.
   */
  function createVirtualTable() {
    const rows = domTable.rows;
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const cells = rows[rowIndex].cells;
      for (let cellIndex = 0; cellIndex < cells.length; cellIndex++) {
        addCellInfoToVirtual(rows[rowIndex], cells[cellIndex]);
      }
    }
  }

  /**
   * Get action to be applied on the cell.
   *
   * @param {object} cell virtual table cell to apply action
   */
  function getDeleteResultActionToCell(cell) {
    switch (where) {
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
   * @param {object} cell virtual table cell to apply action
   */
  function getAddResultActionToCell(cell) {
    switch (where) {
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

  function init() {
    setStartPoint();
    createVirtualTable();
  }

  /// ///////////////////////////////////////////
  // Public functions
  /// ///////////////////////////////////////////

  /**
   * Recover array os what to do in table.
   */
  this.getActionList = function() {
    const fixedRow = (where === TableResultAction.where.Row) ? _startPoint.rowPos : -1;
    const fixedCol = (where === TableResultAction.where.Column) ? _startPoint.colPos : -1;

    let actualPosition = 0;
    let canContinue = true;
    while (canContinue) {
      const rowPosition = (fixedRow >= 0) ? fixedRow : actualPosition;
      const colPosition = (fixedCol >= 0) ? fixedCol : actualPosition;
      const row = _virtualTable[rowPosition];
      if (!row) {
        canContinue = false;
        return _actionCellList;
      }
      const cell = row[colPosition];
      if (!cell) {
        canContinue = false;
        return _actionCellList;
      }

      // Define action to be applied in this cell
      let resultAction = TableResultAction.resultAction.Ignore;
      switch (action) {
        case TableResultAction.requestAction.Add:
          resultAction = getAddResultActionToCell(cell);
          break;
        case TableResultAction.requestAction.Delete:
          resultAction = getDeleteResultActionToCell(cell);
          break;
      }
      _actionCellList.push(getActionCell(cell, resultAction, rowPosition, colPosition));
      actualPosition++;
    }

    return _actionCellList;
  };

  init();
};
/**
*
* Where action occours enum.
*/
TableResultAction.where = { 'Row': 0, 'Column': 1 };
/**
*
* Requested action to apply enum.
*/
TableResultAction.requestAction = { 'Add': 0, 'Delete': 1 };
/**
*
* Result action to be executed enum.
*/
TableResultAction.resultAction = { 'Ignore': 0, 'SubtractSpanCount': 1, 'RemoveCell': 2, 'AddCell': 3, 'SumSpanCount': 4 };

/**
 *
 * @class editing.Table
 *
 * Table
 *
 */
export default class Table {
  /**
   * handle tab key
   *
   * @param {WrappedRange} rng
   * @param {Boolean} isShift
   */
  tab(rng, isShift) {
    const cell = dom.ancestor(rng.commonAncestor(), dom.isCell);
    const table = dom.ancestor(cell, dom.isTable);
    const cells = dom.listDescendant(table, dom.isCell);

    const nextCell = lists[isShift ? 'prev' : 'next'](cells, cell);
    if (nextCell) {
      range.create(nextCell, 0).select();
    }
  }

  /**
   * Add a new row
   *
   * @param {WrappedRange} rng
   * @param {String} position (top/bottom)
   * @return {Node}
   */
  addRow(rng, position) {
    const cell = dom.ancestor(rng.commonAncestor(), dom.isCell);

    const currentTrEl = cell instanceof Element && cell.closest('tr');
    const trAttributes = this.recoverAttributes(currentTrEl);
    const htmlEl = func.makeElement('<tr' + trAttributes + '></tr>', 'tbody');

    const vTable = new TableResultAction(cell, TableResultAction.where.Row,
      TableResultAction.requestAction.Add, currentTrEl.closest('table'));
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
              const baseCellTr = currentCell.baseCell.parent;
              const isTopFromRowSpan = (!baseCellTr ? 0 : currentCell.baseCell.closest('tr').rowIndex) <= currentTrEl.rowIndex;
              if (isTopFromRowSpan) {
                const newTdEl = func.makeElement('<td' + tdAttributes + '>' + dom.blank + '</td>', 'tr');

                newTdEl.removeAttribute('rowspan');

                htmlEl.appendChild(newTdEl);
                break;
              }
            }
            let rowspanNumber = parseInt(currentCell.baseCell.rowSpan, 10);
            rowspanNumber++;
            currentCell.baseCell.setAttribute('rowSpan', rowspanNumber);
          }
          break;
      }
    }

    if (position === 'top') {
      currentTrEl.parentNode.insertBefore(htmlEl, currentTrEl);
    } else {
      const cellHasRowspan = (cell.rowSpan > 1);
      if (cellHasRowspan) {
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
   * Add a new col
   *
   * @param {WrappedRange} rng
   * @param {String} position (left/right)
   * @return {Node}
   */
  addCol(rng, position) {
    const cell = dom.ancestor(rng.commonAncestor(), dom.isCell);
    const rowEl = cell instanceof Element && cell.closest('tr');

    const vTable = new TableResultAction(cell, TableResultAction.where.Column,
      TableResultAction.requestAction.Add, rowEl.closest('table'));
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
            let colspanNumber = parseInt(currentCell.baseCell.colSpan, 10);
            colspanNumber++;
            currentCell.baseCell.setAttribute('colSpan', colspanNumber);
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
  recoverAttributes(el) {
    let resultStr = '';

    if (!el) {
      return resultStr;
    }

    const attrList = el.attributes || [];

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
   * Delete current row
   *
   * @param {WrappedRange} rng
   * @return {Node}
   */
  deleteRow(rng) {
    const cell = dom.ancestor(rng.commonAncestor(), dom.isCell);
    const rowEl = cell instanceof Element && cell.closest('tr');
    const cellPos = [].slice.call(rowEl.children).filter(x => ['td', 'th'].includes(x.nodeName.toLowerCase())).findIndex(x => x === cell);
    const rowPos = rowEl.rowIndex;

    const vTable = new TableResultAction(cell, TableResultAction.where.Row,
      TableResultAction.requestAction.Delete, rowEl.closest('table'));
    const actions = vTable.getActionList();

    for (let actionIndex = 0; actionIndex < actions.length; actionIndex++) {
      if (!actions[actionIndex]) {
        continue;
      }

      const baseCell = actions[actionIndex].baseCell;
      const virtualPosition = actions[actionIndex].virtualTable;
      const hasRowspan = (baseCell.rowSpan && baseCell.rowSpan > 1);
      let rowspanNumber = (hasRowspan) ? parseInt(baseCell.rowSpan, 10) : 0;
      switch (actions[actionIndex].action) {
        case TableResultAction.resultAction.Ignore:
          continue;
        case TableResultAction.resultAction.AddCell:
          {
            const rowEls = [].slice.call(rowEl.parentNode.children).filter(x => x.nodeName.toLowerCase() === 'tr');
            const currentRowIndex = rowEls.findIndex(x => x === rowEl);
            const nextRow = currentRowIndex >= 0 && rowEls[currentRowIndex + 1];

            if (!nextRow) { continue; }
            const cloneRow = rowEl.cells[cellPos];
            if (hasRowspan) {
              if (rowspanNumber > 2) {
                rowspanNumber--;
                nextRow.insertBefore(cloneRow, nextRow.cells[cellPos]);
                nextRow.cells[cellPos].setAttribute('rowSpan', rowspanNumber);
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
              baseCell.setAttribute('rowSpan', rowspanNumber);
              if (virtualPosition.rowIndex !== rowPos && baseCell.cellIndex === cellPos) { baseCell.innerHTML = ''; }
            } else if (rowspanNumber === 2) {
              baseCell.removeAttribute('rowSpan');
              if (virtualPosition.rowIndex !== rowPos && baseCell.cellIndex === cellPos) { baseCell.innerHTML = ''; }
            }
          }
          continue;
        case TableResultAction.resultAction.RemoveCell:
          // Do not need remove cell because row will be deleted.
          continue;
      }
    }
    rowEl.remove();
  }

  /**
   * Delete current col
   *
   * @param {WrappedRange} rng
   * @return {Node}
   */
  deleteCol(rng) {
    const cell = dom.ancestor(rng.commonAncestor(), dom.isCell);
    const rowEl = cell instanceof Element && cell.closest('tr');
    const cellPos = [].slice.call(rowEl.children).filter(x => ['td', 'th'].includes(x.nodeName.toLowerCase())).findIndex(x => x === cell);

    const vTable = new TableResultAction(cell, TableResultAction.where.Column,
      TableResultAction.requestAction.Delete, rowEl.closest('table'));
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
              let colspanNumber = (baseCell.colSpan) ? parseInt(baseCell.colSpan, 10) : 0;
              if (colspanNumber > 2) {
                colspanNumber--;
                baseCell.setAttribute('colSpan', colspanNumber);
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
   * create empty table element
   *
   * @param {Number} rowCount
   * @param {Number} colCount
   * @return {Node}
   */
  createTable(colCount, rowCount, options) {
    const tds = [];
    let tdHTML;
    for (let idxCol = 0; idxCol < colCount; idxCol++) {
      tds.push('<td>' + dom.blank + '</td>');
    }
    tdHTML = tds.join('');

    const trs = [];
    let trHTML;
    for (let idxRow = 0; idxRow < rowCount; idxRow++) {
      trs.push('<tr>' + tdHTML + '</tr>');
    }
    trHTML = trs.join('');
    const tableEl = func.makeElement('<table>' + trHTML + '</table>');
    if (options && options.tableClassName) {
      tableEl.className = options.tableClassName;
    }

    return tableEl;
  }

  /**
   * Delete current table
   *
   * @param {WrappedRange} rng
   * @return {Node}
   */
  deleteTable(rng) {
    const cell = dom.ancestor(rng.commonAncestor(), dom.isCell);

    if (cell instanceof Element) {
      cell.closest('table').remove();
    }
  }
}
