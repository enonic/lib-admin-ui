import * as Q from 'q';
import {PropertyArray} from '../../../data/PropertyArray';
import {Value} from '../../../data/Value';
import {ValueType} from '../../../data/ValueType';
import {ValueTypes} from '../../../data/ValueTypes';
import {SelectedOptionEvent} from '../../../ui/selector/combobox/SelectedOptionEvent';
import {BaseInputTypeManagingAdd} from '../support/BaseInputTypeManagingAdd';
import {InputTypeViewContext} from '../InputTypeViewContext';
import {Input} from '../../Input';
import {ComboBox as ComboBoxEl} from '../../../ui/selector/combobox/ComboBox';
import {Option} from '../../../ui/selector/Option';
import {InputTypeManager} from '../InputTypeManager';
import {Class} from '../../../Class';
import {ComboBoxOption} from './ComboBoxOption';
import {ComboBoxDisplayValueViewer} from './ComboBoxDisplayValueViewer';
import {ValueTypeConverter} from '../../../data/ValueTypeConverter';
import {ComboBoxListInput} from './ComboBoxListInput';
import {StringHelper} from '../../../util/StringHelper';
import {ValueChangedEvent} from '../ValueChangedEvent';
import {SelectionChange} from '../../../util/SelectionChange';
import {ComboBoxSelectedOptionsView} from './ComboBoxSelectedOptionsView';

export class ComboBox
    extends BaseInputTypeManagingAdd {

    private comboBoxOptions: ComboBoxOption[];

    private listInput: ComboBoxListInput;

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
            this.listInput = this.createListInput();
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
        const superPromise = super.update(propertyArray, unchangedOnly);

        if (!unchangedOnly || this.getPropertyArray().equals(propertyArray)) {
            return superPromise.then(() => {
                //this.listInput.updateSelectedOptions();
            });
        } else if (!this.getPropertyArray().equals(propertyArray)) {
            this.notifyValueChanged(new ValueChangedEvent(null, -1)); // triggering Save button
        }
        return superPromise;
    }

    reset() {
        //
    }

    clear(): void {
        super.clear();
        this.listInput.clear();
    }

    setEnabled(enable: boolean) {
        super.setEnabled(enable);
        this.listInput.setEnabled(enable);
    }

    createComboBox(input: Input, propertyArray: PropertyArray): ComboBoxEl<string> {
        const name = input.getName();
        let comboBox = new ComboBoxEl<string>(name, {
            filter: null,
            selectedOptionsView: null,
            maximumOccurrences: input.getOccurrences().getMaximum(),
            optionDisplayValueViewer: new ComboBoxDisplayValueViewer(),
            rowHeight: 34,
            hideComboBoxWhenMaxReached: true,
            value: this.getValueFromPropertyArray(propertyArray)
        });

        comboBox.onOptionSelected((event: SelectedOptionEvent<string>) => {
            this.ignorePropertyChange(true);

            const option = event.getSelectedOption();
            let value = new Value(option.getOption().getValue(), ValueTypes.STRING);
            if (option.getIndex() >= 0) {
                this.getPropertyArray().set(option.getIndex(), value);
            } else {
                this.getPropertyArray().add(value);
            }

            this.ignorePropertyChange(false);
            this.handleValueChanged(false);

            this.fireFocusSwitchEvent(event);
        });
        comboBox.onOptionDeselected((event: SelectedOptionEvent<string>) => {
            this.ignorePropertyChange(true);

            this.getPropertyArray().remove(event.getSelectedOption().getIndex());

            this.ignorePropertyChange(false);
            this.handleValueChanged(false);
        });

        return comboBox;
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

    private comboBoxFilter(item: Option<ComboBoxOption>, searchString: string): boolean {
        return StringHelper.isBlank(searchString) || item.getDisplayValue().value.indexOf(searchString) >= 0;
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
