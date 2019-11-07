import {DivEl} from '../../../dom/DivEl';
import {FieldSet} from './FieldSet';

export class FieldSetLabel
    extends DivEl {

    private fieldSet: FieldSet;

    constructor(fieldSet: FieldSet) {
        super('field-set-label');

        this.fieldSet = fieldSet;

        this.getEl().setInnerHtml(this.fieldSet.getLabel());
    }
}
