import {PropertySet} from '../../../data/PropertySet';
import {PropertyArray} from '../../../data/PropertyArray';
import {ValueTypes} from '../../../data/ValueTypes';
import {i18n} from '../../../util/Messages';
import {DivEl} from '../../../dom/DivEl';
import {FormOptionSet} from './FormOptionSet';
import {FormSetOccurrenceView, FormSetOccurrenceViewConfig} from '../FormSetOccurrenceView';
import {FormOptionSetOptionView} from './FormOptionSetOptionView';
import {RecordingValidityChangedEvent} from '../../RecordingValidityChangedEvent';
import {ValidationRecordingPath} from '../../ValidationRecordingPath';
import {ValidationRecording} from '../../ValidationRecording';
import {FormItem} from '../../FormItem';
import {Occurrences} from '../../Occurrences';
import {FormOptionSetOption} from './FormOptionSetOption';
import {Property} from '../../../data/Property';

export abstract class FormOptionSetOccurrenceView
    extends FormSetOccurrenceView {

    protected selectionValidationMessage: DivEl;

    protected formOptionsByNameMap: Map<string, { label: string, index: number }>;

    constructor(config: FormSetOccurrenceViewConfig<FormOptionSetOccurrenceView>) {
        super('form-option-set-', config);

        this.formOptionsByNameMap = new Map<string, any>(
            this.getFormItems()
                .filter((formItem: FormItem) => formItem instanceof FormOptionSetOption)
                .map((formItem: FormOptionSetOption, index: number) => {
                    return [formItem.getName(), {label: formItem.getLabel(), index: index}] as [string, any];
                })
        );

        this.ensureSelectionArrayExists(this.propertySet);
    }

    protected initElements() {
        super.initElements();

        this.selectionValidationMessage = new DivEl('selection-message');
    }

    clean() {
        super.clean();

        const selectedOptionsArray: PropertyArray = this.getSelectedOptionsArray();

        if (!selectedOptionsArray || selectedOptionsArray.isEmpty()) {
            this.propertySet.removeAllProperties();
        }
    }

    protected subscribeOnItemEvents() {
        super.subscribeOnItemEvents();

        this.formItemViews.forEach((formItemView: FormOptionSetOptionView) => {
            formItemView.onSelectionChanged(() => this.handleSelectionChanged(formItemView));
        });
    }

    protected ensureSelectionArrayExists(propertyArraySet: PropertySet) {
        let selectionPropertyArray: PropertyArray = propertyArraySet.getPropertyArray('_selected');

        if (!selectionPropertyArray) {
            selectionPropertyArray =
                PropertyArray.create().setType(ValueTypes.STRING).setName('_selected').setParent(
                    propertyArraySet).build();
            propertyArraySet.addPropertyArray(selectionPropertyArray);
        }
    }

    protected extraValidation(validationRecording: ValidationRecording) {
        const multiSelectionState: ValidationRecording = this.validateMultiSelection();
        validationRecording.flatten(multiSelectionState);
        this.renderSelectionValidationMessage(multiSelectionState);
    }

    protected getFormSet(): FormOptionSet {
        return <FormOptionSet>this.formSet;
    }

    protected getFormItems(): FormItem[] {
        return this.getFormSet().getFormItems();
    }

    protected getSortedSelectedOptionsArrayProperties(): Property[] {
        const selectionArray: PropertyArray = this.getSelectedOptionsArray();

        return !!selectionArray ? selectionArray.getProperties()
            .sort((one: Property, two: Property) => {
                return this.formOptionsByNameMap.get(one.getString())?.index - this.formOptionsByNameMap.get(two.getString())?.index;
            }) : [];
    }

    protected getLabelSubTitle(): string {
        let selectedLabels: string[] = [];

        this.getSortedSelectedOptionsArrayProperties()
            .some(selectedProp => {
                const selectedOptionArray = this.propertySet.getPropertyArray(selectedProp.getString());
                if (selectedOptionArray && !selectedOptionArray.isEmpty()) {
                    this.fetchPropertyValues(selectedOptionArray, selectedLabels, true);
                }
                return selectedLabels.length > 0;
            });

        return selectedLabels.length ? selectedLabels.join(', ') : '';
    }

    protected getLabelText(): string {
        const selectedLabels: string[] = this.getSortedSelectedOptionsArrayProperties()
            .map((selectedProp: Property) => this.formOptionsByNameMap.get(selectedProp.getString())?.label)
            .filter((label: string) => !!label);

        return selectedLabels.length ? selectedLabels.join(', ') : this.getFormSet().getLabel();
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

    selectDefaultOption() {
        const selectionPropertyArray: PropertyArray = this.getSelectedOptionsArray();

        this.getFormItemViews().forEach((itemView: FormOptionSetOptionView) => {
            if ((<FormOptionSetOption>itemView.getFormItem()).isDefaultOption()) {
                itemView.select(true);
            }
        });
    }

    private validateMultiSelection(): ValidationRecording {
        const multiSelectionRecording: ValidationRecording = new ValidationRecording();
        const validationRecordingPath: ValidationRecordingPath = this.resolveValidationRecordingPath();
        const totalSelected: number = this.getTotalSelectedOptions();

        if (totalSelected < this.getFormSet().getMultiselection().getMinimum()) {
            multiSelectionRecording.breaksMinimumOccurrences(validationRecordingPath);
        }

        if (this.getFormSet().getMultiselection().maximumBreached(totalSelected)) {
            multiSelectionRecording.breaksMaximumOccurrences(validationRecordingPath);
        }

        if (this.currentValidationState) {
            if (totalSelected < this.getFormSet().getMultiselection().getMinimum()) {
                this.currentValidationState.breaksMinimumOccurrences(validationRecordingPath);
            } else {
                this.currentValidationState.removeUnreachedMinimumOccurrencesByPath(validationRecordingPath, false);
            }

            if (this.getFormSet().getMultiselection().maximumBreached(totalSelected)) {
                this.currentValidationState.breaksMaximumOccurrences(validationRecordingPath);
            } else {
                this.currentValidationState.removeBreachedMaximumOccurrencesByPath(validationRecordingPath, false);
            }
        }

        return multiSelectionRecording;
    }

    getTotalSelectedOptions(): number {
        const selectedOptionsArray: PropertyArray = this.getSelectedOptionsArray();

        if (!selectedOptionsArray || selectedOptionsArray.isEmpty()) {
            return 0;
        }

        const existingOptionsNames: string[] = this.getFormSet().getOptions().map((option: FormOptionSetOption) => option.getName());

        return selectedOptionsArray
            .map((property: Property) => property.getString())
            .filter((name: string) => existingOptionsNames.indexOf(name) > -1)
            .length;
    }

    protected handleSelectionChanged(optionView: FormOptionSetOptionView) {
        if (!this.currentValidationState) {
            return; // currentValidationState is initialized on validate() call which may not be triggered in some cases
        }

        const previousValidationValid: boolean = this.currentValidationState.isValid();
        const multiSelectionState: ValidationRecording = this.validateMultiSelection();

        if (multiSelectionState.isValid()) {
            // for radio - we clean all validation, as even selected item should not be validated
            if (this.getFormSet().isRadioSelection()) {
                this.currentValidationState.removeByPath(
                    new ValidationRecordingPath(this.getDataPath(), null), true, true);

            } else {
                this.currentValidationState.removeByPath(
                    new ValidationRecordingPath(this.getDataPath(), optionView.getFormItem().getName()), true, true);
            }
        } else {
            this.currentValidationState.flatten(this.currentValidationState);
        }

        this.renderSelectionValidationMessage(multiSelectionState);

        if (this.currentValidationState.isValid() !== previousValidationValid) {
            this.notifyValidityChanged(new RecordingValidityChangedEvent(this.currentValidationState,
                this.resolveValidationRecordingPath()).setIncludeChildren(true));
        }

        this.validate(false);
    }

    protected layoutElements() {
        super.layoutElements();
        this.appendChild(this.selectionValidationMessage);
    }
}
