import {DivEl} from '../dom/DivEl';
import {StyleHelper} from '../StyleHelper';
import {Input} from './Input';
import {LabelEl} from '../dom/LabelEl';
import {ElementRegistry} from '../dom/ElementRegistry';
import {NewElementBuilder} from '../dom/Element';

export class InputLabel
    extends DivEl {

    private readonly labelEl: LabelEl;

    constructor(input: Input) {
        super('input-label');

        const wrapper = new DivEl('wrapper', StyleHelper.COMMON_PREFIX);
        this.labelEl = new LabelEl('label');
        this.labelEl.getEl().setInnerHtml(input.getLabel());
        this.labelEl.setId(ElementRegistry.registerElement(this.labelEl));

        wrapper.getEl().appendChild(this.labelEl.getHTMLElement());

        if (input.getOccurrences().required()) {
            wrapper.addClass('required');
        }

        this.getEl().appendChild(wrapper.getHTMLElement());
    }

    getLabelEl(): LabelEl {
        return this.labelEl;
    }
}
