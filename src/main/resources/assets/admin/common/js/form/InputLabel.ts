import {DivEl} from '../dom/DivEl';
import {StyleHelper} from '../StyleHelper';
import {Input} from './Input';

export class InputLabel
    extends DivEl {

    constructor(input: Input) {
        super('input-label');

        let wrapper = new DivEl('wrapper', StyleHelper.COMMON_PREFIX);
        let label = new DivEl('label');
        label.getEl().setInnerHtml(input.getLabel());
        wrapper.getEl().appendChild(label.getHTMLElement());

        if (input.getOccurrences().required()) {
            wrapper.addClass('required');
        }

        this.getEl().appendChild(wrapper.getHTMLElement());
    }
}
