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
    }

    setRemoveWhenMaskedRemoved(value: boolean) {
        this.removeWhenMaskedRemoved = value;
    }

    hide() {
        super.hide();

        if (Body.get().contains(this)) {
            this.remove();
        }
    }

    show() {
        Body.get().appendChild(this);

        super.show();

        if (this.masked) {
            if (this.masked.isRendered()) {
                this.positionOverMaskedEl();
            } else {
                this.masked.onRendered(() => this.positionOverMaskedEl());
            }
        }
    }

    private getWrapperEl(): JQuery<HTMLElement> {
        let wrapperEl: JQuery<HTMLElement> = $(this.getEl().getHTMLElement()).closest('.mask-wrapper');
        if (wrapperEl.length) {
            return wrapperEl;
        }

        if (!this.masked) {
            return $(this.getEl().getOffsetParent());
        }

        const maskedEl = $(this.masked.getHTMLElement());
        wrapperEl = maskedEl;

        while (wrapperEl.length && $(wrapperEl).innerHeight() === 0) {
            wrapperEl = $(wrapperEl).parent();
        }

        if (wrapperEl.length) {
            return wrapperEl;
        }

        return maskedEl;
    }

    private maskAndWrapperHaveEqualOffset(wrapperEl: JQuery<HTMLElement>): boolean {
        const offsetParentOfMask = this.getEl().getOffsetParent();
        const offsetParentOfMaskWrapper = wrapperEl.offsetParent()[0];

        return offsetParentOfMask === offsetParentOfMaskWrapper;
    }

    private positionOverMaskedEl() {
        const maskedEl = this.getWrapperEl();

        const maskDimensions: { width: string; height: string } = {
            width: maskedEl.width() + 'px',
            height: maskedEl.height() + 'px'
        };

        let maskOffset: { top: number; left: number } = maskedEl.position();

        if (!this.maskAndWrapperHaveEqualOffset(maskedEl)) {
            maskOffset = maskedEl.offset();
        }

        this.getEl()
            .setTopPx(maskOffset.top)
            .setLeftPx(maskOffset.left)
            .setWidth(maskDimensions.width)
            .setHeight(maskDimensions.height);
    }
}
