import * as $ from 'jquery';
import * as Q from 'q';
import {PropertySet} from '../../../data/PropertySet';
import {StringHelper} from '../../../util/StringHelper';
import {FormContext} from '../../FormContext';
import {FormSetOccurrence} from '../FormSetOccurrence';
import {FormItemSet} from './FormItemSet';
import {FormSetOccurrenceView, FormSetOccurrenceViewConfig} from '../FormSetOccurrenceView';
import {FormItemLayer} from '../../FormItemLayer';
import {ValidationRecording} from '../../ValidationRecording';
import {FormItemView} from '../../FormItemView';
import {RecordingValidityChangedEvent} from '../../RecordingValidityChangedEvent';
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

    constructor(config: FormSetOccurrenceViewConfig<FormItemSetOccurrenceView>) {
        super('form-item-set-occurrence-view', config.formSetOccurrence);
        this.occurrenceContainerClassName = 'form-item-set-occurrences-container';
        this.formItemOccurrence = config.formSetOccurrence;
        this.formSet = config.formSet;
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

    validate(silent: boolean = true): ValidationRecording {

        let allRecordings = new ValidationRecording();
        this.formItemViews.forEach((formItemView: FormItemView) => {
            let currRecording = formItemView.validate(silent);
            allRecordings.flatten(currRecording);
        });

        if (!silent) {
            if (allRecordings.validityChanged(this.currentValidationState)) {
                this.notifyValidityChanged(new RecordingValidityChangedEvent(allRecordings, this.resolveValidationRecordingPath()));
            }
        }
        this.currentValidationState = allRecordings;
        return allRecordings;
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

    protected getFormSet(): FormItemSet {
        return <FormItemSet>this.formSet;
    }

    protected getFormItems(): FormItem[] {
        return this.getFormSet().getFormItems();
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
