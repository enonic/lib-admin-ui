import {DivEl} from '../../dom/DivEl';
import {AEl} from '../../dom/AEl';

export class TabMenuButton
    extends DivEl {

    private labelEl: AEl;

    constructor() {
        super('tab-menu-button');

        this.labelEl = new AEl('label');
        this.appendChild(this.labelEl);
    }

    setLabelTitle(value: string) {
        this.labelEl.getEl().setTitle(value);
    }

    setLabel(value: string, addTitle: boolean = true) {
        this.labelEl.setHtml(value);
        if (addTitle) {
            this.setLabelTitle(value);
        }
    }

    getLabel(): AEl {
        return this.labelEl;
    }

    focus(): boolean {
        return this.labelEl.giveFocus();
    }
}
