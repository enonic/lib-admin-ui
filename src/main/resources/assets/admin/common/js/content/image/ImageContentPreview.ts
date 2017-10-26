module api.content.image {

    import Element = api.dom.Element;
    import ElementHelper = api.dom.ElementHelper;
    import ImgEl = api.dom.ImgEl;
    import ContentImageUrlResolver = api.content.util.ContentImageUrlResolver;
    import LoadMask = api.ui.mask.LoadMask;

    export class ImageContentPreview
        extends api.dom.DivEl {

        private static PADDING: number = 20;
        private static TIMEOUT: number = 300;

        public static debug: boolean = true;

        private image: ImgEl;

        private thumb: ElementHelper;

        private mask: LoadMask;

        private resolver: api.content.util.ContentImageUrlResolver;

        private timeout: number;

        private selectListeners: { (id: string): void }[] = [];

        constructor() {
            super('image-content-preview');
            this.resolver = new ContentImageUrlResolver();
            this.image = new ImgEl();
            this.image.onLoaded(() => {
                this.mask.hide();
                if (!this.image.isPlaceholder()) {
                    this.positionFor(this.thumb);
                }
            });
            this.mask = new LoadMask(this);
            this.appendChildren<Element>(this.image, this.mask);

            this.onMouseOver((e: MouseEvent) => this.clearTimeout());
            this.onMouseOut((e: MouseEvent) => this.delayHide());
            this.onClicked((e: MouseEvent) => {
                this.notifySelected(this.thumb.getAttribute('data-contentid'));
                this.hide();
            });
        }

        private notifySelected(id: string) {
            this.selectListeners.forEach(listener => listener(id));
        }

        onSelected(listener: (id: string) => void) {
            this.selectListeners.push(listener);
        }

        unSelected(listener: (id: string) => void) {
            this.selectListeners = this.selectListeners.filter(item => item !== listener);
        }

        showFor(img: ElementHelper) {
            if (ImageContentPreview.debug) {
                console.debug('ImageContentPreview.showFor:', img);
            }
            this.clearTimeout();

            if (!this.isVisible()) {
                api.dom.Body.get().appendChild(this);
            }

            const imageId = img.getAttribute('data-contentid');

            this.thumb = img;
            const maxWidth = this.positionFor(img);
            const biggestSize = this.getBiggestSize(img, maxWidth);
            this.addClass('shown');
            const imageUrl = this.resolver.setContentId(new ContentId(imageId)).setSize(biggestSize).resolve();
            this.image.setSrc(imageUrl);
            this.mask.show();

            const leaveListener = (outE: MouseEvent) => {
                img.removeEventListener('mouseout', leaveListener);
                this.delayHide();
            };

            img.addEventListener('mouseout', leaveListener);
        }

        private delayHide() {
            this.timeout = setTimeout(() => {
                this.hide();
                this.timeout = undefined;
            }, ImageContentPreview.TIMEOUT);
        }

        private clearTimeout() {
            if (this.timeout) {
                clearTimeout(this.timeout);
                this.timeout = undefined;
            }
        }

        private getBiggestSize(img: ElementHelper, maxWidth: number): number {
            const imgDims = img.getDimensions();
            // multiply width by height/width ratio if it's bigger than 1
            const ratio = imgDims.height / imgDims.width;
            return ratio > 1 ? Math.floor(maxWidth * ratio) : maxWidth;
        }

        private positionFor(img: ElementHelper) {
            if (ImageContentPreview.debug) {
                console.debug('ImageContentPreview.positionFor:', img);
            }

            const imgDims = img.getDimensions();
            const bodyDims = api.dom.Body.get().getEl().getDimensions();
            const el = this.getEl();
            const previewDims = el.getDimensions();

            const leftSpace = imgDims.left - ImageContentPreview.PADDING;
            const leftSide = Math.max(leftSpace - previewDims.width, 0);
            const rightSide = Math.min(imgDims.left + imgDims.width + ImageContentPreview.PADDING, bodyDims.width - previewDims.width);
            const rightSpace = bodyDims.width - rightSide;

            const topSpace = imgDims.top - ImageContentPreview.PADDING;
            const topSide = topSpace - (previewDims.height - imgDims.height) / 2;

            el.setLeftPx(leftSpace > rightSpace ? leftSide : rightSide).setTopPx(Math.max(topSide, 0));
            return Math.max(leftSpace, rightSpace);
        }

        hide() {
            if (ImageContentPreview.debug) {
                console.debug('ImageContentPreview.hide: starting animation', this.thumb);
            }
            this.removeClass('shown');
            this.thumb = undefined;
            setTimeout(() => {
                if (ImageContentPreview.debug) {
                    console.debug('ImageContentPreview.hide: animation finished, removing from dom');
                }
                // mouse might have returned during animation time
                if (!this.thumb) {
                    this.image.setSrc(ImgEl.PLACEHOLDER);
                    api.dom.Body.get().removeChild(this);
                }
            }, ImageContentPreview.TIMEOUT);
        }
    }
}
