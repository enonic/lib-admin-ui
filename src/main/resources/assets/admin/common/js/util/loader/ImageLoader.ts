export class ImageLoader {

    private static cachedImages = new Map<string,HTMLImageElement>();

    static get(url: string, width?: number, height?: number): HTMLImageElement {
        const encodedUrl: string = encodeURI(url);

        return ImageLoader.cachedImages.has(encodedUrl) ? ImageLoader.cachedImages.get(encodedUrl) :
               this.createImage(encodedUrl, width, height);
    }

    private static createImage(url: string, width?: number, height?: number): HTMLImageElement {
        const image: HTMLImageElement = new Image(width, height);
        image.src = url;

        ImageLoader.cachedImages.set(url, image);

        return image;
    }
}
