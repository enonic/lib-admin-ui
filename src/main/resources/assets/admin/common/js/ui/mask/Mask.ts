import $ from 'jquery';
import {Body} from '../../dom/Body';
import {DivEl} from '../../dom/DivEl';
import {Element} from '../../dom/Element';
import {ElementHiddenEvent} from '../../dom/ElementHiddenEvent';
import {StyleHelper} from '../../StyleHelper';
import {ResponsiveManager} from '../responsive/ResponsiveManager';

export class Mask
    extends DivEl {

    private readonly masked: Element;

    private removeWhenMaskedRemoved: boolean;

    private visible: boolean = false;

    constructor(itemToMask?: Element) {
        super('mask', StyleHelper.COMMON_PREFIX);

        this.masked = itemToMask || Body.get();
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
        if (!this.visible) {
            return;
        }

        super.hide();

        this.visible = false;

        if (Body.get().contains(this)) {
            this.remove();
        }
    }

    show() {
        if (this.visible) {
            return;
        }
        Body.get().appendChild(this);

        super.show();

        this.visible = true;

        if (this.masked) {
            this.masked.whenRendered(() => this.positionOverMaskedEl());
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

    protected positionOverMaskedEl() {
        const maskedEl = this.getWrapperEl();

        const maskDimensions: { width: string; height: string } = {
            width: maskedEl.outerWidth() + 'px',
            height: maskedEl.outerHeight() + 'px'
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
