/**
 * Codeview.spec.js
 * (c) 2015~ Summernote Team
 * summernote may be freely distributed under the MIT license./
 */
import $ from 'jquery';
import chai from 'chai';
import chaidom from 'test/chaidom';
import Context from 'src/js/Context';
import Codeview from 'src/js/module/Codeview';
import { Options } from 'src/js/core/types';
import 'src/styles/bs4/summernote-bs4';
import Summernote from "../../../src/js/class";

chai.use(chaidom);

function loadScript(url: string) {
    const script = document.createElement('script');
    script.src = url;
    script.async = false;
    script.type = 'text/javascript';
    document.head.appendChild(script);

    return script;
}

function unloadScript(script: HTMLScriptElement) {
    document.head.removeChild(script);
}

describe('Codeview', () => {
    const expect = chai.expect;
    let options: Options;
    let codeview: Codeview;
    let context: Context;

    beforeEach(() => {
        $('body').empty(); // important !
        options = $.extend({}, Summernote.meta.options);
        options.codeviewFilter = true;

        const $note = $('<div><p>hello</p></div>').appendTo('body');
        context = new Context($note[0], options);
        codeview = new Codeview(context);
    });

    it('should toggle codeview mode', () => {
        expect(codeview.isActivated()).to.be.false;
        codeview.toggle();
        expect(codeview.isActivated()).to.be.true;
        codeview.toggle();
        expect(codeview.isActivated()).to.be.false;
    });

    it('should show CodeMirror if available', (done) => {
        const codemirror = loadScript('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.41.0/codemirror.js');
        codemirror.onload = function() {
            // need to reinitiate codeview
            codeview = new Codeview(context);
            expect(codeview.isActivated()).to.be.false;
            codeview.toggle();
            expect(codeview.isActivated()).to.be.true;
            expect($('.CodeMirror').length).to.be.equal(1);
            codeview.toggle();
            expect(codeview.isActivated()).to.be.false;
            expect($('.CodeMirror').length).to.be.equal(0);
            unloadScript(codemirror);
            done();
        };
    });

    it('should purify malicious codes', () => {
        expect(codeview.purify('<script>alert("summernote");</script>')).to.equalsIgnoreCase(
            'alert("summernote");'
        );
        expect(codeview.purify('<iframe frameborder="0" src="//www.youtube.com/embed/CXgsA98krxA" width="640" height="360" class="note-video-clip"></iframe>')).to.equalsIgnoreCase(
            '<iframe frameborder="0" src="//www.youtube.com/embed/CXgsA98krxA" width="640" height="360" class="note-video-clip"></iframe>'
        );
        expect(codeview.purify('<iframe frameborder="0" src="//wwwXyoutube.com/embed/CXgsA98krxA" width="640" height="360" class="note-video-clip">')).to.equalsIgnoreCase(
            ''
        );
        expect(codeview.purify('<iframe frameborder="0" src="//www.fake-youtube.com/embed/CXgsA98krxA" width="640" height="360" class="note-video-clip">')).to.equalsIgnoreCase(
            ''
        );
        expect(codeview.purify('<iframe frameborder="0" src="//www.youtube.com/embed/CXgsA98krxA" width="640" height="360" class="note-video-clip"  src  =  "//www.fake-youtube.com/embed/CXgsA98krxA"/>')).to.equalsIgnoreCase(
            ''
        );
    });

    it('should purify can be customized', () => {
        codeview.options = options;
        codeview.options.codeviewIframeFilter = false;
        expect(codeview.purify('<iframe frameborder="0" src="//www.fake-youtube.com/embed/CXgsA98krxA" width="640" height="360" class="note-video-clip">')).to.equalsIgnoreCase(
            '<iframe frameborder="0" src="//www.fake-youtube.com/embed/CXgsA98krxA" width="640" height="360" class="note-video-clip">'
        );
        codeview.options = options;
        codeview.options.codeviewFilterRegex = /\d+/;
        expect(codeview.purify('<script>alert("summernote");</script>')).to.equalsIgnoreCase(
            '<script>alert("summernote");</script>'
        );
        expect(codeview.purify('<span>Tel: 012345678</span>')).to.equalsIgnoreCase(
            '<span>Tel: </span>'
        );
    });
});
