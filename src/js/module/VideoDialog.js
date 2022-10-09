import env from '../core/env';
import key from '../core/key';
import func from "../core/func";
import Summernote from "../class";

export default class VideoDialog {
  constructor(context) {
    this.context = context;

    this.ui = Summernote.meta.ui;
    this.bodyEl = document.body;
    this.options = context.options;
    this.lang = this.options.langInfo;
  }

  initialize() {
    const containerEl = this.options.dialogsInBody ? this.bodyEl : this.options.container;
    const body = [
      '<div class="form-group note-form-group row-fluid">',
        `<label for="note-dialog-video-url-${this.options.id}" class="note-form-label">${this.lang.video.url} <small class="text-muted">${this.lang.video.providers}</small></label>`,
        `<input id="note-dialog-video-url-${this.options.id}" class="note-video-url form-control note-form-control note-input" type="text"/>`,
      '</div>',
    ].join('');
    const buttonClass = 'btn btn-primary note-btn note-btn-primary note-video-btn';
    const footer = `<input type="button" href="#" class="${buttonClass}" value="${this.lang.video.insert}" disabled>`;

    this.dialogEl = this.ui.dialog({
      title: this.lang.video.insert,
      fade: this.options.dialogsFade,
      body: body,
      footer: footer,
    }).render2();
    containerEl.appendChild(this.dialogEl);
  }

  destroy() {
    this.ui.hideDialog(this.dialogEl);
    this.dialogEl.remove();
  }

  createVideoNode(url) {
    // video url patterns(youtube, instagram, vimeo, dailymotion, youku, peertube, mp4, ogg, webm)
    const ytRegExp = /\/\/(?:(?:www|m)\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w|-]{11})(?:(?:[\?&]t=)(\S+))?$/;
    const ytRegExpForStart = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/;
    const ytMatch = url.match(ytRegExp);

    const gdRegExp = /(?:\.|\/\/)drive\.google\.com\/file\/d\/(.[a-zA-Z0-9_-]*)\/view/;
    const gdMatch = url.match(gdRegExp);

    const igRegExp = /(?:www\.|\/\/)instagram\.com\/p\/(.[a-zA-Z0-9_-]*)/;
    const igMatch = url.match(igRegExp);

    const vRegExp = /\/\/vine\.co\/v\/([a-zA-Z0-9]+)/;
    const vMatch = url.match(vRegExp);

    const vimRegExp = /\/\/(player\.)?vimeo\.com\/([a-z]*\/)*(\d+)[?]?.*/;
    const vimMatch = url.match(vimRegExp);

