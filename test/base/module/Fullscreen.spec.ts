/**
 * Fullscreen.spec.js
 * (c) 2015~ Summernote Team
 * summernote may be freely distributed under the MIT license./
 */

import chai from 'chai';
import Context from 'src/js/Context';
import Fullscreen from 'src/js/module/Fullscreen';
import 'src/styles/bs5/summernote-bs5';
import Summernote from "src/js/class";
import func from "src/js/core/func";

describe('Fullscreen', () => {
    const expect = chai.expect;
    let fullscreen: Fullscreen;
    let context: Context;

    beforeEach(() => {
        const options = {...Summernote.meta.options};
        context = new Context(func.makeElement('<div><p>hello</p></div>'), options);
        fullscreen = new Fullscreen(context);
    });

    it('should toggle fullscreen mode', () => {
        expect(fullscreen.isFullscreen()).to.be.false;
        fullscreen.toggle();
        expect(fullscreen.isFullscreen()).to.be.true;
        fullscreen.toggle();
        expect(fullscreen.isFullscreen()).to.be.false;
    });
});
