import * as Q from 'q';
import {Property} from '../../../data/Property';
import {Value} from '../../../data/Value';
import {ValueType} from '../../../data/ValueType';
import {ValueTypes} from '../../../data/ValueTypes';
import {BaseInputTypeSingleOccurrence} from '../support/BaseInputTypeSingleOccurrence';
import {Checkbox as CheckboxEl, InputAlignment} from '../../../ui/Checkbox';
import {InputTypeViewContext} from '../InputTypeViewContext';
import {Input} from '../../Input';
import {InputTypeManager} from '../InputTypeManager';
import {Class} from '../../../Class';
import {ValueTypeConverter} from '../../../data/ValueTypeConverter';
import {InputValidationRecording} from '../InputValidationRecording';
import {Occurrences} from '../../Occurrences';
import {InputValidityChangedEvent} from '../InputValidityChangedEvent';

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
        const isToBeChecked: boolean = property.hasNonNullValue() ? property.getBoolean() : false;
        this.checkbox =
            CheckboxEl.create().setLabelText(input.getLabel()).setChecked(isToBeChecked).setInputAlignment(this.inputAlignment).build();
        this.appendChild(this.checkbox);

        if (isToBeChecked) {
            this.checkbox.setChecked(true, true);
        }

        if (!ValueTypes.BOOLEAN.equals(property.getType())) {
            ValueTypeConverter.convertPropertyValueType(property, ValueTypes.BOOLEAN);
        }

        this.checkbox.onValueChanged(() => {
            this.saveToProperty(ValueTypes.BOOLEAN.newBoolean(this.checkbox.isChecked() ? true : this.getUncheckedValue()));
        });

        return Q<void>(null);
    }

    private getUncheckedValue(): boolean {
        // if checkbox is required to be checked, and it is not checked then using null as a value to make it invalid on backend
        return this.isRequiredChecked() ? null : false;
    }

    updateProperty(property: Property, unchangedOnly?: boolean): Q.Promise<void> {
        if (Checkbox.debug) {
            console.debug('Checkbox.updateProperty' + (unchangedOnly ? ' (unchanged only)' : ''), property);
        }
        if (!unchangedOnly || !this.checkbox.isDirty()) {
            this.checkbox.setChecked(property.hasNonNullValue() ? property.getBoolean() : false);
        } else if (this.checkbox.isDirty()) {
            this.checkbox.resetBaseValues();
        }
        return Q<void>(null);
    }

    validate(silent: boolean = true): void {
        const isRequiredChecked: boolean = this.isRequiredChecked();
        const occurrences: Occurrences = isRequiredChecked ? Occurrences.minmax(1, 1) : Occurrences.min(0);
        const totalValid: number = ((isRequiredChecked && this.checkbox.isChecked()) || !isRequiredChecked) ? 1 : 0;
        const newValidationRecord: InputValidationRecording = new InputValidationRecording(occurrences, totalValid);

        if (!silent && newValidationRecord.validityChanged(this.previousValidationRecording)) {
            this.notifyValidityChanged(new InputValidityChangedEvent(newValidationRecord));
        }

        this.previousValidationRecording = newValidationRecord;
    }

    private isRequiredChecked(): boolean {
        return this.input.getOccurrences().getMinimum() > 0;
    }

    reset() {
        this.checkbox.resetBaseValues();
    }

    clear(): void {
        super.clear();
        this.checkbox.clear();
    }

    setEnabled(enable: boolean) {
        this.checkbox.setEnabled(enable);
    }

    giveFocus(): boolean {
        return this.checkbox.giveFocus();
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
