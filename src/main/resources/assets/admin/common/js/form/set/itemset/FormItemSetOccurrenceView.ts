import {FormItemSet} from './FormItemSet';
import {FormSetOccurrenceView, FormSetOccurrenceViewConfig} from '../FormSetOccurrenceView';
import {ValidationRecording} from '../../ValidationRecording';
import {FormItemView} from '../../FormItemView';
import {RecordingValidityChangedEvent} from '../../RecordingValidityChangedEvent';
import {FormItem} from '../../FormItem';
import {PropertyArray} from '../../../data/PropertyArray';
import {Property} from '../../../data/Property';
import {ValueTypes} from '../../../data/ValueTypes';

export class FormItemSetOccurrenceView
    extends FormSetOccurrenceView {

    constructor(config: FormSetOccurrenceViewConfig<FormItemSetOccurrenceView>) {
        super('form-item-set-', config);
    }

    protected extraValidation(_validationRecording: ValidationRecording) {
        // No extra validation for item-sets
    }

    protected subscribeOnItemEvents() {
        this.formItemViews.forEach((formItemView: FormItemView) => {
            formItemView.onValidityChanged((event: RecordingValidityChangedEvent) => {

                if (!this.currentValidationState) {
                    return; // currentValidationState is initialized on validate() call which may not be triggered in some cases
                }

                let previousValidState = this.currentValidationState.isValid();
                if (event.isValid()) {
                    this.currentValidationState.removeByPath(event.getOrigin(), false, event.isIncludeChildren());
                } else {
                    this.currentValidationState.flatten(event.getRecording());
                }

                if (previousValidState !== this.currentValidationState.isValid()) {
                    this.notifyValidityChanged(new RecordingValidityChangedEvent(this.currentValidationState,
                        this.resolveValidationRecordingPath()).setIncludeChildren(true));
                }
            });

            if (this.formItemOccurrence.isMultiple()) {
                formItemView.onBlur(() => this.updateLabel());
            }
        });
    }

    protected getFormSet(): FormItemSet {
        return <FormItemSet>this.formSet;
    }

    protected getFormItems(): FormItem[] {
        return this.getFormSet().getFormItems();
    }

    protected getLabelText(): string {
        const propArrays = this.propertySet.getPropertyArrays();
        const selectedValues = [];

        if (propArrays && propArrays.length > 0) {
            propArrays.some((propArray: PropertyArray) => {
                this.recursiveFetchLabels(propArray, selectedValues, true);
                return selectedValues.length > 0;
            });
        }

        return selectedValues[0] || this.getFormSet().getLabel();
    }

    private recursiveFetchLabels(propArray: PropertyArray, labels: string[], firstOnly?: boolean): void {
        propArray.forEach((prop: Property) => {
            if (ValueTypes.STRING.equals(prop.getType()) && prop.getValue().isNotNull()) {
                labels.push(prop.getString());
                if (firstOnly) {
                    return;
                }
            } else if (ValueTypes.DATA.equals(prop.getType())) {
                prop.getPropertySet().getPropertyArrays().forEach(arr => this.recursiveFetchLabels(arr, labels, firstOnly));
            }
        });
    }
}
