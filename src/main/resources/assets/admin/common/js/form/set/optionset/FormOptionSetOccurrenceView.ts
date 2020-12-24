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
import {FormOptionSetOptionViewer} from './FormOptionSetOptionViewer';
import {Dropdown} from '../../../ui/selector/dropdown/Dropdown';
import {OptionBuilder} from '../../../ui/selector/Option';
import {Action} from '../../../ui/Action';

export class FormOptionSetOccurrenceView
    extends FormSetOccurrenceView {

    private selectionValidationMessage: DivEl;

    private singleSelectionDropdown: Dropdown<FormOptionSetOption>;

    private toggleContainerMenuAction: Action;

    constructor(config: FormSetOccurrenceViewConfig<FormOptionSetOccurrenceView>) {
        super('form-option-set-', config);

        this.ensureSelectionArrayExists(this.propertySet);
    }

    layout(validate: boolean = true): Q.Promise<void> {
        this.toggleContainerMenuAction = new Action('')
            .onExecuted(_action => {
                this.showContainer(!this.isContainerVisible());
            })
            .setEnabled(false);
        return super.layout(validate).then(rendered => {
            if (this.isSingleSelection()) {
                this.addClass('single-selection');
                this.toggleContainerMenuAction.setLabel(this.getToggleContainerMenuItemLabel(false));
                this.moreButton.prependMenuActions([this.toggleContainerMenuAction]);
                let selectedValue = this.getSelectedOptionsArray().get(0)?.getString();
                if (!selectedValue) {
                    selectedValue = (<FormOptionSet>this.formSet).getOptions().find(op => op.isDefaultOption())?.getName();
                }

                if (selectedValue) {
                    // doing this after parent layout to make sure all formItemViews are ready
                    this.singleSelectionDropdown.setValue(selectedValue);
                } else {
                    this.formSetOccurrencesContainer.addClass('empty');
                }
            }
            return rendered;
        });
    }

    showContainer(show: boolean) {
        super.showContainer(show);
        if (this.isSingleSelection()) {
            this.toggleContainerMenuAction.setLabel(this.getToggleContainerMenuItemLabel(!show));
        }
    }

    clean() {
        this.formItemViews.forEach((view: FormItemView) => {
            if (ObjectHelper.iFrameSafeInstanceOf(view, FormOptionSetOptionView)) {
                (<FormOptionSetOptionView>view).clean();
            }
        });
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
            this.toggleContainerMenuAction.setEnabled(selected && selected.getDisplayValue().getFormItems().length > 0);
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
        let selectedLabels: string[] = [];

        if (selectionArray && !selectionArray.isEmpty()) {
            const nameLabelMap = new Map<string, any>(
                this.getFormItems()
                    .filter((formItem: FormItem) => formItem instanceof FormOptionSetOption)
                    .map((formItem: FormOptionSetOption, index: number) => {
                        return [formItem.getName(), {label: formItem.getLabel(), index: index}] as [string, any];
                    })
            );

            selectedLabels = selectionArray.getProperties()
                .sort((one: Property, two: Property) => {
                    return nameLabelMap.get(one.getString()).index - nameLabelMap.get(two.getString()).index;
                })
                .map((selectedProp: Property) => nameLabelMap.get(selectedProp.getString()).label);
        }

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

    private handleSelectionChanged(optionView: FormOptionSetOptionView) {
        this.updateLabel();

        if (this.isSingleSelection()) {
            this.formSetOccurrencesContainer.toggleClass('empty', optionView.getFormItemViews().length === 0);
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

    createSingleSelectionCombo(): Dropdown<FormOptionSetOption> {
        // return new OptionSetOptionsComboBox(<FormOptionSet>this.formSet);

        this.singleSelectionDropdown = new Dropdown(this.formSet.getName(), {
            optionDisplayValueViewer: new FormOptionSetOptionViewer(),
        });

        this.singleSelectionDropdown.setOptions((<FormOptionSet>this.formSet).getOptions()
            .map(fop => new OptionBuilder<FormOptionSetOption>()
                .setValue(fop.getName())
                .setDisplayValue(fop)
                .build()));

        let selectedProp = this.getSelectedOptionsArray().get(0);

        this.singleSelectionDropdown.onOptionSelected((event) => {
            const option = event.getOption();
            const optionIdx = event.getIndex();
            this.getFormItemViews().forEach((view, idx) => view.setVisible(idx === optionIdx));

            if (!selectedProp) {
                selectedProp = this.getSelectedOptionsArray().set(0, new Value(option.getValue(), new ValueTypeString()));
            } else {
                selectedProp.setValue(new Value(option.getValue(), new ValueTypeString()));
            }

            const optionView = <FormOptionSetOptionView>this.getFormItemViews()[event.getIndex()];
            if (optionView) {
                optionView.enableAndExpand();
            }

            this.refresh();

            this.handleSelectionChanged(optionView);
        });

        this.singleSelectionDropdown.onOptionDeselected(option => {
            const idx = this.singleSelectionDropdown.getOptions().indexOf(option);

            const optionView = <FormOptionSetOptionView>this.getFormItemViews()[idx];
            if (optionView) {
                optionView.disableAndCollapse();
            }

            this.handleSelectionChanged(optionView);
        });

        return this.singleSelectionDropdown;
    }

    private getToggleContainerMenuItemLabel(expand: boolean) {
        return expand ? i18n('button.expand') : i18n('button.collapse');
    }
}
