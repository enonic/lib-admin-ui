import * as Q from 'q';
import {Property} from '../../../data/Property';
import {Value} from '../../../data/Value';
import {ValueType} from '../../../data/ValueType';
import {ValueTypes} from '../../../data/ValueTypes';
import {BaseInputTypeSingleOccurrence} from '../support/BaseInputTypeSingleOccurrence';
import {RadioGroup} from '../../../ui/RadioGroup';
import {InputValidationRecording} from '../InputValidationRecording';
import {InputTypeViewContext} from '../InputTypeViewContext';
import {Input} from '../../Input';
import {InputValidityChangedEvent} from '../InputValidityChangedEvent';
import {ValueChangedEvent} from '../../../ValueChangedEvent';
import {InputTypeManager} from '../InputTypeManager';
import {Class} from '../../../Class';
import {ValueTypeConverter} from '../../../data/ValueTypeConverter';

export class RadioButton
    extends BaseInputTypeSingleOccurrence {

    private selector: RadioGroup;
    private radioButtonOptions: { label: string; value: string; }[];

    constructor(config: InputTypeViewContext) {
        super(config, 'radio-button');
        this.readConfig(config.inputConfig);
    }

    getValueType(): ValueType {
        return ValueTypes.STRING;
    }

    newInitialValue(): Value {
        return ValueTypes.STRING.newNullValue();
    }

    layoutProperty(input: Input, property: Property): Q.Promise<void> {
        this.input = input;

        this.selector = this.createRadioElement(input.getName(), property);

        this.appendChild(this.selector);

        if (!ValueTypes.STRING.equals(property.getType())) {
            ValueTypeConverter.convertPropertyValueType(property, ValueTypes.STRING);
            if (!this.isValidOption(property.getString())) {
                property.setValue(ValueTypes.STRING.newNullValue());
            }
        }

        return Q<void>(null);
    }

    updateProperty(property: Property, unchangedOnly: boolean): Q.Promise<void> {
        if ((!unchangedOnly || !this.selector.isDirty())) {
            this.selector.setValue(property.hasNonNullValue() ? property.getString() : '');
        } else if (this.selector.isDirty()) {
            this.selector.forceChangedEvent();
        }
        return Q<any>(null);
    }

    reset() {
        this.selector.resetBaseValues();
    }

    giveFocus(): boolean {
        return this.selector.giveFocus();
    }

    setEnabled(enable: boolean) {
        this.selector.setEnabled(enable);
    }

    validate(silent: boolean = true) {
        const isValueSelected: boolean = this.getProperty().getValue().isNotNull();
        const recording: InputValidationRecording = new InputValidationRecording(this.input.getOccurrences(), isValueSelected ? 1 : 0);

        if (!silent && recording.validityChanged(this.previousValidationRecording)) {
            this.notifyValidityChanged(new InputValidityChangedEvent(recording));
        }

        this.previousValidationRecording = recording;
    }

    onFocus(listener: (event: FocusEvent) => void) {
        this.selector.onFocus(listener);
    }

    unFocus(listener: (event: FocusEvent) => void) {
        this.selector.unFocus(listener);
    }

    onBlur(listener: (event: FocusEvent) => void) {
        this.selector.onBlur(listener);
    }

    unBlur(listener: (event: FocusEvent) => void) {
        this.selector.unBlur(listener);
    }

    private readConfig(inputConfig: { [element: string]: { [name: string]: string }[]; }): void {
        let options: { label: string; value: string; }[] = [];

        let optionValues = inputConfig['option'] || [];
        let l = optionValues.length;
        let optionValue;
        for (let i = 0; i < l; i++) {
            optionValue = optionValues[i];
            options.push({label: optionValue['value'], value: optionValue['@value']});
        }
        this.radioButtonOptions = options;
    }

    private createRadioElement(name: string, property: Property): RadioGroup {

        let value = property.hasNonNullValue ? property.getString() : undefined;
        let radioGroup = new RadioGroup(name, value);

        let options = this.radioButtonOptions;
        let l = options.length;
        for (let i = 0; i < l; i++) {
            let option = options[i];
            radioGroup.addOption(option.value, option.label);
        }

        radioGroup.onValueChanged((event: ValueChangedEvent) => {
            this.saveToProperty(ValueTypes.STRING.newValue(event.getNewValue()));
        });

        return radioGroup;
    }

    private isValidOption(value: string): boolean {
        let options = this.radioButtonOptions;
        let l = options.length;
        for (let i = 0; i < l; i++) {
            let option = options[i];
            if (option.value === value) {
                return true;
            }
        }
        return false;
    }
}

InputTypeManager.register(new Class('RadioButton', RadioButton), true);
