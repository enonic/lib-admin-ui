import {DivEl} from '../dom/DivEl';
import {H6El} from '../dom/H6El';
import {PEl} from '../dom/PEl';
import {StyleHelper} from '../StyleHelper';
import {Element} from '../dom/Element';

export class NamesView
    extends DivEl {

    private mainNameEl: H6El;

    private subNameEl: PEl;

    private addTitleAttribute: boolean;

    constructor(addTitleAttribute: boolean = true) {
        super('names-view', StyleHelper.COMMON_PREFIX);

        this.addTitleAttribute = addTitleAttribute;

        this.mainNameEl = new H6El('main-name', StyleHelper.COMMON_PREFIX);
        this.appendChild(this.mainNameEl);

        this.subNameEl = new PEl('sub-name', StyleHelper.COMMON_PREFIX);
        this.appendChild(this.subNameEl);
    }

    setMainName(value: string): NamesView {
        this.mainNameEl.setHtml(value);
        if (this.addTitleAttribute) {
            this.mainNameEl.getEl().setAttribute('title', value);
        }
        return this;
    }

    setMainNameElements(elements: Element[]): NamesView {
        this.mainNameEl.removeChildren();
        elements.forEach((element: Element) => {
            this.mainNameEl.appendChild(element);
        });

        return this;
    }

    setSubName(value: string, title?: string): NamesView {
        this.subNameEl.setHtml(value);
        if (this.addTitleAttribute) {
            this.subNameEl.getEl().setAttribute('title', title || value);
        }
        return this;
    }

    setSubNameElements(elements: Element[]): NamesView {
        this.subNameEl.removeChildren();
        elements.forEach((element: Element) => {
            this.subNameEl.appendChild(element);
        });

        return this;
    }
}
