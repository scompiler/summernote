import range from '../core/range.ts';

export default class History {
  constructor(context) {
    this.stack = [];
    this.stackOffset = -1;
    this.context = context;
    this.editableEl = context.layoutInfo.editableEl;
  }

  makeSnapshot() {
    const rng = range.create(this.editableEl);
    const emptyBookmark = { s: { path: [], offset: 0 }, e: { path: [], offset: 0 } };

    return {
      contents: this.editableEl.innerHTML,
      bookmark: ((rng && rng.isOnEditable()) ? rng.bookmark(this.editableEl) : emptyBookmark),
    };
  }

  applySnapshot(snapshot) {
    if (snapshot.contents !== null) {
      this.editableEl.innerHTML = snapshot.contents;
    }
    if (snapshot.bookmark !== null) {
      range.createFromBookmark(this.editableEl, snapshot.bookmark).select();
    }
  }

  /**
  * @method rewind
  * Rewinds the history stack back to the first snapshot taken.
  * Leaves the stack intact, so that "Redo" can still be used.
  */
  rewind() {
    // Create snap shot if not yet recorded
    if (this.editableEl.innerHTML !== this.stack[this.stackOffset].contents) {
      this.recordUndo();
    }

    // Return to the first available snapshot.
    this.stackOffset = 0;

    // Apply that snapshot.
    this.applySnapshot(this.stack[this.stackOffset]);
  }

  /**
  *  @method commit
  *  Resets history stack, but keeps current editor's content.
  */
  commit() {
    // Clear the stack.
    this.stack = [];

    // Restore stackOffset to its original value.
    this.stackOffset = -1;

    // Record our first snapshot (of nothing).
    this.recordUndo();
  }

  /**
  * @method reset
  * Resets the history stack completely; reverting to an empty editor.
  */
  reset() {
    // Clear the stack.
    this.stack = [];

    // Restore stackOffset to its original value.
    this.stackOffset = -1;

    // Clear the editable area.
    this.editableEl.innerHTML = '';

    // Record our first snapshot (of nothing).
    this.recordUndo();
  }

  /**
   * undo
   */
  undo() {
    // Create snap shot if not yet recorded
    if (this.editableEl.innerHTML !== this.stack[this.stackOffset].contents) {
      this.recordUndo();
    }

    if (this.stackOffset > 0) {
      this.stackOffset--;
      this.applySnapshot(this.stack[this.stackOffset]);
    }
  }

  /**
   * redo
   */
  redo() {
    if (this.stack.length - 1 > this.stackOffset) {
      this.stackOffset++;
      this.applySnapshot(this.stack[this.stackOffset]);
    }
  }

  /**
   * recorded undo
   */
  recordUndo() {
    this.stackOffset++;

    // Wash out stack after stackOffset
    if (this.stack.length > this.stackOffset) {
      this.stack = this.stack.slice(0, this.stackOffset);
    }

    // Create new snapshot and push it to the end
    this.stack.push(this.makeSnapshot());

    // If the stack size reachs to the limit, then slice it
    if (this.stack.length > this.context.options.historyLimit) {
      this.stack.shift();
      this.stackOffset -= 1;
    }
  }
}
