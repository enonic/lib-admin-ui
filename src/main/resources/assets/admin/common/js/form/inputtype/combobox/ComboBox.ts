import * as Q from 'q';
import {PropertyArray} from '../../../data/PropertyArray';
import {Value} from '../../../data/Value';
import {ValueType} from '../../../data/ValueType';
import {ValueTypes} from '../../../data/ValueTypes';
import {BaseInputTypeManagingAdd} from '../support/BaseInputTypeManagingAdd';
import {InputTypeViewContext} from '../InputTypeViewContext';
import {Input} from '../../Input';
import {InputTypeManager} from '../InputTypeManager';
import {Class} from '../../../Class';
import {ComboBoxOption} from './ComboBoxOption';
import {ValueTypeConverter} from '../../../data/ValueTypeConverter';
import {ComboBoxListInput} from './ComboBoxListInput';
import {StringHelper} from '../../../util/StringHelper';
import {SelectionChange} from '../../../util/SelectionChange';
import {ComboBoxSelectedOptionsView} from './ComboBoxSelectedOptionsView';
import {ObjectHelper} from '../../../ObjectHelper';

export class ComboBox
    extends BaseInputTypeManagingAdd {

    private comboBoxOptions: ComboBoxOption[];

    private listInput: ComboBoxListInput;

    private initiallySelectedItems: string[];

    constructor(context: InputTypeViewContext) {
        super(context, 'combobox-input-type-view');
    }

    getValueType(): ValueType {
        return ValueTypes.STRING;
    }

    newInitialValue(): Value {
        return null;
    }

    layout(input: Input, propertyArray: PropertyArray): Q.Promise<void> {
        if (!ValueTypes.STRING.equals(propertyArray.getType())) {
            ValueTypeConverter.convertArrayValues(propertyArray, ValueTypes.STRING);
        }

        return super.layout(input, propertyArray).then(() => {
            this.initiallySelectedItems = this.getSelectedItems();
            this.listInput = this.createListInput();
            this.listInput.setAriaLabelledBy(this.getContext().labelEl);

            this.appendChild(this.listInput);
            this.setLayoutInProgress(false);

            return Q<void>(null);
        });
    }

    private createListInput(): ComboBoxListInput {
        const listInput = new ComboBoxListInput({
            selectedOptionsView: new ComboBoxSelectedOptionsView(),
            maxSelected: this.getInput().getOccurrences().getMaximum(),
            checkboxPosition: 'right',
            filter: this.comboBoxFilter.bind(this),
            items: this.comboBoxOptions,
            className: 'combobox-list-input',
        });

        // setting saved options
        listInput.selectItems(this.getSelectedItems());

        listInput.onSelectionChanged((selectionChange: SelectionChange<ComboBoxOption>) => {
            selectionChange.selected?.forEach((item: ComboBoxOption) => {
                this.handleOptionSelected(item);
            });

            selectionChange.deselected?.forEach((item: ComboBoxOption) => {
                this.handleOptionDeselected(item);
            });
        });

        return listInput;
    }

    update(propertyArray: PropertyArray, unchangedOnly?: boolean): Q.Promise<void> {
        const isDirty = this.isDirty();

        return super.update(propertyArray, unchangedOnly).then(() => {
            this.initiallySelectedItems = this.getSelectedItems();

            if (!unchangedOnly || !isDirty) {
                this.listInput.updateSelectedItems(this.initiallySelectedItems.slice());
            } else if (isDirty) {
                this.updateDirty();
            }
        });
    }

    private isDirty(): boolean {
        return !ObjectHelper.stringArrayEquals(this.initiallySelectedItems, this.getSelectedItems());
    }

    private updateDirty(): void {
        this.ignorePropertyChange(true);

        this.getPropertyArray().removeAll(true);

        this.listInput.getSelectedOptions().filter((option) => {
            const value = new Value(option.getOption().getDisplayValue().value, ValueTypes.STRING);
            this.getPropertyArray().add(value);
        });

        this.ignorePropertyChange(false);
    }

    reset() {
        this.listInput.updateSelectedItems(this.getSelectedItems());
    }

    clear(): void {
        super.clear();
        this.listInput.clear();
    }

    setEnabled(enable: boolean) {
        super.setEnabled(enable);
        this.listInput.setEnabled(enable);
    }

    giveFocus(): boolean {
        if (this.listInput.maximumOccurrencesReached()) {
            return false;
        }
        return this.listInput.giveFocus();
    }

    onFocus(listener: (event: FocusEvent) => void) {
        this.listInput.onFocus(listener);
    }

    unFocus(listener: (event: FocusEvent) => void) {
        this.listInput.unFocus(listener);
    }

    onBlur(listener: (event: FocusEvent) => void) {
        this.listInput.onBlur(listener);
    }

    unBlur(listener: (event: FocusEvent) => void) {
        this.listInput.unBlur(listener);
    }

    protected getNumberOfValids(): number {
        return this.getPropertyArray().getSize();
    }

    protected readInputConfig(): void {
        const options: ComboBoxOption[] = [];
        const optionValues: Record<string, string>[] = this.context.inputConfig['option'] || [];
        const l: number = optionValues.length;
        let optionValue: Record<string, string>;

        for (let i = 0; i < l; i++) {
            optionValue = optionValues[i];
            options.push({label: optionValue['value'], value: optionValue['@value']});
        }

        this.comboBoxOptions = options;
    }

    private comboBoxFilter(item: ComboBoxOption, searchString: string): boolean {
        return StringHelper.isBlank(searchString) || item.value.toLowerCase().indexOf(searchString.toLowerCase()) >= 0
               || item.label?.toLowerCase().indexOf(searchString.toLowerCase()) >= 0;
    }

    private getSelectedItems(): string[] {
        return this.getValueFromPropertyArray(this.getPropertyArray()).split(';');
    }

    private handleOptionSelected(item: ComboBoxOption): void {
        this.ignorePropertyChange(true);

        let value = new Value(item.value, ValueTypes.STRING);
        if (this.listInput.countSelected() === 1) {
            this.getPropertyArray().set(0, value);
        } else {
            this.getPropertyArray().add(value);
        }

        this.ignorePropertyChange(false);
        this.handleValueChanged(false);

        // this.fireFocusSwitchEvent(event);
    }

    private handleOptionDeselected(item: ComboBoxOption): void {
        const property = this.getPropertyArray().getProperties().find((property) => {
            const propertyValue = property.hasNonNullValue() ? property.getString() : null;
            return propertyValue === item.value;
        });

        if (property) {
            this.ignorePropertyChange(true);
            this.getPropertyArray().remove(property.getIndex());
            this.ignorePropertyChange(false);
            this.handleValueChanged(false);
        }
    }

}

InputTypeManager.register(new Class('ComboBox', ComboBox), true);
