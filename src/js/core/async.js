/**
 * @method readFileAsDataURL
 *
 * read contents of file as representing URL
 *
 * @param {File} file
 * @return {Promise} - then: dataUrl
 */
export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();

    fileReader.addEventListener('load', (event) => {
      const dataURL = event.target.result;
      resolve(dataURL);
    });
    fileReader.addEventListener('error', (err) => {
      reject(err);
    });

    fileReader.readAsDataURL(file);
  });
}

/**
 * @method createImage
 *
 * create `<image>` from url string
 *
 * @param {String} url
 * @return {Promise} - then: $image
 */
export function createImage(url) {
  return new Promise((resolve, reject) => {
    const imgEl = document.createElement('img');

    const onLoad = () => {
      imgEl.removeEventListener('error', onError);
      imgEl.removeEventListener('abort', onError);

      resolve(imgEl);
    };
    const onError = () => {
      imgEl.removeEventListener('load', onLoad);
      imgEl.remove();

      reject(imgEl);
    };

    imgEl.addEventListener('load', onLoad);
    imgEl.addEventListener('error', onError);
    imgEl.addEventListener('abort', onError);

    imgEl.style.display = 'none';

    document.body.appendChild(imgEl);

    imgEl.src = url;
  });
}
