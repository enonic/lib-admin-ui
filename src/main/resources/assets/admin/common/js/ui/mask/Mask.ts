module api.ui.mask {

    import ResponsiveManager = api.ui.responsive.ResponsiveManager;

    export class Mask extends api.dom.DivEl {

        private masked: api.dom.Element;

        private removeWhenMaskedRemoved: boolean;

        constructor(itemToMask?: api.dom.Element) {
            super('mask', api.StyleHelper.COMMON_PREFIX);

            this.masked = itemToMask;
            this.removeWhenMaskedRemoved = true;

            if (this.masked) {
                this.masked.onHidden((event: api.dom.ElementHiddenEvent) => {
                    if (event.getTarget() === this.masked) {
                        this.hide();
                    }
                });
                this.masked.onRemoved(() => {
                    if (this.removeWhenMaskedRemoved) {
                        this.remove();
                    }
                });
                // Masked element might have been resized on window resize
                ResponsiveManager.onAvailableSizeChanged(api.dom.Body.get(), () => {
                    if (this.isVisible()) {
                        this.positionOver(this.masked);
                    }
                });
            }
            api.dom.Body.get().appendChild(this);
        }

        setRemoveWhenMaskedRemoved(value: boolean) {
            this.removeWhenMaskedRemoved = value;
        }

        show() {
            super.show();
            if (this.masked) {
                this.positionOver(this.masked);
            }
        }

        private positionOver(masked: api.dom.Element) {
            const maskedEl = masked.getEl();
            const maskEl = this.getEl();
            let maskedOffset: {top:number; left: number};
            const wrapperEl = wemjq(maskEl.getHTMLElement()).closest('.mask-wrapper');
            let isMaskedPositioned = maskedEl.getPosition() !== 'static';
            let maskedDimensions: {width: string; height: string} = {
                    width: maskedEl.getWidthWithBorder() + 'px',
                    height: (wrapperEl.length ? wrapperEl.innerHeight() : maskedEl.getHeightWithBorder()) + 'px'
                };

            if (masked.contains(this) && isMaskedPositioned) {
                // mask is inside masked element & it is positioned
                maskedOffset = {
                    top: 0,
                    left: 0
                };

                if (maskedEl.getPosition() === 'absolute') {
                    maskedDimensions = {
                        width: '100%',
                        height: '100%'
                    };
                }
            } else {
                // mask is outside masked element
                let maskedParent = wrapperEl.length ? wrapperEl[0] : maskedEl.getOffsetParent();
                let maskParent = maskEl.getOffsetParent();

                maskedOffset = maskedEl.getOffsetToParent();

                if (maskedParent !== maskParent) {
                    // they have different offset parents so calc the difference
                    let maskedParentOffset = new api.dom.ElementHelper(maskedParent).getOffset();
                    let maskParentOffset = new api.dom.ElementHelper(maskParent).getOffset();

                    maskedOffset.left = maskedOffset.left + (maskedParentOffset.left - maskParentOffset.left);
                    maskedOffset.top = maskedOffset.top + (maskedParentOffset.top - maskParentOffset.top);
                }

                if (!isMaskedPositioned) {
                    // account for margins if masked is positioned statically
                    maskedOffset.top += maskedEl.getMarginTop();
                    maskedOffset.left += maskedEl.getMarginLeft();
                }
            }

            this.getEl().
                setTopPx(wrapperEl.length ? wrapperEl.position().top : Math.max(maskedOffset.top, 0)).
                setLeftPx(wrapperEl.length ? wrapperEl.position().left : maskedOffset.left).
                setWidth(maskedDimensions.width).
                setHeight(maskedDimensions.height);
        }
    }
}
