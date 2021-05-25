import * as Q from 'q';
import {PropertySet} from '../../../data/PropertySet';
import {PropertyArray} from '../../../data/PropertyArray';
import {ValueTypes} from '../../../data/ValueTypes';
import {i18n} from '../../../util/Messages';
import {DivEl} from '../../../dom/DivEl';
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
import {FormOptionSetOptionViewer} from './FormOptionSetOptionViewer';
import {Dropdown} from '../../../ui/selector/dropdown/Dropdown';
import {OptionBuilder} from '../../../ui/selector/Option';
import {Action} from '../../../ui/Action';

export class FormOptionSetOccurrenceView
    extends FormSetOccurrenceView {

    private selectionValidationMessage: DivEl;

    private singleSelectionDropdown: Dropdown<FormOptionSetOption>;

    private resetAction: Action;

    private formOptionsByNameMap: Map<string, { label: string, index: number }>;

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

    update(dataSet: PropertySet, unchangedOnly?: boolean): Q.Promise<void> {
        return super.update(dataSet, unchangedOnly).then(() => {
            if (this.isSingleSelection()) {
                this.layoutSingleSelection();
            }

            return Q(null);
        });
    }

    layout(validate: boolean = true): Q.Promise<void> {
        this.resetAction = new Action(i18n('action.reset'))
            .onExecuted(_action => {
                this.singleSelectionDropdown.deselectOptions();
                this.singleSelectionDropdown.resetActiveSelection();
            })
            .setEnabled(false);
        return super.layout(validate).then(rendered => {
            if (this.isSingleSelection()) {
                this.addClass('single-selection');
                this.moreButton.prependMenuActions([this.resetAction]);
                this.layoutSingleSelection();
            }
            return rendered;
        });
    }

    private layoutSingleSelection() {
        const selectedValue: string = this.getSelectedOptionsArray().get(0)?.getString() ||
                                      (<FormOptionSet>this.formSet).getOptions().find(op => op.isDefaultOption())?.getName();


        if (selectedValue) {
            // doing this after parent layout to make sure all formItemViews are ready
            this.singleSelectionDropdown.setValue(selectedValue);
        } else {
            // showing/hiding instead of css to trigger FormSetOccurrences onShow/onHide listeners
            this.formSetOccurrencesContainer.hide();
            this.singleSelectionDropdown.deselectOptions();
            this.resetAction.setEnabled(false);
        }
    }

    clean() {
        super.clean();

        const selectedOptionsArray: PropertyArray = this.getSelectedOptionsArray();

        if (!selectedOptionsArray || selectedOptionsArray.isEmpty()) {
            this.propertySet.removeAllProperties();
        }
    }

    setEnabled(enable: boolean) {
        super.setEnabled(enable);
        if (this.isSingleSelection()) {
            this.singleSelectionDropdown.setEnabled(enable);
        }
    }

    refresh() {
        super.refresh();
        if (this.isSingleSelection()) {
            const selected = this.singleSelectionDropdown.getSelectedOption();
            this.resetAction.setEnabled(!!selected);
        }
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

            (<FormOptionSetOptionView>formItemView).onSelectionChanged(
                () => this.handleSelectionChanged(<FormOptionSetOptionView>formItemView));
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
                    this.recursiveFetchLabels(selectedOptionArray, selectedLabels, true);
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

    private validateMultiselection(): ValidationRecording {
        const multiselectionRecording: ValidationRecording = new ValidationRecording();
        const validationRecordingPath: ValidationRecordingPath = this.resolveValidationRecordingPath();
        const totalSelected: number = this.getTotalSelectedOptions();

        if (totalSelected < this.getFormSet().getMultiselection().getMinimum()) {
            multiselectionRecording.breaksMinimumOccurrences(validationRecordingPath);
        }

        if (this.getFormSet().getMultiselection().maximumBreached(totalSelected)) {
            multiselectionRecording.breaksMaximumOccurrences(validationRecordingPath);
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

        return multiselectionRecording;
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

    private handleSelectionChanged(optionView: FormOptionSetOptionView) {

        if (this.isSingleSelection()) {
            const selected = this.singleSelectionDropdown.getSelectedOption();
            this.formSetOccurrencesContainer.setVisible(!!selected && optionView.getFormItemViews().length !== 0);
        }

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
                    new ValidationRecordingPath(this.getDataPath(), optionView.getFormItem().getName()), true, true);
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
    }

    isSingleSelection(): boolean {
        const multi = this.getFormSet().getMultiselection();
        return multi.getMinimum() === 1 && multi.getMaximum() === 1;
    }

    isExpandable(): boolean {
        if (!this.isSingleSelection()) {
            return super.isExpandable();
        } else {
            const option = this.singleSelectionDropdown?.getSelectedOption();
            if (!option) {
                return false;
            } else {
                const idx = this.singleSelectionDropdown.getOptions().indexOf(option);
                const view = <FormOptionSetOptionView>this.formItemViews[idx];
                return view?.isExpandable();
            }
        }
    }

    createSingleSelectionCombo(): Dropdown<FormOptionSetOption> {
        this.singleSelectionDropdown = new Dropdown<FormOptionSetOption>(this.formSet.getName(), {
            optionDisplayValueViewer: new FormOptionSetOptionViewer()
        });

        this.singleSelectionDropdown.setOptions((<FormOptionSet>this.formSet).getOptions()
            .map(fop => new OptionBuilder<FormOptionSetOption>()
                .setValue(fop.getName())    // this is the option ID !
                .setDisplayValue(fop)
                .build()));

        this.singleSelectionDropdown.onOptionSelected((event) => {
            const optionIdx = event.getIndex();
            this.getFormItemViews().forEach((view, idx) => view.setVisible(idx === optionIdx));

            const optionView = <FormOptionSetOptionView>this.getFormItemViews()[event.getIndex()];

            if (optionView) {
                optionView.enableAndExpand();
            }

            this.refresh();
            this.handleSelectionChanged(optionView);
            this.notifyOccurrenceChanged();
        });

        this.singleSelectionDropdown.onOptionDeselected(option => {
            const idx = this.singleSelectionDropdown.getOptions().indexOf(option);

            const optionView = <FormOptionSetOptionView>this.getFormItemViews()[idx];
            if (optionView) {
                optionView.setSelected(false);
                optionView.disableAndCollapse();
            }
            this.refresh();
            this.handleSelectionChanged(optionView);
        });

        return this.singleSelectionDropdown;
    }
}
