import * as Q from 'q';
import {Element} from '../../../dom/Element';
import {PropertyArray} from '../../../data/PropertyArray';
import {Value} from '../../../data/Value';
import {ValueType} from '../../../data/ValueType';
import {ValueTypes} from '../../../data/ValueTypes';
import {SelectedOptionEvent} from '../../../ui/selector/combobox/SelectedOptionEvent';
import {BaseInputTypeManagingAdd} from '../support/BaseInputTypeManagingAdd';
import {SelectedOptionsView} from '../../../ui/selector/combobox/SelectedOptionsView';
import {InputTypeViewContext} from '../InputTypeViewContext';
import {Input} from '../../Input';
import {BaseSelectedOptionsView} from '../../../ui/selector/combobox/BaseSelectedOptionsView';
import {ComboBox as ComboBoxEl} from '../../../ui/selector/combobox/ComboBox';
import {OptionFilterInputValueChangedEvent} from '../../../ui/selector/OptionFilterInputValueChangedEvent';
import {Option} from '../../../ui/selector/Option';
import {InputTypeManager} from '../InputTypeManager';
import {Class} from '../../../Class';
import {ComboBoxOption} from './ComboBoxOption';
import {ComboBoxDisplayValueViewer} from './ComboBoxDisplayValueViewer';
import {ValueTypeConverter} from '../../../data/ValueTypeConverter';

export class ComboBox
    extends BaseInputTypeManagingAdd {

    private comboBoxOptions: ComboBoxOption[];

    private comboBox: ComboBoxEl<string>;

    private selectedOptionsView: SelectedOptionsView<string>;

    constructor(context: InputTypeViewContext) {
        super('');
        this.readConfig(context.inputConfig);
    }

    getComboBox(): ComboBoxEl<string> {
        return this.comboBox;
    }

    availableSizeChanged() {
        // console.log('ComboBox.availableSizeChanged(' + this.getEl().getWidth() + 'x' + this.getEl().getWidth() + ')');
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
        super.layout(input, propertyArray);

        this.selectedOptionsView = new BaseSelectedOptionsView<string>();
        this.selectedOptionsView.setEditable(false);
        this.comboBox = this.createComboBox(input, propertyArray);

        this.comboBoxOptions.forEach((option: ComboBoxOption) => {
            this.comboBox.addOption({value: option.value, displayValue: option.label});
        });

        this.appendChild(this.comboBox);
        this.appendChild(<Element> this.selectedOptionsView);

        this.setLayoutInProgress(false);

        return Q<void>(null);
    }

    update(propertyArray: PropertyArray, unchangedOnly?: boolean): Q.Promise<void> {
        const superPromise = super.update(propertyArray, unchangedOnly);

        if (!unchangedOnly || !this.comboBox.isDirty()) {
            return superPromise.then(() => {
                this.comboBox.setValue(this.getValueFromPropertyArray(propertyArray));
            });
        } else if (this.comboBox.isDirty()) {
            this.comboBox.forceChangedEvent();
        }
        return superPromise;
    }

    reset() {
        this.comboBox.resetBaseValues();
    }

    createComboBox(input: Input, propertyArray: PropertyArray): ComboBoxEl<string> {
        let comboBox = new ComboBoxEl<string>(name, {
            filter: this.comboBoxFilter,
            selectedOptionsView: this.selectedOptionsView,
            maximumOccurrences: input.getOccurrences().getMaximum(),
            optionDisplayValueViewer: new ComboBoxDisplayValueViewer(),
            hideComboBoxWhenMaxReached: true,
            value: this.getValueFromPropertyArray(propertyArray)
        });

        comboBox.onOptionFilterInputValueChanged((event: OptionFilterInputValueChangedEvent) => {
            this.comboBox.setFilterArgs({searchString: event.getNewValue()});
        });
        comboBox.onOptionSelected((event: SelectedOptionEvent<string>) => {
            this.ignorePropertyChange = true;

            const option = event.getSelectedOption();
            let value = new Value(option.getOption().value, ValueTypes.STRING);
            if (option.getIndex() >= 0) {
                this.getPropertyArray().set(option.getIndex(), value);
            } else {
                this.getPropertyArray().add(value);
            }

            this.ignorePropertyChange = false;
            this.validate(false);

            this.fireFocusSwitchEvent(event);
        });
        comboBox.onOptionDeselected((event: SelectedOptionEvent<string>) => {
            this.ignorePropertyChange = true;

            this.getPropertyArray().remove(event.getSelectedOption().getIndex());

            this.ignorePropertyChange = false;
            this.validate(false);
        });

        return comboBox;
    }

    giveFocus(): boolean {
        if (this.comboBox.maximumOccurrencesReached()) {
            return false;
        }
        return this.comboBox.giveFocus();
    }

    valueBreaksRequiredContract(value: Value): boolean {
        return value.isNull() || !value.getType().equals(ValueTypes.STRING) || !this.isExistingValue(value.getString());
    }

    onFocus(listener: (event: FocusEvent) => void) {
        this.comboBox.onFocus(listener);
    }

    unFocus(listener: (event: FocusEvent) => void) {
        this.comboBox.unFocus(listener);
    }

    onBlur(listener: (event: FocusEvent) => void) {
        this.comboBox.onBlur(listener);
    }

    unBlur(listener: (event: FocusEvent) => void) {
        this.comboBox.unBlur(listener);
    }

    protected getNumberOfValids(): number {
        return this.getPropertyArray().getSize();
    }

    private readConfig(inputConfig: { [element: string]: { [name: string]: string }[]; }): void {
        let options: ComboBoxOption[] = [];

        let optionValues = inputConfig['option'] || [];
        let l = optionValues.length;
        let optionValue;
        for (let i = 0; i < l; i++) {
            optionValue = optionValues[i];
            options.push({label: optionValue['value'], value: optionValue['@value']});
        }
        this.comboBoxOptions = options;
    }

    private isExistingValue(value: string): boolean {
        return this.comboBoxOptions.some((option: ComboBoxOption) => {
            return option.value === value;
        });
    }

    private comboBoxFilter(item: Option<string>, args: any) {
        // Do not change to one-liner `return !(...);`. Bugs expected with UglifyJs + SlickGrid filter compilation.
        const isEmptyInput = args == null || args.searchString == null;
        return isEmptyInput || item.displayValue.toUpperCase().indexOf(args.searchString.toUpperCase()) !== -1;
    }

}

InputTypeManager.register(new Class('ComboBox', ComboBox), true);
