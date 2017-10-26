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

        public static debug: boolean = false;

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
                if (!this.image.isPlaceholder()) {
                    this.mask.hide();
                }
                if (this.isVisible()) {
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

        showFor(thumb: ElementHelper) {
            if (ImageContentPreview.debug) {
                console.debug('ImageContentPreview.showFor:', thumb);
            }
            this.clearTimeout();

            if (!this.isVisible()) {
                api.dom.Body.get().appendChild(this);
                // mask removes itself when masked element is removed so add it again
                this.appendChild(this.mask);
            }

            const imageId = thumb.getAttribute('data-contentid');

            const maxWidth = this.positionFor(thumb);
            const biggestSize = this.getBiggestSize(thumb, maxWidth);
            this.addClass('shown');
            const imageUrl = this.resolver.setContentId(new ContentId(imageId)).setSize(biggestSize).resolve();
            this.image.setSrc(imageUrl);
            this.mask.show();
            this.thumb = thumb;

            const leaveListener = (outE: MouseEvent) => {
                thumb.removeEventListener('mouseout', leaveListener);
                this.delayHide();
            };

            thumb.addEventListener('mouseout', leaveListener);
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

        private positionFor(thumb: ElementHelper) {
            if (ImageContentPreview.debug) {
                console.debug('ImageContentPreview.positionFor:', thumb);
            }

            const thumbDims = thumb.getDimensions();
            const bodyDims = api.dom.Body.get().getEl().getDimensions();
            const imgDims = this.image.getEl().getDimensions();
            const el = this.getEl();

            const leftSpace = thumbDims.left - ImageContentPreview.PADDING;
            const leftSide = Math.max(leftSpace - imgDims.width, 0);
            const rightSide = Math.max(0, Math.min(thumbDims.left + thumbDims.width + ImageContentPreview.PADDING, bodyDims.width -
                                                                                                                   imgDims.width));
            const rightSpace = bodyDims.width - rightSide;

            const topSpace = thumbDims.top - ImageContentPreview.PADDING;
            const topSide = topSpace - (imgDims.height - thumbDims.height) / 2;

            el.setLeftPx(leftSpace > rightSpace ? leftSide : rightSide)
                .setTopPx(Math.max(topSide, 0))
                .setWidthPx(Math.min(imgDims.width, bodyDims.width))
                .setHeightPx(Math.min(imgDims.height || imgDims.width, bodyDims.height));

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
                // mouse might have returned during animation time, don't hide it in that case
                if (!this.thumb) {
                    this.image.setSrc(ImgEl.PLACEHOLDER);
                    api.dom.Body.get().removeChild(this);
                }
            }, ImageContentPreview.TIMEOUT);
        }
    }
}
