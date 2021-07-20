import {FormItemSet} from './FormItemSet';
import {FormSetOccurrenceView, FormSetOccurrenceViewConfig} from '../FormSetOccurrenceView';
import {ValidationRecording} from '../../ValidationRecording';
import {FormItemView} from '../../FormItemView';
import {RecordingValidityChangedEvent} from '../../RecordingValidityChangedEvent';
import {FormItem} from '../../FormItem';
import {PropertyArray} from '../../../data/PropertyArray';

export class FormItemSetOccurrenceView
    extends FormSetOccurrenceView {

    constructor(config: FormSetOccurrenceViewConfig<FormItemSetOccurrenceView>) {
        super('form-item-set-', config);
    }

    protected getLabelSubTitle(): string {
        const propArrays = this.propertySet.getPropertyArrays();
        const selectedValues = [];

        if (propArrays && propArrays.length > 0) {
            propArrays.some((propArray: PropertyArray) => {
                if ('_selected' === propArray.getName()) {
                    return false;   // skip technical _selected array
                }
                this.recursiveFetchLabels(propArray, selectedValues, true);
                return selectedValues.length > 0;
            });
        }

        return selectedValues.length ? selectedValues.join(', ') : '';
    }

    protected getLabelText(): string {
        return this.getFormSet().getLabel();
    }

    protected getFormSet(): FormItemSet {
        return <FormItemSet>this.formSet;
    }

    protected getFormItems(): FormItem[] {
        return this.getFormSet().getFormItems();
    }
}
