/**
 * Table.spec.js
 * (c) 2015~ Summernote Team
 * summernote may be freely distributed under the MIT license./
 */
import chai from 'chai';
import chaidom from 'test/chaidom';
import range from 'src/js/core/range';
import Table from 'src/js/editing/Table';
import func from "src/js/core/func";

const expect = chai.expect;
chai.use(chaidom);

describe('base:editing.Table', () => {
    const table = new Table();
    describe('tableWorker', () => {
        it('should create simple 1x1 table', () => {
            const resultTable = table.createTable(1, 1);
            expect(1).to.deep.equal(resultTable.rows.length);
            expect(1).to.deep.equal(resultTable.rows[0].cells.length);
        });

        it('should delete simple 1x1 table', () => {
            const htmlContent = [
                '<div class="note-editable">',
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td>content</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                '</div>',
            ].join('');
            const contEl = func.makeElement(htmlContent);
            const cellEl = contEl.querySelector('td');
            const rng = range.create(cellEl.firstChild, 1);
            table.deleteTable(rng);
            expect('').to.deep.equal(contEl.innerHTML);
        });

        it('should add simple row to table on top', () => {
            const htmlContent = [
                '<div class="note-editable">',
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td>content</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                '</div>',
            ].join('');
            const contEl = func.makeElement(htmlContent);
            const cellEl = contEl.querySelector('td');
            const rng = range.create(cellEl.firstChild, 1);
            table.addRow(rng, 'top');

            const expectedResult = [
                '<table>',
                    '<tbody>',
                '<tr>',
                '<td><br></td>',
                '</tr>',
                        '<tr>',
                            '<td>content</td>',
                        '</tr>',
                    '</tbody>',
                '</table>',
            ].join('');
            expect(expectedResult).to.equalsIgnoreCase(contEl.innerHTML);
        });

        it('should add simple row to table on bottom', () => {
            const htmlContent = [
                '<div class="note-editable">',
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td>content</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                '</div>',
            ].join('');
            const contEl = func.makeElement(htmlContent);
            const cellEl = contEl.querySelector('td');
            const rng = range.create(cellEl.firstChild, 1);
            table.addRow(rng, 'bottom');

            const expectedResult = [
                '<table>',
                    '<tbody>',
                        '<tr>',
                            '<td>content</td>',
                        '</tr>',
                        '<tr>',
                            '<td><br></td>',
                        '</tr>',
                    '</tbody>',
                '</table>',
            ].join('');
            expect(expectedResult).to.equalsIgnoreCase(contEl.innerHTML);
        });

        it('should add simple row to table on top between two rows', () => {
            const htmlContent = [
                '<div class="note-editable">',
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td>content1</td>',
                            '</tr>',
                            '<tr>',
                                '<td id="td2">content2</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                '</div>',
            ].join('');
            const contEl = func.makeElement(htmlContent);
            const cellEl = contEl.querySelector('#td2');
            const rng = range.create(cellEl.firstChild, 1);
            table.addRow(rng, 'top');

            const expectedResult = [
                '<table>',
                    '<tbody>',
                        '<tr>',
                            '<td>content1</td>',
                        '</tr>',
                        '<tr>',
                            '<td><br></td>',
                        '</tr>',
                        '<tr>',
                            '<td id="td2">content2</td>',
                        '</tr>',
                    '</tbody>',
                '</table>',
            ].join('');
            expect(expectedResult).to.equalsIgnoreCase(contEl.innerHTML);
        });

        it('should add simple row to table on bottom between two rows', () => {
            const htmlContent = [
                '<div class="note-editable">',
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td id="td1">content1</td>',
                            '</tr>',
                            '<tr>',
                                '<td id="td2">content2</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                '</div>',
            ].join('');
            const contEl = func.makeElement(htmlContent);
            const cellEl = contEl.querySelector('#td1');
            const rng = range.create(cellEl.firstChild, 1);
            table.addRow(rng, 'bottom');

            const expectedResult = [
                '<table>',
                    '<tbody>',
                        '<tr>',
                            '<td id="td1">content1</td>',
                        '</tr>',
                        '<tr>',
                            '<td><br></td>',
                        '</tr>',
                        '<tr>',
                            '<td id="td2">content2</td>',
                        '</tr>',
                    '</tbody>',
                '</table>',
            ].join('');
            expect(expectedResult).to.equalsIgnoreCase(contEl.innerHTML);
        });

        it('should add simple col to table on left between two cols', () => {
            const htmlContent = [
                '<div class="note-editable">',
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td id="td1">content1</td>',
                                '<td id="td2">content2</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                '</div>',
            ].join('');
            const contEl = func.makeElement(htmlContent);
            const cellEl = contEl.querySelector('#td2');
            const rng = range.create(cellEl.firstChild, 1);
            table.addCol(rng, 'left');

            const expectedResult = [
                '<table>',
                    '<tbody>',
                        '<tr>',
                            '<td id="td1">content1</td>',
                            '<td><br></td>',
                            '<td id="td2">content2</td>',
                        '</tr>',
                    '</tbody>',
                '</table>',
            ].join('');
            expect(expectedResult).to.equalsIgnoreCase(contEl.innerHTML);
        });

        it('should add simple col to table on right between two cols', () => {
            const htmlContent = [
                '<div class="note-editable">',
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td id="td1">content1</td>',
                                '<td id="td2">content2</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                '</div>',
            ].join('');
            const contEl = func.makeElement(htmlContent);
            const cellEl = contEl.querySelector('#td1');
            const rng = range.create(cellEl.firstChild, 1);
            table.addCol(rng, 'right');

            const expectedResult = [
                '<table>',
                    '<tbody>',
                        '<tr>',
                            '<td id="td1">content1</td>',
                            '<td><br></td>',
                            '<td id="td2">content2</td>',
                        '</tr>',
                    '</tbody>',
                '</table>',
            ].join('');
            expect(expectedResult).to.equalsIgnoreCase(contEl.innerHTML);
        });

        it('should delete row to table between two other rows', () => {
            const htmlContent = [
                '<div class="note-editable">',
                    '<table>',
                        '<tbody>',
                            '<tr><td id="td1">content1</td></tr>',
                            '<tr><td id="td2">content2</td></tr>',
                            '<tr><td id="td3">content3</td></tr>',
                        '</tbody>',
                    '</table>',
                '</div>',
            ].join('');
            const contEl = func.makeElement(htmlContent);
            const cellEl = contEl.querySelector('#td2');
            const rng = range.create(cellEl.firstChild, 1);
            table.deleteRow(rng);

            const expectedResult = [
                '<table>',
                    '<tbody>',
                        '<tr><td id="td1">content1</td></tr>',
                        '<tr><td id="td3">content3</td></tr>',
                    '</tbody>',
                '</table>',
            ].join('');
            expect(expectedResult).to.equalsIgnoreCase(contEl.innerHTML);
        });

        it('should delete col to table between two other cols', () => {
            const htmlContent = [
                '<div class="note-editable">',
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td id="td1">content1</td>',
                                '<td id="td2">content2</td>',
                                '<td id="td3">content3</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                '</div>',
            ].join('');
            const contEl = func.makeElement(htmlContent);
            const cellEl = contEl.querySelector('#td2');
            const rng = range.create(cellEl.firstChild, 1);
            table.deleteCol(rng);

            const expectedResult = [
                '<table>',
                    '<tbody>',
                        '<tr>',
                            '<td id="td1">content1</td>',
                            '<td id="td3">content3</td>',
                        '</tr>',
                    '</tbody>',
                '</table>',
            ].join('');
            expect(expectedResult).to.equalsIgnoreCase(contEl.innerHTML);
        });

        it('should delete first col to table with colspan in column with colspan', () => {
            const htmlContent = [
                '<div class="note-editable">',
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td colspan="2" id="tr1td1">Col1-Span</td>',
                                '<td id="tr1td2">Col2</td>',
                            '</tr>',
                            '<tr>',
                                '<td id="tr2td1">Col1</td>',
                                '<td id="tr2td2">Col2</td>',
                                '<td id="tr2td3">Col3</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                '</div>',
            ].join('');
            const contEl = func.makeElement(htmlContent);
            const cellEl = contEl.querySelector('#tr1td1');
            const rng = range.create(cellEl.firstChild, 1);
            table.deleteCol(rng);

            const expectedResult = [
                '<table>',
                    '<tbody>',
                        '<tr>',
                            '<td id="tr1td1"></td>',
                            '<td id="tr1td2">Col2</td>',
                        '</tr>',
                        '<tr>',
                            '<td id="tr2td2">Col2</td>',
                            '<td id="tr2td3">Col3</td>',
                        '</tr>',
                    '</tbody>',
                '</table>',
            ].join('');
            expect(expectedResult).to.equalsIgnoreCase(contEl.innerHTML);
        });

        it('should delete second col to table with colspan in column', () => {
            const htmlContent = [
                '<div class="note-editable">',
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td colspan="2" id="tr1td1">Col1-Span</td>',
                                '<td id="tr1td2">Col2</td>',
                            '</tr>',
                            '<tr>',
                                '<td id="tr2td1">Col1</td>',
                                '<td id="tr2td2">Col2</td>',
                                '<td id="tr2td3">Col3</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                '</div>',
            ].join('');
            const contEl = func.makeElement(htmlContent);
            const cellEl = contEl.querySelector('#tr2td2');
            const rng = range.create(cellEl.firstChild, 1);
            table.deleteCol(rng);

            const expectedResult = [
                '<table>',
                    '<tbody>',
                        '<tr>',
                            '<td id="tr1td1">Col1-Span</td>',
                            '<td id="tr1td2">Col2</td>',
                        '</tr>',
                        '<tr>',
                            '<td id="tr2td1">Col1</td>',
                            '<td id="tr2td3">Col3</td>',
                        '</tr>',
                    '</tbody>',
                '</table>',
            ].join('');
            expect(expectedResult).to.equalsIgnoreCase(contEl.innerHTML);
        });

        it('should delete second col to table with colspan in 3 columns', () => {
            const htmlContent = [
                '<div class="note-editable">',
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td colspan="3" id="tr1td1">Col1-Span</td>',
                                '<td id="tr1td4">Col4</td>',
                            '</tr>',
                            '<tr>',
                                '<td id="tr2td1">Col1</td>',
                                '<td id="tr2td2">Col2</td>',
                                '<td id="tr2td3">Col3</td>',
                                '<td id="tr2td4">Col4</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                '</div>',
            ].join('');
            const contEl = func.makeElement(htmlContent);
            const cellEl = contEl.querySelector('#tr2td2');
            const rng = range.create(cellEl.firstChild, 1);
            table.deleteCol(rng);

            const expectedResult = [
                '<table>',
                    '<tbody>',
                        '<tr>',
                            '<td colspan="2" id="tr1td1">Col1-Span</td>',
                            '<td id="tr1td4">Col4</td>',
                        '</tr>',
                        '<tr>',
                            '<td id="tr2td1">Col1</td>',
                            '<td id="tr2td3">Col3</td>',
                            '<td id="tr2td4">Col4</td>',
                        '</tr>',
                    '</tbody>',
                '</table>',
            ].join('');
            expect(expectedResult).to.equalsIgnoreCase(contEl.innerHTML);
        });

        it('should delete first row to table with rowspan in line with rowspan', () => {
            const htmlContent = [
                '<div class="note-editable">',
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td class="test" rowspan="2" id="tr1td1">Row1-Span</td>',
                                '<td id="tr1td2">Col2</td>',
                            '</tr>',
                            '<tr>',
                                '<td id="tr2td2">Col2</td>',
                            '</tr>',
                            '<tr>',
                                '<td id="tr3td1">Col1</td>',
                                '<td id="tr3td2">Col2</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                '</div>',
            ].join('');
            const contEl = func.makeElement(htmlContent);
            const cellEl = contEl.querySelector('#tr1td1');
            const rng = range.create(cellEl.firstChild, 1);
            table.deleteRow(rng);

            const expectedResult = [
                '<table>',
                    '<tbody>',
                        '<tr>',
                            '<td class="test" id="tr1td1"></td>',
                            '<td id="tr2td2">Col2</td>',
                        '</tr>',
                        '<tr>',
                            '<td id="tr3td1">Col1</td>',
                            '<td id="tr3td2">Col2</td>',
                        '</tr>',
                    '</tbody>',
                '</table>',
            ].join('');
            expect(expectedResult).to.equalsIgnoreCase(contEl.innerHTML);
        });

        it('should delete second row to table with rowspan in line without rowspan', () => {
            const htmlContent = [
                '<div class="note-editable">',
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td rowspan="3" id="tr1td1">Row1-Span</td>',
                                '<td id="tr1td2">Col2</td>',
                            '</tr>',
                            '<tr>',
                                '<td id="tr2td2">Col2</td>',
                            '</tr>',
                            '<tr>',
                                '<td id="tr3td2">Col2</td>',
                            '</tr>',
                            '<tr>',
                                '<td id="tr4td1">Col1</td>',
                                '<td id="tr4td2">Col2</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                '</div>',
            ].join('');
            const contEl = func.makeElement(htmlContent);
            const cellEl = contEl.querySelector('#tr2td2');
            const rng = range.create(cellEl.firstChild, 1);
            table.deleteRow(rng);

            const expectedResult = [
                '<table>',
                    '<tbody>',
                        '<tr>',
                            '<td rowspan="2" id="tr1td1">Row1-Span</td>',
                            '<td id="tr1td2">Col2</td>',
                        '</tr>',
                        '<tr>',
                            '<td id="tr3td2">Col2</td>',
                        '</tr>',
                        '<tr>',
                            '<td id="tr4td1">Col1</td>',
                            '<td id="tr4td2">Col2</td>',
                        '</tr>',
                    '</tbody>',
                '</table>',
            ].join('');
            expect(expectedResult).to.equalsIgnoreCase(contEl.innerHTML);
        });

        it('should delete second col to table with rowspan in 2 rows', () => {
            const htmlContent = [
                '<div class="note-editable">',
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td rowspan="2" id="tr1td1">Col1-Span</td>',
                                '<td id="tr1td2">Col2</td>',
                            '</tr>',
                            '<tr>',
                                '<td id="tr2td2">Col2</td>',
                            '</tr>',
                            '<tr>',
                                '<td id="tr3td1">Col1</td>',
                                '<td id="tr3td2">Col2</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                '</div>',
            ].join('');
            const contEl = func.makeElement(htmlContent);
            const cellEl = contEl.querySelector('#tr1td2');
            const rng = range.create(cellEl.firstChild, 1);
            table.deleteCol(rng);

            const expectedResult = [
                '<table>',
                    '<tbody>',
                        '<tr>',
                            '<td rowspan="2" id="tr1td1">Col1-Span</td>',
                        '</tr>',
                        '<tr></tr>',
                        '<tr>',
                            '<td id="tr3td1">Col1</td>',
                        '</tr>',
                    '</tbody>',
                '</table>',
            ].join('');
            expect(expectedResult).to.equalsIgnoreCase(contEl.innerHTML);
        });

        it('should delete second col to table with rowspan in 2 rows on second row', () => {
            const htmlContent = [
                '<div class="note-editable">',
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td rowspan="2" id="tr1td1">Col1-Span</td>',
                                '<td id="tr1td2">Col2</td>',
                            '</tr>',
                            '<tr>',
                                '<td id="tr2td2">Col2</td>',
                            '</tr>',
                            '<tr>',
                                '<td id="tr3td1">Col1</td>',
                                '<td id="tr3td2">Col2</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                '</div>',
            ].join('');
            const contEl = func.makeElement(htmlContent);
            const cellEl = contEl.querySelector('#tr2td2');
            const rng = range.create(cellEl.firstChild, 1);
            table.deleteCol(rng);

            const expectedResult = [
                '<table>',
                    '<tbody>',
                        '<tr>',
                            '<td rowspan="2" id="tr1td1">Col1-Span</td>',
                        '</tr>',
                        '<tr></tr>',
                        '<tr>',
                            '<td id="tr3td1">Col1</td>',
                        '</tr>',
                    '</tbody>',
                '</table>',
            ].join('');
            expect(expectedResult).to.equalsIgnoreCase(contEl.innerHTML);
        });

        it('should add row on bottom rowspan cell.', () => {
            const htmlContent = [
                '<div class="note-editable">',
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td rowspan="2" id="tr1td1">Col1-Span</td>',
                                '<td id="tr1td2">Col2</td>',
                            '</tr>',
                            '<tr>',
                                '<td id="tr2td2">Col2</td>',
                            '</tr>',
                            '<tr>',
                                '<td id="tr3td1">Col1</td>',
                                '<td id="tr3td2">Col2</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                '</div>',
            ].join('');
            const contEl = func.makeElement(htmlContent);
            const cellEl = contEl.querySelector('#tr2td2');
            const rng = range.create(cellEl.firstChild, 1);
            table.addRow(rng);

            const expectedResult = [
                '<table>',
                    '<tbody>',
                        '<tr>',
                            '<td rowspan="3" id="tr1td1">Col1-Span</td>',
                            '<td id="tr1td2">Col2</td>',
                        '</tr>',
                        '<tr>',
                            '<td id="tr2td2">Col2</td>',
                        '</tr>',
                        '<tr>',
                            '<td><br></td>',
                        '</tr>',
                        '<tr>',
                            '<td id="tr3td1">Col1</td>',
                            '<td id="tr3td2">Col2</td>',
                        '</tr>',
                    '</tbody>',
                '</table>',
            ].join('');
            expect(expectedResult).to.equalsIgnoreCase(contEl.innerHTML);
        });

        it('should add row on bottom colspan cell.', () => {
            const htmlContent = [
                '<div class="note-editable">',
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td colspan="2" id="tr1td1">Col1-Span</td>',
                            '</tr>',
                            '<tr>',
                                '<td id="tr2td1">Col1</td>',
                                '<td id="tr2td2">Col2</td>',
                            '</tr>',
                            '<tr>',
                                '<td id="tr3td1">Col1</td>',
                                '<td id="tr3td2">Col2</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                '</div>',
            ].join('');
            const contEl = func.makeElement(htmlContent);
            const cellEl = contEl.querySelector('#tr1td1');
            const rng = range.create(cellEl.firstChild, 1);
            table.addRow(rng, 'bottom');

            const expectedResult = [
                '<table>',
                    '<tbody>',
                        '<tr>',
                            '<td colspan="2" id="tr1td1">Col1-Span</td>',
                        '</tr>',
                        '<tr>',
                            '<td colspan="2"><br></td>',
                        '</tr>',
                        '<tr>',
                            '<td id="tr2td1">Col1</td>',
                            '<td id="tr2td2">Col2</td>',
                        '</tr>',
                        '<tr>',
                            '<td id="tr3td1">Col1</td>',
                            '<td id="tr3td2">Col2</td>',
                        '</tr>',
                    '</tbody>',
                '</table>',
            ].join('');
            expect(expectedResult).to.equalsIgnoreCase(contEl.innerHTML);
        });

        it('should add row above rowspan cell.', () => {
            const htmlContent = [
                '<div class="note-editable">',
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td rowspan="2" id="tr1td1">Col1-Span</td>',
                                '<td id="tr1td2">Col2</td>',
                            '</tr>',
                            '<tr>',
                                '<td id="tr2td2">Col1</td>',
                            '</tr>',
                            '<tr>',
                                '<td id="tr3td1">Col1</td>',
                                '<td id="tr3td2">Col2</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                '</div>',
            ].join('');
            const contEl = func.makeElement(htmlContent);
            const cellEl = contEl.querySelector('#tr1td1');
            const rng = range.create(cellEl.firstChild, 1);
            table.addRow(rng, 'top');

            const expectedResult = [
                '<table>',
                    '<tbody>',
                        '<tr>',
                            '<td><br></td>',
                            '<td><br></td>',
                        '</tr>',
                        '<tr>',
                            '<td rowspan="2" id="tr1td1">Col1-Span</td>',
                            '<td id="tr1td2">Col2</td>',
                        '</tr>',
                        '<tr>',
                            '<td id="tr2td2">Col1</td>',
                        '</tr>',
                        '<tr>',
                            '<td id="tr3td1">Col1</td>',
                            '<td id="tr3td2">Col2</td>',
                        '</tr>',
                    '</tbody>',
                '</table>',
            ].join('');
            expect(expectedResult).to.equalsIgnoreCase(contEl.innerHTML);
        });

        it('should add row on bottom rowspan cell and with aditional column.', () => {
            const htmlContent = [
                '<div class="note-editable">',
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td rowspan="2" id="tr1td1">Col1-Span</td>',
                                '<td id="tr1td2">Col2</td>',
                            '</tr>',
                            '<tr>',
                                '<td id="tr2td2">Col1</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                '</div>',
            ].join('');
            const contEl = func.makeElement(htmlContent);
            const cellEl = contEl.querySelector('#tr1td1');
            const rng = range.create(cellEl.firstChild, 1);
            table.addRow(rng, 'bottom');

            const expectedResult = [
                '<table>',
                    '<tbody>',
                        '<tr>',
                            '<td rowspan="3" id="tr1td1">Col1-Span</td>',
                            '<td id="tr1td2">Col2</td>',
                        '</tr>',
                        '<tr>',
                            '<td id="tr2td2">Col1</td>',
                        '</tr>',
                        '<tr>',
                            '<td><br></td>',
                        '</tr>',
                    '</tbody>',
                '</table>',
            ].join('');
            expect(expectedResult).to.equalsIgnoreCase(contEl.innerHTML);
        });

        it('should add column on right having rowspan cell and with aditional column.', () => {
            const htmlContent = [
                '<div class="note-editable">',
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td rowspan="2" id="tr1td1">Col1-Span</td>',
                                '<td id="tr1td2">Col2</td>',
                            '</tr>',
                            '<tr>',
                                '<td id="tr2td2">Col1</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                '</div>',
            ].join('');
            const contEl = func.makeElement(htmlContent);
            const cellEl = contEl.querySelector('#tr1td2');
            const rng = range.create(cellEl, 1);
            table.addCol(rng, 'right');

            const expectedResult = [
                '<table>',
                    '<tbody>',
                        '<tr>',
                            '<td rowspan="2" id="tr1td1">Col1-Span</td>',
                            '<td id="tr1td2">Col2</td>',
                            '<td><br></td>',
                        '</tr>',
                        '<tr>',
                            '<td id="tr2td2">Col1</td>',
                            '<td><br></td>',
                        '</tr>',
                    '</tbody>',
                '</table>',
            ].join('');
            expect(expectedResult).to.equalsIgnoreCase(contEl.innerHTML);
        });

        it('should add column on right having rowspan cell and with aditional column with focus on rowspan column.', () => {
            const htmlContent = [
                '<div class="note-editable">',
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td rowspan="2" id="tr1td1">Col1-Span</td>',
                                '<td id="tr1td2">Col2</td>',
                            '</tr>',
                            '<tr>',
                                '<td id="tr2td2">Col1</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                '</div>',
            ].join('');
            const contEl = func.makeElement(htmlContent);
            const cellEl = contEl.querySelector('#tr1td1');
            const rng = range.create(cellEl.firstChild, 1);
            table.addCol(rng, 'right');

            const expectedResult = [
                '<table>',
                    '<tbody>',
                        '<tr>',
                            '<td rowspan="2" id="tr1td1">Col1-Span</td>',
                            '<td rowspan="2"><br></td>',
                            '<td id="tr1td2">Col2</td>',
                        '</tr>',
                        '<tr>',
                            '<td id="tr2td2">Col1</td>',
                        '</tr>',
                    '</tbody>',
                '</table>',
            ].join('');
            expect(expectedResult).to.equalsIgnoreCase(contEl.innerHTML);
        });

        it('should remove column after colspan column.', () => {
            const htmlContent = [
                '<div class="note-editable">',
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td id="tr1td1">Col1</td>',
                                '<td colspan="2" id="tr1td2">Col2-Span</td>',
                                '<td id="tr1td4">Col4</td>',
                            '</tr>',
                            '<tr>',
                                '<td id="tr2td1">Col1</td>',
                                '<td id="tr2td2">Col2</td>',
                                '<td id="tr2td3">Col3</td>',
                                '<td id="tr2td4">Col4</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                '</div>',
            ].join('');
            const contEl = func.makeElement(htmlContent);
            const cellEl = contEl.querySelector('#tr1td4');
            const rng = range.create(cellEl.firstChild, 1);
            table.deleteCol(rng);

            const expectedResult = [
                '<table>',
                    '<tbody>',
                        '<tr>',
                            '<td id="tr1td1">Col1</td>',
                            '<td colspan="2" id="tr1td2">Col2-Span</td>',
                        '</tr>',
                        '<tr>',
                            '<td id="tr2td1">Col1</td>',
                            '<td id="tr2td2">Col2</td>',
                            '<td id="tr2td3">Col3</td>',
                        '</tr>',
                    '</tbody>',
                '</table>',
            ].join('');
            expect(expectedResult).to.equalsIgnoreCase(contEl.innerHTML);
        });

        it('should remove column before colspan column.', () => {
            const htmlContent = [
                '<div class="note-editable">',
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td id="tr1td1">TR1TD1</td>',
                                '<td id="tr1td2" colspan="2">TR1TD2-COLSPAN</td>',
                                '<td id="tr1td4">TR1TD4</td>',
                            '</tr>',
                            '<tr>',
                                '<td id="tr2td1">TR2TD1</td>',
                                '<td id="tr2td2">TR2TD2</td>',
                                '<td id="tr2td3">TR2TD3</td>',
                                '<td id="tr2td4">TR2TD4</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                '</div>',
            ].join('');
            const contEl = func.makeElement(htmlContent);
            const cellEl = contEl.querySelector('#tr1td1');
            const rng = range.create(cellEl.firstChild, 1);
            table.deleteCol(rng);

            const expectedResult = [
                '<table>',
                    '<tbody>',
                        '<tr>',
                            '<td id="tr1td2" colspan="2">TR1TD2-COLSPAN</td>',
                            '<td id="tr1td4">TR1TD4</td>',
                        '</tr>',
                        '<tr>',
                            '<td id="tr2td2">TR2TD2</td>',
                            '<td id="tr2td3">TR2TD3</td>',
                            '<td id="tr2td4">TR2TD4</td>',
                        '</tr>',
                    '</tbody>',
                '</table>',
            ].join('');
            expect(expectedResult).to.equalsIgnoreCase(contEl.innerHTML);
        });

        it('should add column before colspan column.', () => {
            const htmlContent = [
                '<div class="note-editable">',
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td id="tr1td1">TR1TD1</td>',
                                '<td id="tr1td2">TR1TD2</td>',
                            '</tr>',
                            '<tr>',
                                '<td id="tr2td1" colspan="2">TR2TD1</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                '</div>',
            ].join('');
            const contEl = func.makeElement(htmlContent);
            const cellEl = contEl.querySelector('#tr1td1');
            const rng = range.create(cellEl.firstChild, 1);
            table.addCol(rng, 'right');

            const expectedResult = [
                '<table>',
                    '<tbody>',
                        '<tr>',
                            '<td id="tr1td1">TR1TD1</td>',
                            '<td><br></td>',
                            '<td id="tr1td2">TR1TD2</td>',
                        '</tr>',
                        '<tr>',
                            '<td id="tr2td1" colspan="3">TR2TD1</td>',
                        '</tr>',
                    '</tbody>',
                '</table>',
            ].join('');
            expect(expectedResult).to.equalsIgnoreCase(contEl.innerHTML);
        });
    });
});
