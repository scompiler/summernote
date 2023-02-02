/**
 * Read contents of file as representing URL.
 */
export function readFileAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const fileReader = new FileReader();

        fileReader.addEventListener('load', (domEvent) => resolve(domEvent.target.result as string));
        fileReader.addEventListener('error', (err) => reject(err));
        fileReader.readAsDataURL(file);
    });
}

/**
 * Create `<image>` from url string.
 */
export function createImage(url: string): Promise<HTMLImageElement> {
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