    const dmRegExp = /.+dailymotion.com\/(video|hub)\/([^_]+)[^#]*(#video=([^_&]+))?/;
    const dmMatch = url.match(dmRegExp);

    const youkuRegExp = /\/\/v\.youku\.com\/v_show\/id_(\w+)=*\.html/;
    const youkuMatch = url.match(youkuRegExp);

    const peerTubeRegExp =/\/\/(.*)\/videos\/watch\/([^?]*)(?:\?(?:start=(\w*))?(?:&stop=(\w*))?(?:&loop=([10]))?(?:&autoplay=([10]))?(?:&muted=([10]))?)?/;
    const peerTubeMatch = url.match(peerTubeRegExp);

    const qqRegExp = /\/\/v\.qq\.com.*?vid=(.+)/;
    const qqMatch = url.match(qqRegExp);

    const qqRegExp2 = /\/\/v\.qq\.com\/x?\/?(page|cover).*?\/([^\/]+)\.html\??.*/;
    const qqMatch2 = url.match(qqRegExp2);

    const mp4RegExp = /^.+.(mp4|m4v)$/;
    const mp4Match = url.match(mp4RegExp);

    const oggRegExp = /^.+.(ogg|ogv)$/;
    const oggMatch = url.match(oggRegExp);

    const webmRegExp = /^.+.(webm)$/;
    const webmMatch = url.match(webmRegExp);

    const fbRegExp = /(?:www\.|\/\/)facebook\.com\/([^\/]+)\/videos\/([0-9]+)/;
    const fbMatch = url.match(fbRegExp);

    let videoEl;

    if (ytMatch && ytMatch[1].length === 11) {
      const youtubeId = ytMatch[1];
      let start = 0;
      if (typeof ytMatch[2] !== 'undefined') {
        const ytMatchForStart = ytMatch[2].match(ytRegExpForStart);
        if (ytMatchForStart) {
          for (let n = [3600, 60, 1], i = 0, r = n.length; i < r; i++) {
            start += (typeof ytMatchForStart[i + 1] !== 'undefined' ? n[i] * parseInt(ytMatchForStart[i + 1], 10) : 0);
          }
        }
      }
      videoEl = func.makeElement('<iframe>');
      videoEl.setAttribute('frameborder', '0');
      videoEl.setAttribute('src', '//www.youtube.com/embed/' + youtubeId + (start > 0 ? '?start=' + start : ''));
      videoEl.setAttribute('width', '640');
      videoEl.setAttribute('height', '360');
    } else if (gdMatch && gdMatch[0].length) {
      videoEl = func.makeElement('<iframe>');
      videoEl.setAttribute('frameborder', '0');
      videoEl.setAttribute('src', 'https://drive.google.com/file/d/' + gdMatch[1] + '/preview');
      videoEl.setAttribute('width', '640');
      videoEl.setAttribute('height', '360');
    } else if (igMatch && igMatch[0].length) {
      videoEl = func.makeElement('<iframe>');
      videoEl.setAttribute('frameborder', '0');
      videoEl.setAttribute('src', 'https://instagram.com/p/' + igMatch[1] + '/embed/');
      videoEl.setAttribute('width', '612');
      videoEl.setAttribute('height', '710');
      videoEl.setAttribute('scrolling', 'no');
      videoEl.setAttribute('allowtransparency', 'true');
    } else if (vMatch && vMatch[0].length) {
      videoEl = func.makeElement('<iframe>');
      videoEl.setAttribute('frameborder', '0');
      videoEl.setAttribute('src', vMatch[0] + '/embed/simple');
      videoEl.setAttribute('width', '600');
      videoEl.setAttribute('height', '600');
      videoEl.setAttribute('class', 'vine-embed');
    } else if (vimMatch && vimMatch[3].length) {
      videoEl = func.makeElement('<iframe webkitallowfullscreen mozallowfullscreen allowfullscreen>');
      videoEl.setAttribute('frameborder', '0');
      videoEl.setAttribute('src', '//player.vimeo.com/video/' + vimMatch[3]);
      videoEl.setAttribute('width', '640');
      videoEl.setAttribute('height', '360');
    } else if (dmMatch && dmMatch[2].length) {
      videoEl = func.makeElement('<iframe>');
      videoEl.setAttribute('frameborder', '0');
      videoEl.setAttribute('src', '//www.dailymotion.com/embed/video/' + dmMatch[2]);
      videoEl.setAttribute('width', '640');
      videoEl.setAttribute('height', '360');
    } else if (youkuMatch && youkuMatch[1].length) {
      videoEl = func.makeElement('<iframe webkitallowfullscreen mozallowfullscreen allowfullscreen>');
      videoEl.setAttribute('frameborder', '0');
      videoEl.setAttribute('height', '498');
      videoEl.setAttribute('width', '510');
      videoEl.setAttribute('src', '//player.youku.com/embed/' + youkuMatch[1]);
    } else if (peerTubeMatch && peerTubeMatch[0].length){
      let begin = 0;
      if (peerTubeMatch[2] !== 'undefined') begin = peerTubeMatch[2];
      let end =0;
      if (peerTubeMatch[3] !== 'undefined') end = peerTubeMatch[3];
      let loop = 0;
      if (peerTubeMatch[4] !== 'undefined') loop = peerTubeMatch[4];
      let autoplay = 0;
      if (peerTubeMatch[5] !== 'undefined') autoplay = peerTubeMatch[5];
      let muted = 0;
      if (peerTubeMatch[6] !== 'undefined') muted = peerTubeMatch[6];

      videoEl = func.makeElement('<iframe allowfullscreen sandbox="allow-same-origin allow-scripts allow-popups">');
      videoEl.setAttribute('frameborder', '0');
      videoEl.setAttribute('src', '//'+ peerTubeMatch[1] +'/videos/embed/' + peerTubeMatch[2]+"?loop="+loop+"&autoplay="+autoplay+"&muted="+muted +(begin > 0 ? '&start=' + begin : '')+(end > 0 ? '&end=' + end : ''));
      videoEl.setAttribute('width', '560');
      videoEl.setAttribute('height', '315');
    }else if ((qqMatch && qqMatch[1].length) || (qqMatch2 && qqMatch2[2].length)) {
      const vid = ((qqMatch && qqMatch[1].length) ? qqMatch[1] : qqMatch2[2]);

      videoEl = func.makeElement('<iframe webkitallowfullscreen mozallowfullscreen allowfullscreen>');
      videoEl.setAttribute('frameborder', '0');
      videoEl.setAttribute('height', '310');
      videoEl.setAttribute('width', '500');
      videoEl.setAttribute('src', 'https://v.qq.com/txp/iframe/player.html?vid=' + vid + '&amp;auto=0');
    } else if (mp4Match || oggMatch || webmMatch) {
      videoEl = func.makeElement('<video controls>');
      videoEl.setAttribute('src', url);
      videoEl.setAttribute('width', '640');
      videoEl.setAttribute('height', '360');
    } else if (fbMatch && fbMatch[0].length) {
      videoEl = func.makeElement('<iframe>');
      videoEl.setAttribute('frameborder', '0');
      videoEl.setAttribute('src', 'https://www.facebook.com/plugins/video.php?href=' + encodeURIComponent(fbMatch[0]) + '&show_text=0&width=560');
      videoEl.setAttribute('width', '560');
      videoEl.setAttribute('height', '301');
      videoEl.setAttribute('scrolling', 'no');
      videoEl.setAttribute('allowtransparency', 'true');
    } else {
      // this is not a known video link. Now what, Cat? Now what?
      return false;
    }

    videoEl.classList.add('note-video-clip');

    return videoEl;
  }

