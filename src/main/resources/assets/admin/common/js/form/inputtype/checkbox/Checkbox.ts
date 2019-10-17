import * as Q from 'q';
import {Property} from '../../../data/Property';
import {Value} from '../../../data/Value';
import {ValueType} from '../../../data/ValueType';
import {ValueTypes} from '../../../data/ValueTypes';
import {BaseInputTypeSingleOccurrence} from '../support/BaseInputTypeSingleOccurrence';
import {Checkbox as CheckboxEl, InputAlignment} from '../../../ui/Checkbox';
import {InputTypeViewContext} from '../InputTypeViewContext';
import {Input} from '../../Input';
import {ValueChangedEvent} from '../../../ValueChangedEvent';
import {InputValidationRecording} from '../InputValidationRecording';
import {InputTypeManager} from '../InputTypeManager';
import {Class} from '../../../Class';
import {ValueTypeConverter} from '../../../data/ValueTypeConverter';

export class Checkbox
    extends BaseInputTypeSingleOccurrence {

    public static debug: boolean = false;
    private checkbox: CheckboxEl;
    private inputAlignment: InputAlignment = InputAlignment.LEFT;

    constructor(config: InputTypeViewContext) {
        super(config);
        this.readConfig(config.inputConfig);
    }

    getValueType(): ValueType {
        return ValueTypes.BOOLEAN;
    }

    newInitialValue(): Value {
        return ValueTypes.BOOLEAN.newBoolean(false);
    }

    layoutProperty(input: Input, property: Property): Q.Promise<void> {
        let checked = property.hasNonNullValue() ? property.getBoolean() : false;
        this.checkbox =
            CheckboxEl.create().setLabelText(input.getLabel()).setChecked(checked).setInputAlignment(this.inputAlignment).build();
        this.appendChild(this.checkbox);

        if (!ValueTypes.BOOLEAN.equals(property.getType())) {
            ValueTypeConverter.convertPropertyValueType(property, ValueTypes.BOOLEAN);
        }

        this.checkbox.onValueChanged((event: ValueChangedEvent) => {
            let newValue = ValueTypes.BOOLEAN.newValue(event.getNewValue());

            this.saveToProperty(newValue);
        });

        return Q<void>(null);
    }

    updateProperty(property: Property, unchangedOnly?: boolean): Q.Promise<void> {
        if (Checkbox.debug) {
            console.debug('Checkbox.updateProperty' + (unchangedOnly ? ' (unchanged only)' : ''), property);
        }
        if ((!unchangedOnly || !this.checkbox.isDirty()) && property.hasNonNullValue()) {
            this.checkbox.setChecked(property.getBoolean());
        } else if (this.checkbox.isDirty()) {
            this.resetPropertyValue();
        }
        return Q<void>(null);
    }

    resetPropertyValue() {
        this.getProperty().setValue(ValueTypes.BOOLEAN.newValue(this.checkbox.getValue()));
    }

    reset() {
        this.checkbox.resetBaseValues();
    }

    giveFocus(): boolean {
        return this.checkbox.giveFocus();
    }

    validate(): InputValidationRecording {

        return new InputValidationRecording();
    }

    onFocus(listener: (event: FocusEvent) => void) {
        this.checkbox.onFocus(listener);
    }

    unFocus(listener: (event: FocusEvent) => void) {
        this.checkbox.unFocus(listener);
    }

    onBlur(listener: (event: FocusEvent) => void) {
        this.checkbox.onBlur(listener);
    }

    unBlur(listener: (event: FocusEvent) => void) {
        this.checkbox.unBlur(listener);
    }

    private readConfig(inputConfig: { [element: string]: { [name: string]: string }[]; }): void {
        if (inputConfig) {
            this.setInputAlignment(inputConfig['alignment']);
        }
    }

    private setInputAlignment(inputAlignmentObj: any) {
        if (inputAlignmentObj) {
            let inputAlignment: InputAlignment = InputAlignment[<string>inputAlignmentObj[0].value.toUpperCase()];
            this.inputAlignment = isNaN(inputAlignment) ? InputAlignment.LEFT : inputAlignment;
        }
    }
}

InputTypeManager.register(new Class('Checkbox', Checkbox), true);
