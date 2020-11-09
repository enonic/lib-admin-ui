import {DivEl} from '../../dom/DivEl';
import {Element} from '../../dom/Element';
import {StyleHelper} from '../../StyleHelper';
import {ElementHiddenEvent} from '../../dom/ElementHiddenEvent';
import {Body} from '../../dom/Body';

export class Mask
    extends DivEl {

    private readonly masked: Element;

    constructor(itemToMask?: Element) {
        super('mask', StyleHelper.COMMON_PREFIX);

        this.masked = itemToMask || Body.get();

        this.masked.onHidden((event: ElementHiddenEvent) => {
            if (event.getTarget() === this.masked) {
                this.hide();
            }
        });
        this.masked.onRemoved(() => {
            this.remove();
        });
    }

    hide() {
        super.hide();

        this.remove();
    }

    show() {
        this.masked.prependChild(this);

        super.show();
    }
}
