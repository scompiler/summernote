(function() {
    // Extends plugins for adding hello.
    //  - plugin is external module for customizing.
    window.Summernote.meta.plugins['hello'] = function(context) {
        const self = this;
        const ui = window.Summernote.meta.ui;

        const editorEl = context.layoutInfo.editorEl;
        const options = context.options;
        const lang = options.langInfo;

        const KEY = {
            UP: 38,
            DOWN: 40,
            LEFT: 37,
            RIGHT: 39,
            ENTER: 13,
        };
        const COLUMN_LENGTH = 12;
        const COLUMN_WIDTH = 35;

        let currentColumn = 0;
        let currentRow = 0;
        let totalColumn = 0;
        let totalRow = 0;

        // special characters data set
        const specialCharDataSet = [
            '&quot;', '&amp;', '&lt;', '&gt;', '&iexcl;', '&cent;',
            '&pound;', '&curren;', '&yen;', '&brvbar;', '&sect;',
            '&uml;', '&copy;', '&ordf;', '&laquo;', '&not;',
            '&reg;', '&macr;', '&deg;', '&plusmn;', '&sup2;',
            '&sup3;', '&acute;', '&micro;', '&para;', '&middot;',
            '&cedil;', '&sup1;', '&ordm;', '&raquo;', '&frac14;',
            '&frac12;', '&frac34;', '&iquest;', '&times;', '&divide;',
            '&fnof;', '&circ;', '&tilde;', '&ndash;', '&mdash;',
            '&lsquo;', '&rsquo;', '&sbquo;', '&ldquo;', '&rdquo;',
            '&bdquo;', '&dagger;', '&Dagger;', '&bull;', '&hellip;',
            '&permil;', '&prime;', '&Prime;', '&lsaquo;', '&rsaquo;',
            '&oline;', '&frasl;', '&euro;', '&image;', '&weierp;',
            '&real;', '&trade;', '&alefsym;', '&larr;', '&uarr;',
            '&rarr;', '&darr;', '&harr;', '&crarr;', '&lArr;',
            '&uArr;', '&rArr;', '&dArr;', '&hArr;', '&forall;',
            '&part;', '&exist;', '&empty;', '&nabla;', '&isin;',
            '&notin;', '&ni;', '&prod;', '&sum;', '&minus;',
            '&lowast;', '&radic;', '&prop;', '&infin;', '&ang;',
            '&and;', '&or;', '&cap;', '&cup;', '&int;',
            '&there4;', '&sim;', '&cong;', '&asymp;', '&ne;',
            '&equiv;', '&le;', '&ge;', '&sub;', '&sup;',
            '&nsub;', '&sube;', '&supe;', '&oplus;', '&otimes;',
            '&perp;', '&sdot;', '&lceil;', '&rceil;', '&lfloor;',
            '&rfloor;', '&loz;', '&spades;', '&clubs;', '&hearts;',
            '&diams;',
        ];

        context.memo('button.specialchars', function() {
            return ui.button({
                contents: '<i class="fa fa-font fa-flip-vertical"></i>',
                tooltip: lang.specialChar.specialChar,
                click: function() {
                    self.show();
                },
            }).render2();
        });

        /**
         * Make Special Characters Table
         */
        this.makeSpecialCharSetTable = function(): HTMLTableElement {
            const tableEl = document.createElement('table');

            specialCharDataSet.forEach((text, idx) => {
                const td = document.createElement('td');

                td.classList.add('note-specialchar-node');

                const tr =(idx % COLUMN_LENGTH === 0)
                    ? document.createElement('tr')
                    : tableEl.querySelector('tr:last-child');

                const buttonEl = ui.button({
                    callback2: function(nodeEls) {
                        nodeEls.forEach((nodeEl) => {
                            if (!(nodeEl instanceof HTMLElement)) {
                                return;
                            }

                            nodeEl.innerHTML = text;
                            nodeEl.setAttribute('title', text);
                            nodeEl.setAttribute('data-value', encodeURIComponent(text));
                            nodeEl.style.width = `${COLUMN_WIDTH}px`;
                            nodeEl.style.marginRight = `2px`;
                            nodeEl.style.marginBottom = `2px`;
                        });
                    },
                }).render2();

                td.appendChild(buttonEl);
                tr.appendChild(td);

                if (idx % COLUMN_LENGTH === 0) {
                    tableEl.appendChild(tr);
                }
            });

            totalRow = tableEl.querySelectorAll('tr').length;
            totalColumn = COLUMN_LENGTH;

            return tableEl;
        };

        this.initialize = function() {
            const containerEl = options.dialogsInBody ? document.body : editorEl;
            const body = '<div class="form-group row-fluid">' + this.makeSpecialCharSetTable().outerHTML + '</div>';

            this.dialogEl = ui.dialog({
                title: lang.specialChar.select,
                body: body,
            }).render2();

            containerEl.appendChild(this.dialogEl);
        };

        this.show = function() {
            const text = context.invoke('editor.getSelectedText');
            context.invoke('editor.saveRange');
            this.showSpecialCharDialog(text).then(function(selectChar: string) {
                context.invoke('editor.restoreRange');

                // build node
                const nodeEl = document.createElement('span');

                nodeEl.innerHTML = selectChar;

                if (nodeEl) {
                    // insert video node
                    context.invoke('editor.insertNode', nodeEl);
                }
            }).catch(function() {
                context.invoke('editor.restoreRange');
            });
        };

        /**
         * Show image dialog.
         */
        this.showSpecialCharDialog = function(text: string): Promise<string> {
            return new Promise((resolve, reject) => {
                const specialCharDialogEl = self.dialogEl as HTMLElement;
                const specialCharNodes = specialCharDialogEl.querySelectorAll('.note-specialchar-node');
                let selectedNode: Element = null;
                const ARROW_KEYS = [KEY.UP, KEY.DOWN, KEY.LEFT, KEY.RIGHT];
                const ENTER_KEY = KEY.ENTER;

                function addActiveClass(targetEl: Element) {
                    if (!targetEl) {
                        return;
                    }
                    targetEl.querySelector('button')?.classList.add('active');

                    selectedNode = targetEl;
                }

                function removeActiveClass(targetEl: Element) {
                    targetEl.querySelector('button')?.classList.remove('active');

                    selectedNode = null;
                }

                // find next node
                function findNextNode(row: number, column: number): Element | null {
                    let findNode = null;

                    specialCharNodes.forEach((nodeEl, idx) => {
                        const findRow = Math.ceil((idx + 1) / COLUMN_LENGTH);
                        const findColumn = ((idx + 1) % COLUMN_LENGTH === 0) ? COLUMN_LENGTH : (idx + 1) % COLUMN_LENGTH;
                        if (findRow === row && findColumn === column) {
                            findNode = nodeEl;
                            return false;
                        }
                    });

                    return findNode;
                }

                function arrowKeyHandler(keyCode: number) {
                    // left, right, up, down key
                    const lastRowColumnLength = specialCharNodes.length % totalColumn;

                    if (KEY.LEFT === keyCode) {
                        if (currentColumn > 1) {
                            currentColumn = currentColumn - 1;
                        } else if (currentRow === 1 && currentColumn === 1) {
                            currentColumn = lastRowColumnLength;
                            currentRow = totalRow;
                        } else {
                            currentColumn = totalColumn;
                            currentRow = currentRow - 1;
                        }
                    } else if (KEY.RIGHT === keyCode) {
                        if (currentRow === totalRow && lastRowColumnLength === currentColumn) {
                            currentColumn = 1;
                            currentRow = 1;
                        } else if (currentColumn < totalColumn) {
                            currentColumn = currentColumn + 1;
                        } else {
                            currentColumn = 1;
                            currentRow = currentRow + 1;
                        }
                    } else if (KEY.UP === keyCode) {
                        if (currentRow === 1 && lastRowColumnLength < currentColumn) {
                            currentRow = totalRow - 1;
                        } else {
                            currentRow = currentRow - 1;
                        }
                    } else if (KEY.DOWN === keyCode) {
                        currentRow = currentRow + 1;
                    }

                    if (currentRow === totalRow && currentColumn > lastRowColumnLength) {
                        currentRow = 1;
                    } else if (currentRow > totalRow) {
                        currentRow = 1;
                    } else if (currentRow < 1) {
                        currentRow = totalRow;
                    }

                    const nextNode = findNextNode(currentRow, currentColumn);

                    if (nextNode) {
                        removeActiveClass(selectedNode);
                        addActiveClass(nextNode);
                    }
                }

                function enterKeyHandler() {
                    if (!selectedNode) {
                        return;
                    }

                    resolve(decodeURIComponent(selectedNode.querySelector('button').getAttribute('data-value')));

                    ui.hideDialog(self.dialogEl);
                }

                function keyDownEventHandler(event: KeyboardEvent) {
                    event.preventDefault();
                    const keyCode = event.keyCode;
                    if (keyCode === undefined || keyCode === null) {
                        return;
                    }
                    // check arrowKeys match
                    if (ARROW_KEYS.indexOf(keyCode) > -1) {
                        if (selectedNode === null) {
                            addActiveClass(specialCharNodes[0]);
                            currentColumn = 1;
                            currentRow = 1;
                            return;
                        }
                        arrowKeyHandler(keyCode);
                    } else if (keyCode === ENTER_KEY) {
                        enterKeyHandler();
                    }
                    return false;
                }

                // remove class
                for (let i = 0; i < specialCharNodes.length; i++) {
                    removeActiveClass(specialCharNodes[i]);
                }

                // find selected node
                if (text) {
                    for (let i = 0; i < specialCharNodes.length; i++) {
                        const checkNode = specialCharNodes[i];
                        if (checkNode.textContent === text) {
                            addActiveClass(checkNode);
                            currentRow = Math.ceil((i + 1) / COLUMN_LENGTH);
                            currentColumn = (i + 1) % COLUMN_LENGTH;
                        }
                    }
                }

                const onClick = function(event: MouseEvent) {
                    if (!(event.currentTarget instanceof HTMLElement)) {
                        return;
                    }

                    const value = event.currentTarget.querySelector('button').getAttribute('data-value');

                    event.preventDefault();
                    resolve(decodeURIComponent(value));
                    ui.hideDialog(self.dialogEl);
                };

                ui.onDialogShown(self.dialogEl, function() {
                    document.addEventListener('keydown', keyDownEventHandler);

                    for (let i = 0; i < specialCharNodes.length; i++) {
                        specialCharNodes[i].addEventListener('click', onClick);
                    }
                });

                ui.onDialogHidden(self.dialogEl, function() {
                    for (let i = 0; i < specialCharNodes.length; i++) {
                        specialCharNodes[i].removeEventListener('click', onClick);
                    }

                    document.removeEventListener('keydown', keyDownEventHandler);

                    reject();
                });

                ui.showDialog(self.dialogEl);
            });
        };
    };
})();
