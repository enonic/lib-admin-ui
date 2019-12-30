import {Element, NewElementBuilder} from './Element';
import {ImgEl} from './ImgEl';

export class FigureEl
    extends Element {

    private className: string;
    private image: ImgEl;
    private caption: FigcaptionEl;

    constructor(className?: string) {
        super(new NewElementBuilder().setTagName('figure'));

        if (className) {
            super.setClass(className);

            this.className = className;
        }
    }

    setClass(className: string): Element {
        return super.setClass((this.className ? this.className + ' ' : '') + className);
    }

    setImage(image: ImgEl, clearCaption: boolean = true) {

        if (this.image) {
            this.image.replaceWith(image);
        } else {
            this.appendChild(image);
        }
        if (!!this.caption && clearCaption) {
            this.removeChild(this.caption);
        }

        this.image = image;
    }

    setCaption(caption: string) {

        if (this.caption) {
            this.caption.setCaption(caption);
        } else {
            this.caption = new FigcaptionEl(caption);
            this.insertAfterEl(this.image);
        }
    }

    getImage(): ImgEl {
        return this.image;
    }

    removeChildren() {
        delete this.image;
        delete this.caption;

        return super.removeChildren();
    }
}

class FigcaptionEl
    extends Element {

    constructor(caption: string) {
        super(new NewElementBuilder().setTagName('figcaption'));

        this.setCaption(caption);
    }

    setCaption(caption: string) {
        this.setHtml(caption);
    }
}
