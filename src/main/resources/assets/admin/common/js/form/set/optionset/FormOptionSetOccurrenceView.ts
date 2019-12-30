import {PropertySet} from '../../../data/PropertySet';
import {PropertyArray} from '../../../data/PropertyArray';
import {ValueTypes} from '../../../data/ValueTypes';
import {Value} from '../../../data/Value';
import {i18n} from '../../../util/Messages';
import {DivEl} from '../../../dom/DivEl';
import {ObjectHelper} from '../../../ObjectHelper';
import {ValueTypeString} from '../../../data/ValueTypeString';
import {FormContext} from '../../FormContext';
import {FormSetOccurrence} from '../FormSetOccurrence';
import {FormOptionSet} from './FormOptionSet';
import {FormItemOccurrenceView} from '../../FormItemOccurrenceView';
import {FormSetOccurrenceView} from '../FormSetOccurrenceView';
import {FormItemLayer} from '../../FormItemLayer';
import {FormItemView} from '../../FormItemView';
import {FormOptionSetOptionView} from './FormOptionSetOptionView';
import {RecordingValidityChangedEvent} from '../../RecordingValidityChangedEvent';
import {ValidationRecordingPath} from '../../ValidationRecordingPath';
import {ValidationRecording} from '../../ValidationRecording';
import {FormSet} from '../FormSet';
import {FormItem} from '../../FormItem';
import {Occurrences} from '../../Occurrences';
import {FormOptionSetOption} from './FormOptionSetOption';

export interface FormOptionSetOccurrenceViewConfig {
    context: FormContext;

    layer: FormItemLayer;

    formSetOccurrence: FormSetOccurrence<FormOptionSetOccurrenceView>;

    formOptionSet: FormOptionSet;

    parent: FormItemOccurrenceView;

    dataSet: PropertySet;
}

export class FormOptionSetOccurrenceView
    extends FormSetOccurrenceView {

    private formOptionSet: FormOptionSet;

    private selectionValidationMessage: DivEl;

    constructor(config: FormOptionSetOccurrenceViewConfig) {
        super('form-option-set-occurrence-view', config.formSetOccurrence);
        this.occurrenceContainerClassName = 'form-option-set-occurrences-container';
        this.formItemOccurrence = config.formSetOccurrence;
        this.formOptionSet = config.formOptionSet;
        this.propertySet = config.dataSet;
        this.ensureSelectionArrayExists(this.propertySet);

        this.formItemLayer = config.layer;
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

            (<FormOptionSetOptionView> formItemView).onSelectionChanged(() => {
                if (!this.currentValidationState) {
                    return; // currentValidationState is initialized on validate() call which may not be triggered in some cases
                }

                let previousValidationValid = this.currentValidationState.isValid();
                let multiselectionState = this.validateMultiselection();

                if (multiselectionState.isValid()) {
                    // for radio - we clean all validation, as even selected item should not be validated
                    if (this.formOptionSet.isRadioSelection()) {
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

    protected getFormSet(): FormSet {
        return this.formOptionSet;
    }

    protected getFormItems(): FormItem[] {
        return this.formOptionSet.getFormItems();
    }

    private renderSelectionValidationMessage(selectionValidationRecording: ValidationRecording) {
        if (selectionValidationRecording.isValid()) {
            this.selectionValidationMessage.addClass('empty');
        } else {
            let selection: Occurrences = this.formOptionSet.getMultiselection();
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
        this.formOptionSet.getOptions().forEach((option: FormOptionSetOption) => {
            if (option.isDefaultOption() && selectionPropertyArray.getSize() < this.formOptionSet.getMultiselection().getMaximum()) {
                selectionPropertyArray.add(new Value(option.getName(), new ValueTypeString()));
            }
        });
    }

    private validateMultiselection(): ValidationRecording {
        let multiselectionRecording = new ValidationRecording();
        let validationRecordingPath = this.resolveValidationRecordingPath();
        let selectionPropertyArray = this.propertySet.getPropertyArray('_selected');

        if (selectionPropertyArray.getSize() < this.formOptionSet.getMultiselection().getMinimum()) {
            multiselectionRecording.breaksMinimumOccurrences(validationRecordingPath);
        }

        if (this.formOptionSet.getMultiselection().maximumBreached(selectionPropertyArray.getSize())) {
            multiselectionRecording.breaksMaximumOccurrences(validationRecordingPath);
        }

        if (this.currentValidationState) {
            if (selectionPropertyArray.getSize() < this.formOptionSet.getMultiselection().getMinimum()) {
                this.currentValidationState.breaksMinimumOccurrences(validationRecordingPath);
            } else {
                this.currentValidationState.removeUnreachedMinimumOccurrencesByPath(validationRecordingPath, false);
            }

            if (this.formOptionSet.getMultiselection().maximumBreached(selectionPropertyArray.getSize())) {
                this.currentValidationState.breaksMaximumOccurrences(validationRecordingPath);
            } else {
                this.currentValidationState.removeBreachedMaximumOccurrencesByPath(validationRecordingPath, false);
            }
        }

        return multiselectionRecording;
    }
}
