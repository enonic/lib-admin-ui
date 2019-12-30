import {ElementHelper} from './ElementHelper';

export class ImgHelper
    extends ElementHelper {

    private imgEl: HTMLImageElement;

    constructor(element: HTMLImageElement) {
        super(<HTMLElement>element);
        this.imgEl = element;
    }

    static create(): ElementHelper {
        return new ImgHelper(<HTMLImageElement>document.createElement('img'));
    }

    getHTMLElement(): HTMLImageElement {
        return this.imgEl;
    }

    setSrc(value: string): ImgHelper {
        this.imgEl.src = value;
        return this;
    }

    getSrc(): string {
        return this.imgEl.src;
    }

    getCurrentSrc(): string {
        return this.imgEl['currentSrc'];
    }

    getNaturalWidth() {
        return this.imgEl.naturalWidth;
    }

    getNaturalHeight() {
        return this.imgEl.naturalHeight;
    }
}
