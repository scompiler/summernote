/**
 * VideoDialog.spec.js
 * (c) 2015~ Summernote Team
 * summernote may be freely distributed under the MIT license./
 */
import chai from 'chai';
import Context from 'src/js/Context';
import VideoDialog from 'src/js/module/VideoDialog';
import 'src/styles/bs5/summernote-bs5';
import Summernote from "src/js/class";
import func from 'src/js/core/func';

describe('VideoDialog', () => {
    const expect = chai.expect;
    let context: Context;
    let videoDialog: VideoDialog;

    function expectUrl(source: string, target: string) {
        const iframe = videoDialog.createVideoNode(source) as HTMLIFrameElement;
        expect(iframe).to.not.equal(false);
        expect(iframe.tagName).to.equal('IFRAME');
        expect(iframe.src).to.be.have.string(target);
    }

    beforeEach(() => {
        const noteEl = func.makeElement('<div></div>');
        document.body.appendChild(noteEl);
        const options = {...Summernote.meta.options};
        options.toolbar = [
            ['video', ['video']],
        ];
        context = new Context(noteEl, options);
        context.initialize();

        videoDialog = new VideoDialog(context);
    });

    describe('#createVideoNode', () => {
        it('should get false when insert invalid urls', () => {
            expect(videoDialog.createVideoNode('http://www.google.com')).to.equal(false);
            expect(videoDialog.createVideoNode('http://www.youtube.com')).to.equal(false);
            expect(videoDialog.createVideoNode('http://www.facebook.com')).to.equal(false);
        });

        it('should get proper iframe src when insert valid video urls', () => {
            // YouTube
            expectUrl('https://www.youtube.com/watch?v=jNQXAC9IVRw',
                '//www.youtube.com/embed/jNQXAC9IVRw');
            // Instagram
            expectUrl('https://www.instagram.com/p/Bi9cbsxjn-F',
                '//instagram.com/p/Bi9cbsxjn-F/embed/');
            // v.qq.com
            expectUrl('http://v.qq.com/cover/6/640ewqy2v071ppd.html?vid=f0196y2b2cx',
                '//v.qq.com/txp/iframe/player.html?vid=f0196y2b2cx&amp;auto=0');
            expectUrl('http://v.qq.com/x/page/p0330y279lm.html',
                '//v.qq.com/txp/iframe/player.html?vid=p0330y279lm&amp;auto=0');
            // Facebook
            expectUrl('https://www.facebook.com/Engineering/videos/631826881803/',
                '//www.facebook.com/plugins/video.php?href=www.facebook.com%2FEngineering%2Fvideos%2F631826881803');
        });

        it('should be embedded start parameter when insert YouTube video with t', () => {
            expectUrl('https://youtu.be/wZZ7oFKsKzY?t=4h2m42s',
                '//www.youtube.com/embed/wZZ7oFKsKzY?start=14562');
        });
    });
});
