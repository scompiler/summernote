import $ from 'jquery';
import Summernote from "./class";

$.fn.extend({
  /**
   * Summernote API
   *
   * @param {Object|String}
   * @return {this}
   */
  summernote: function() {
    const args = [].slice.call(arguments);

    this.each((idx, noteEl) => {
      Summernote.init.apply(Summernote.init, [noteEl, ...args]);
    });

    return this;
  },
});
