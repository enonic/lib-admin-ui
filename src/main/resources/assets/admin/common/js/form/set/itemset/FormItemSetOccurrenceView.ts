import * as $ from 'jquery';
import * as Q from 'q';
import {PropertySet} from '../../../data/PropertySet';
import {StringHelper} from '../../../util/StringHelper';
import {FormContext} from '../../FormContext';
import {FormSetOccurrence} from '../FormSetOccurrence';
import {FormItemSet} from './FormItemSet';
import {FormSetOccurrenceView} from '../FormSetOccurrenceView';
import {FormItemLayer} from '../../FormItemLayer';
import {ValidationRecording} from '../../ValidationRecording';
import {FormItemView} from '../../FormItemView';
import {RecordingValidityChangedEvent} from '../../RecordingValidityChangedEvent';
import {FormSet} from '../FormSet';
import {FormItem} from '../../FormItem';

export interface FormItemSetOccurrenceViewConfig {

    context: FormContext;

    layer: FormItemLayer;

    formSetOccurrence: FormSetOccurrence<FormItemSetOccurrenceView>;

    formItemSet: FormItemSet;

    parent: FormSetOccurrenceView;

    dataSet: PropertySet;
}

export class FormItemSetOccurrenceView
    extends FormSetOccurrenceView {

    private formItemSet: FormItemSet;

    constructor(config: FormItemSetOccurrenceViewConfig) {
        super('form-item-set-occurrence-view', config.formSetOccurrence);
        this.occurrenceContainerClassName = 'form-item-set-occurrences-container';
        this.formItemOccurrence = config.formSetOccurrence;
        this.formItemSet = config.formItemSet;
        this.propertySet = config.dataSet;
        this.formItemLayer = config.layer;
    }

    public layout(validate: boolean = true): Q.Promise<void> {
        return super.layout(validate).then(() => {
            if (this.formItemOccurrence.isMultiple()) {
                this.formSetOccurrencesContainer.onDescendantAdded(() => this.setLabel());
            }
        });
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
                formItemView.onBlur(() => this.setLabel());
            }
        });
    }

    protected getFormSet(): FormSet {
        return this.formItemSet;
    }

    protected getFormItems(): FormItem[] {
        return this.formItemSet.getFormItems();
    }

    private setLabel() {
        const firstNonEmptyInput = $(this.formSetOccurrencesContainer.getHTMLElement())
            .find('.input-wrapper input, .input-wrapper textarea').toArray()
            .find(input => {
                const isInput = input.nodeName === 'INPUT';
                const value = isInput ? (<HTMLInputElement>input).value : StringHelper.htmlToString(input['value']);
                return value.trim().length > 0;
            });

        if (firstNonEmptyInput) {
            const isInput = firstNonEmptyInput.nodeName === 'INPUT';
            if (isInput) {
                this.label.setText((<HTMLInputElement>firstNonEmptyInput).value);
            } else {
                this.label.setText(StringHelper.htmlToString(firstNonEmptyInput['value']));
            }
            this.formSetOccurrencesContainer.unDescendantAdded();
        } else {
            this.label.setText(this.getFormSet().getLabel());
        }
    }
}