  show() {
    const text = this.context.invoke('editor.getSelectedText');
    this.context.invoke('editor.saveRange');
    this.showVideoDialog(text).then((url) => {
      // [workaround] hide dialog before restore range for IE range focus
      this.ui.hideDialog(this.dialogEl);
      this.context.invoke('editor.restoreRange');

      // build node
      const nodeEl = this.createVideoNode(url);

      if (nodeEl) {
        // insert video node
        this.context.invoke('editor.insertNode', nodeEl);
      }
    }).catch(() => {
      this.context.invoke('editor.restoreRange');
    });
  }

  /**
   * show video dialog
   *
   * @return {Promise}
   */
  showVideoDialog(/* text */) {
    return new Promise((resolve) => {
      const videoUrlEl = this.dialogEl.querySelector('.note-video-url');
      const videoBtnEl = this.dialogEl.querySelector('.note-video-btn');

      let listeners = [];

      const listen = (node, types, callback) => {
        types.trim().replace(/ +/, ' ').split(' ').forEach((type) => {
          node.addEventListener(type, callback);

          listeners.push({node, type, callback});
        });
      };

      const bindEnterKey = (inputEl, btnEl) => {
        listen(inputEl, 'keypress', (domEvent) => {
          if (domEvent.keyCode === key.code.ENTER) {
            domEvent.preventDefault();
            btnEl.click();
          }
        });
      };

      this.ui.onDialogShown(this.dialogEl, () => {
        this.context.triggerEvent('dialog.shown');

        listen(videoUrlEl, 'input paste propertychange', () => {
          this.ui.toggleBtn(videoBtnEl, videoUrlEl.value);
        });

        if (!env.isSupportTouch) {
          videoUrlEl.focus();
        }

        listen(videoBtnEl, 'click', (domEvent) => {
          domEvent.preventDefault();
          resolve(videoUrlEl.value);
        });

        bindEnterKey(videoUrlEl, videoBtnEl);
      });

      this.ui.onDialogHidden(this.dialogEl, () => {
        listeners.forEach(x => x.node.removeEventListener(x.type, x.callback));
        listeners = [];
      });

      this.ui.showDialog(this.dialogEl);
    });
  }
}
