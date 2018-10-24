module api.dom {

    export class FigureEl
        extends Element {

        private image: ImgEl;
        private caption: FigcaptionEl;

        constructor(image: api.dom.ImgEl, className?: string) {
            super(new NewElementBuilder().setTagName('figure').setClassName(className));

            this.image = image;
            this.appendChild(image);
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
}
