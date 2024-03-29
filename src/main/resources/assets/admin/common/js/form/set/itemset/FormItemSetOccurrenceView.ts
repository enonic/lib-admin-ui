import {FormItemSet} from './FormItemSet';
import {FormSetOccurrenceView, FormSetOccurrenceViewConfig} from '../FormSetOccurrenceView';
import {FormItem} from '../../FormItem';
import {PropertyArray} from '../../../data/PropertyArray';

export class FormItemSetOccurrenceView
    extends FormSetOccurrenceView {

    constructor(config: FormSetOccurrenceViewConfig<FormItemSetOccurrenceView>) {
        super('form-item-set-', config);
    }

    protected getLabelText(): string {
        return this.getFirstPropertyValue() || this.getFormSet().getLabel();
    }

    protected getLabelSubTitle(): string {
        return this.getFirstPropertyValue() ? this.getFormSet().getLabel() : '';
    }

    private getFirstPropertyValue(): string {
        const formItemNames = this.getFormItems().map((formItem: FormItem) => formItem.getName());
        const propArrays =
            this.propertySet.getPropertyArrays().sort((prop1: PropertyArray, prop2: PropertyArray) =>
                        formItemNames.indexOf(prop1.getName()) - formItemNames.indexOf(prop2.getName())
            );
        const propValues = [];

        if (propArrays && propArrays.length > 0) {
            propArrays.some((propArray: PropertyArray) => {
                if ('_selected' === propArray.getName()) {
                    return false;   // skip technical _selected array
                }
                this.fetchPropertyValues(propArray, propValues, true);
                return propValues.length > 0;
            });
        }

        return propValues.length ? propValues.join(', ') : '';
    }

    protected getFormSet(): FormItemSet {
        return this.formSet as FormItemSet;
    }

    protected getFormItems(): FormItem[] {
        return this.getFormSet().getFormItems();
    }
}
