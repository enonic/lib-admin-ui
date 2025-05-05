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
import {OptionSetArrayHelper} from './OptionSetArrayHelper';
import * as Q from 'q';

export abstract class FormOptionSetOccurrenceView
    extends FormSetOccurrenceView {

    protected static SELECTED_NAME: string = '_selected';

    protected selectionValidationMessage: DivEl;

    protected formOptionsByNameMap: Map<string, { label: string, index: number }>;

    private stashedPropertySets: Map<string, PropertySet | PropertyArray> = new Map<string, PropertySet | PropertyArray>();

    private checkboxEnabledStatusHandler: () => void;

    constructor(config: FormSetOccurrenceViewConfig<FormOptionSetOccurrenceView>) {
        super('form-option-set-', config);
    }

    protected initElements() {
        super.initElements();

        this.selectionValidationMessage = new DivEl('selection-message');

        this.formOptionsByNameMap = new Map<string, any>(
            this.getFormItems()
                .filter((formItem: FormItem) => formItem instanceof FormOptionSetOption)
                .map((formItem: FormOptionSetOption, index: number) => {
                    return [formItem.getName(), {label: formItem.getLabel(), index: index}] as [string, any];
                })
        );

        this.checkboxEnabledStatusHandler = (() => {
            this.formItemViews.forEach((formItemView: FormOptionSetOptionView) => formItemView.updateCheckBoxDisabled());
        });
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
            formItemView.onSelectionChanged((isSelected: boolean) => this.handleSelectionChanged(formItemView, isSelected));
        });
    }

    protected postLayout(validate: boolean = true): void {
        super.postLayout(validate);

        this.removeNotSelectedEntriesFromPropertySet();

        if (!this.isSingleSelection()) {
            this.checkboxEnabledStatusHandler();
        }

        this.subscribeOnSelectedOptionsArray();
    }

    private removeNotSelectedEntriesFromPropertySet(): void {
        this.formItemViews.forEach((formItemView: FormOptionSetOptionView) => {
            if (!this.isSelected(formItemView.getName())) {
                this.handleOptionDeselected(formItemView);
            }
        });
    }

    update(dataSet: PropertySet, unchangedOnly?: boolean): Q.Promise<void> {
        this.stashedPropertySets.clear();

        return super.update(dataSet, unchangedOnly).then(() => {
            this.removeNotSelectedEntriesFromPropertySet();
            return Q.resolve();
        });
    }

    protected updatePropertySet(dataSet: PropertySet) {
        this.unSubscribeOnSelectedOptionsArray();
        super.updatePropertySet(dataSet);
        this.subscribeOnSelectedOptionsArray();
    }

    private ensureSelectionArrayExists(): void {
        if (!this.getSelectedOptionsArray()) {
            if (this.stashedPropertySets.has(FormOptionSetOccurrenceView.SELECTED_NAME)) {
                this.propertySet.addPropertyArray(this.stashedPropertySets.get(FormOptionSetOccurrenceView.SELECTED_NAME) as PropertyArray);
            } else {
                this.createSelectionArray();
                this.subscribeOnSelectedOptionsArray();
            }
        }
    }

    private createSelectionArray(): void {
        const selectionPropertyArray: PropertyArray =
            PropertyArray.create()
                .setType(ValueTypes.STRING)
                .setName(FormOptionSetOccurrenceView.SELECTED_NAME)
                .setParent(this.propertySet)
                .build();
        this.propertySet.addPropertyArray(selectionPropertyArray);
    }

    protected getSelectedOptionsArray(): PropertyArray {
        return this.propertySet.getPropertyArray(FormOptionSetOccurrenceView.SELECTED_NAME);
    }

    protected extraValidation(validationRecording: ValidationRecording) {
        const multiSelectionState: ValidationRecording = this.validateMultiSelection();
        validationRecording.flatten(multiSelectionState);
        this.renderSelectionValidationMessage(multiSelectionState);
    }

    protected getFormSet(): FormOptionSet {
        return this.formSet as FormOptionSet;
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

    protected handleSelectionChanged(optionView: FormOptionSetOptionView, isSelected: boolean): void {
        this.updateSelectionAndOptionArrays(optionView, isSelected);

        if (this.currentValidationState) {
            this.updateValidation(optionView);
        }
    }

    private updateSelectionAndOptionArrays(optionView: FormOptionSetOptionView, isSelected: boolean): void {
        if (isSelected) {
            this.handleOptionSelected(optionView);
        } else {
            this.handleOptionDeselected(optionView);
        }
    }

    handleOptionSelected(optionView: FormOptionSetOptionView): void {
        const name: string = optionView.getName();

        if (this.stashedPropertySets.has(name)) {
            this.addPropertySet(name, this.stashedPropertySets.get(name) as PropertySet);
            this.stashedPropertySets.delete(name);
        }

        this.ensureSelectionArrayExists();
        new OptionSetArrayHelper(this.getSelectedOptionsArray()).add(name, this.isSingleSelection());
    }

    handleOptionDeselected(optionView: FormOptionSetOptionView): void {
        const name: string = optionView.getName();
        this.stashAndRemoveExistingSetFromParent(name);

        const selectedOptionsArray: PropertyArray = this.getSelectedOptionsArray();

        if (selectedOptionsArray) {
            new OptionSetArrayHelper(selectedOptionsArray).remove(name);

            if (selectedOptionsArray.isEmpty()) {
                this.stashedPropertySets.set(FormOptionSetOccurrenceView.SELECTED_NAME, selectedOptionsArray);
                this.propertySet.removeEmptySets();
            }
        }
    }

    private updateValidation(optionView: FormOptionSetOptionView): void {
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

        // this changes currentValidationState so should come before notifyValidityChanged
        this.validate(false);

        if (this.currentValidationState.isValid() !== previousValidationValid) {
            this.notifyValidityChanged(new RecordingValidityChangedEvent(this.currentValidationState,
                this.resolveValidationRecordingPath()).setIncludeChildren(true));
        }

    }

    protected layoutElements() {
        super.layoutElements();
        this.appendChild(this.selectionValidationMessage);
    }

    getOrPopulateOptionItemsPropertySet(name: string): PropertySet {
        return this.getPropertySetByName(name) || this.populateOptionItemsPropertySet(name);
    }

    private getPropertySetByName(name: string): PropertySet {
        return this.propertySet.getPropertyArray(name)?.getSet(0);
    }

    private populateOptionItemsPropertySet(name: string): PropertySet {
        const propertyArray: PropertyArray =
            PropertyArray.create().setType(ValueTypes.DATA).setName(name).setParent(this.propertySet).build();
        propertyArray.addSet();
        this.propertySet.addPropertyArray(propertyArray);

        return propertyArray.getSet(0);
    }

    removeProperty(name: string): void {
        this.propertySet.removeProperty(name, 0);
    }

    addPropertySet(name: string, propertySet: PropertySet): void {
        this.propertySet.addPropertySet(name, propertySet);
    }

    isSelected(name: string): boolean {
        return !!this.getSelectedOptionsArray()?.some((property: Property) => property.getString() === name);
    }

    private stashAndRemoveExistingSetFromParent(name: string): void {
        const existingSet: PropertySet = this.getPropertySetByName(name);

        if (existingSet) {
            this.stashedPropertySets.set(name, this.getPropertySetByName(name));
            this.removeProperty(name);
        }
    }

    private subscribeOnSelectedOptionsArray() {
        if (this.isSingleSelection()) {
            return;
        }

        this.getSelectedOptionsArray()?.onPropertyAdded(this.checkboxEnabledStatusHandler);
        this.getSelectedOptionsArray()?.onPropertyRemoved(this.checkboxEnabledStatusHandler);
    }

    private unSubscribeOnSelectedOptionsArray() {
        if (this.isSingleSelection()) {
            return;
        }

        this.getSelectedOptionsArray()?.unPropertyAdded(this.checkboxEnabledStatusHandler);
        this.getSelectedOptionsArray()?.unPropertyRemoved(this.checkboxEnabledStatusHandler);
    }

    isSingleSelection(): boolean {
        const multiSelection: Occurrences = this.getMultiSelection();
        return multiSelection.getMinimum() === 1 && multiSelection.getMaximum() === 1;
    }

    private getMultiSelection(): Occurrences {
        return (this.formSet as FormOptionSet).getMultiselection();
    }
}
