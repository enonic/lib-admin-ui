import {PropertySet} from '../../../data/PropertySet';
import {PropertyArray} from '../../../data/PropertyArray';
import {ValueTypes} from '../../../data/ValueTypes';
import {Value} from '../../../data/Value';
import {i18n} from '../../../util/Messages';
import {DivEl} from '../../../dom/DivEl';
import {ObjectHelper} from '../../../ObjectHelper';
import {ValueTypeString} from '../../../data/ValueTypeString';
import {FormOptionSet} from './FormOptionSet';
import {FormSetOccurrenceView, FormSetOccurrenceViewConfig} from '../FormSetOccurrenceView';
import {FormItemView} from '../../FormItemView';
import {FormOptionSetOptionView} from './FormOptionSetOptionView';
import {RecordingValidityChangedEvent} from '../../RecordingValidityChangedEvent';
import {ValidationRecordingPath} from '../../ValidationRecordingPath';
import {ValidationRecording} from '../../ValidationRecording';
import {FormItem} from '../../FormItem';
import {Occurrences} from '../../Occurrences';
import {FormOptionSetOption} from './FormOptionSetOption';
import {Property} from '../../../data/Property';
import * as Q from 'q';

export class FormOptionSetOccurrenceView
    extends FormSetOccurrenceView {

    private selectionValidationMessage: DivEl;

    constructor(config: FormSetOccurrenceViewConfig<FormOptionSetOccurrenceView>) {
        super('form-option-set-', config);

        this.ensureSelectionArrayExists(this.propertySet);
    }

    public layout(validate: boolean = true): Q.Promise<void> {
        return super.layout(validate).then(() => {
            if (this.formItemOccurrence.isMultiple()) {
                this.formSetOccurrencesContainer.onDescendantAdded(() => this.updateLabel());
            }
        });
    }

    clean() {
        this.formItemViews.forEach((view: FormItemView) => {
            if (ObjectHelper.iFrameSafeInstanceOf(view, FormOptionSetOptionView)) {
                (<FormOptionSetOptionView>view).clean();
            }
        });
    }

    protected initValidationMessageBlock() {
        this.selectionValidationMessage = new DivEl('selection-message');
        this.appendChild(this.selectionValidationMessage);
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

            (<FormOptionSetOptionView>formItemView).onSelectionChanged(() => {
                this.updateLabel();

                if (!this.currentValidationState) {
                    return; // currentValidationState is initialized on validate() call which may not be triggered in some cases
                }

                let previousValidationValid = this.currentValidationState.isValid();
                let multiselectionState = this.validateMultiselection();

                if (multiselectionState.isValid()) {
                    // for radio - we clean all validation, as even selected item should not be validated
                    if (this.getFormSet().isRadioSelection()) {
                        this.currentValidationState.removeByPath(
                            new ValidationRecordingPath(this.getDataPath(), null), true, true);

                    } else {
                        this.currentValidationState.removeByPath(
                            new ValidationRecordingPath(this.getDataPath(), formItemView.getFormItem().getName()), true, true);
                    }
                } else {
                    this.currentValidationState.flatten(this.currentValidationState);
                }

                this.renderSelectionValidationMessage(multiselectionState);

                if (this.currentValidationState.isValid() !== previousValidationValid) {
                    this.notifyValidityChanged(new RecordingValidityChangedEvent(this.currentValidationState,
                        this.resolveValidationRecordingPath()).setIncludeChildren(true));
                }

                this.validate(false);
            });
        });
    }

    protected ensureSelectionArrayExists(propertyArraySet: PropertySet) {
        let selectionPropertyArray = propertyArraySet.getPropertyArray('_selected');
        if (!selectionPropertyArray) {
            selectionPropertyArray =
                PropertyArray.create().setType(ValueTypes.STRING).setName('_selected').setParent(
                    propertyArraySet).build();
            propertyArraySet.addPropertyArray(selectionPropertyArray);
            this.addDefaultSelectionToSelectionArray(selectionPropertyArray);
        }
    }

    protected extraValidation(validationRecording: ValidationRecording) {
        let multiselectionState = this.validateMultiselection();
        validationRecording.flatten(multiselectionState);
        this.renderSelectionValidationMessage(multiselectionState);
    }

    protected getFormSet(): FormOptionSet {
        return <FormOptionSet>this.formSet;
    }

    protected getFormItems(): FormItem[] {
        return this.getFormSet().getFormItems();
    }

    protected getLabelText(): string {
        const selectionArray = this.propertySet.getPropertyArray('_selected');
        const selectedLabels: string[] = [];

        if (selectionArray && !selectionArray.isEmpty()) {
            const nameLabelMap: { [key: string]: string } = {};
            this.getFormItems().forEach((formItem: FormItem) => {
                if (formItem instanceof FormOptionSetOption) {
                    nameLabelMap[formItem.getName()] = formItem.getLabel();
                }
            });


            selectionArray.forEach((selectedProp: Property) => {
                const label = nameLabelMap[selectedProp.getString()];
                if (label) {
                    selectedLabels.push(label);
                }
            });
        }

        if (selectedLabels.length === 0) {
            return this.getFormSet().getLabel();
        } else {
            return selectedLabels.join(', ');
        }
    }

    private renderSelectionValidationMessage(selectionValidationRecording: ValidationRecording) {
        if (selectionValidationRecording.isValid()) {
            this.selectionValidationMessage.addClass('empty');
        } else {
            let selection: Occurrences = this.getFormSet().getMultiselection();
            let message;
            if (!selectionValidationRecording.isMinimumOccurrencesValid()) {
                if (selection.getMinimum() === 1) {
                    message = i18n('field.optionset.breaks.min.one');
                } else if (selection.getMinimum() > 1) {
                    message = i18n('field.optionset.breaks.min.many', selection.getMinimum());
                }
            }
            if (!selectionValidationRecording.isMaximumOccurrencesValid()) {
                if (selection.getMaximum() === 1) {
                    message = i18n('field.optionset.breaks.max.one');
                } else if (selection.getMaximum() > 1) {
                    message = i18n('field.optionset.breaks.max.many', selection.getMaximum());
                }
            }

            if (!!message) {
                this.selectionValidationMessage.setHtml(message);
                this.selectionValidationMessage.removeClass('empty');
            }
        }
    }

    private addDefaultSelectionToSelectionArray(selectionPropertyArray: PropertyArray) {
        this.getFormSet().getOptions().forEach((option: FormOptionSetOption) => {
            if (option.isDefaultOption() && selectionPropertyArray.getSize() < this.getFormSet().getMultiselection().getMaximum()) {
                selectionPropertyArray.add(new Value(option.getName(), new ValueTypeString()));
            }
        });
    }

    private validateMultiselection(): ValidationRecording {
        let multiselectionRecording = new ValidationRecording();
        let validationRecordingPath = this.resolveValidationRecordingPath();
        let selectionPropertyArray = this.propertySet.getPropertyArray('_selected');

        if (selectionPropertyArray.getSize() < this.getFormSet().getMultiselection().getMinimum()) {
            multiselectionRecording.breaksMinimumOccurrences(validationRecordingPath);
        }

        if (this.getFormSet().getMultiselection().maximumBreached(selectionPropertyArray.getSize())) {
            multiselectionRecording.breaksMaximumOccurrences(validationRecordingPath);
        }

        if (this.currentValidationState) {
            if (selectionPropertyArray.getSize() < this.getFormSet().getMultiselection().getMinimum()) {
                this.currentValidationState.breaksMinimumOccurrences(validationRecordingPath);
            } else {
                this.currentValidationState.removeUnreachedMinimumOccurrencesByPath(validationRecordingPath, false);
            }

            if (this.getFormSet().getMultiselection().maximumBreached(selectionPropertyArray.getSize())) {
                this.currentValidationState.breaksMaximumOccurrences(validationRecordingPath);
            } else {
                this.currentValidationState.removeBreachedMaximumOccurrencesByPath(validationRecordingPath, false);
            }
        }

        return multiselectionRecording;
    }
}
