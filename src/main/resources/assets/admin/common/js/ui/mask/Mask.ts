import * as $ from 'jquery';
import {ResponsiveManager} from '../responsive/ResponsiveManager';
import {DivEl} from '../../dom/DivEl';
import {Element} from '../../dom/Element';
import {StyleHelper} from '../../StyleHelper';
import {ElementHiddenEvent} from '../../dom/ElementHiddenEvent';
import {Body} from '../../dom/Body';
import {ElementHelper} from '../../dom/ElementHelper';

export class Mask
    extends DivEl {

    private masked: Element;

    private removeWhenMaskedRemoved: boolean;

    constructor(itemToMask?: Element) {
        super('mask', StyleHelper.COMMON_PREFIX);

        this.masked = itemToMask;
        this.removeWhenMaskedRemoved = true;

        if (this.masked) {
            this.masked.onHidden((event: ElementHiddenEvent) => {
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
            ResponsiveManager.onAvailableSizeChanged(Body.get(), () => {
                if (this.isVisible()) {
                    this.positionOverMaskedEl();
                }
            });
        }
        Body.get().appendChild(this);
    }

    setRemoveWhenMaskedRemoved(value: boolean) {
        this.removeWhenMaskedRemoved = value;
    }

    show() {
        super.show();
        if (this.masked) {
            this.positionOverMaskedEl();
        }
    }

    private getWrapperEl(): JQuery<HTMLElement> {
        let wrapperEl: JQuery<HTMLElement> = $(this.getEl().getHTMLElement()).closest('.mask-wrapper');
        if (wrapperEl.length || !this.masked) {
            return wrapperEl;
        }

        wrapperEl = $(this.masked.getHTMLElement());

        while (wrapperEl.length && $(wrapperEl).innerHeight() === 0) {
            wrapperEl = $(wrapperEl).parent();
        }

        return wrapperEl;
    }

    private positionOverMaskedEl() {
        const maskedEl = this.masked.getEl();
        const maskEl = this.getEl();
        let maskedOffset: { top: number; left: number };
        const wrapperEl = this.getWrapperEl();
        let isMaskedPositioned = maskedEl.getPosition() !== 'static';
        let isOutsideMaskedElement = true;
        let maskedDimensions: { width: string; height: string } = {
            width: wrapperEl.innerWidth() + 'px',
            height: (wrapperEl.length ? wrapperEl.innerHeight() : maskedEl.getHeightWithBorder()) + 'px'
        };

        if (this.masked.contains(this) && isMaskedPositioned) {
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
            isOutsideMaskedElement = (maskedParent !== maskParent);

            if (isOutsideMaskedElement) {
                // they have different offset parents so calc the difference
                let maskedParentOffset = new ElementHelper(maskedParent).getOffset();
                let maskParentOffset = new ElementHelper(maskParent).getOffset();

                maskedOffset.left = maskedOffset.left + (maskedParentOffset.left - maskParentOffset.left);
                maskedOffset.top = maskedOffset.top + (maskedParentOffset.top - maskParentOffset.top);

                if (!isMaskedPositioned) {
                    // account for margins if masked is positioned statically
                    maskedOffset.top += maskedEl.getMarginTop();
                    maskedOffset.left += maskedEl.getMarginLeft();
                }
            }
        }

        this.getEl()
            .setTopPx(isOutsideMaskedElement ? Math.max(maskedOffset.top, 0) : wrapperEl.position().top)
            .setLeftPx(isOutsideMaskedElement ? maskedOffset.left : wrapperEl.position().left)
            .setWidth(maskedDimensions.width)
            .setHeight(maskedDimensions.height);
    }
}
