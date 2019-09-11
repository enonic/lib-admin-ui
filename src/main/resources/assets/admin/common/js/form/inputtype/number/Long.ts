import {ValueType} from '../../../data/ValueType';
import {ValueTypes} from '../../../data/ValueTypes';
import {Value} from '../../../data/Value';
import {Property} from '../../../data/Property';
import {InputTypeViewContext} from '../InputTypeViewContext';
import {Element} from '../../../dom/Element';
import {TextInput} from '../../../ui/text/TextInput';
import {ValueChangedEvent} from '../../../ValueChangedEvent';
import {InputValidationRecording} from '../InputValidationRecording';
import {NumberHelper} from '../../../util/NumberHelper';
import {FormInputEl} from '../../../dom/FormInputEl';
import {InputTypeManager} from '../InputTypeManager';
import {Class} from '../../../Class';
import {NumberInputType} from './NumberInputType';

export class Long
    extends NumberInputType {

    constructor(config: InputTypeViewContext) {
        super(config);
    }

    getValueType(): ValueType {
        return ValueTypes.LONG;
    }

    newInitialValue(): Value {
        return super.newInitialValue() || ValueTypes.LONG.newNullValue();
    }

    createInputOccurrenceElement(_index: number, property: Property): Element {
        if (!ValueTypes.LONG.equals(property.getType())) {
            property.convertValueType(ValueTypes.LONG);
        }

        let inputEl = TextInput.middle(undefined, this.getPropertyValue(property));
        inputEl.setName(this.getInput().getName() + '-' + property.getIndex());
        inputEl.setAutocomplete(true);

        inputEl.onValueChanged((event: ValueChangedEvent) => {

            let isValid = this.isValid(event.getNewValue());
            let value = isValid ? ValueTypes.LONG.newValue(event.getNewValue()) : this.newInitialValue();

            this.notifyOccurrenceValueChanged(inputEl, value);
            inputEl.updateValidationStatusOnUserInput(isValid);
        });

        this.initPropertyListeners(property, inputEl);

        return inputEl;
    }

    resetInputOccurrenceElement(occurrence: Element) {
        let input = <TextInput>occurrence;

        input.resetBaseValues();
    }

    valueBreaksRequiredContract(value: Value): boolean {
        return value.isNull() || !value.getType().equals(ValueTypes.LONG);
    }

    hasInputElementValidUserInput(inputElement: Element, recording ?: InputValidationRecording) {
        let value = <TextInput>inputElement;

        return this.isValid(value.getValue(), recording);
    }

    protected isValid(value: string, recording?: InputValidationRecording): boolean {
        if (!NumberHelper.isWholeNumber(+value)) {
            return false;
        }
        return super.isValid(value, recording);
    }

    protected updateFormInputElValue(occurrence: FormInputEl, property: Property) {
        occurrence.setValue(this.getPropertyValue(property));
    }

    private initPropertyListeners(property: Property, inputEl: TextInput) {
        const propertyValueChangedListener = () => this.updateInputOccurrenceElement(inputEl, property, true);

        property.onPropertyValueChanged(propertyValueChangedListener);

        inputEl.onRemoved(() => {
            property.unPropertyValueChanged(propertyValueChangedListener);
        });
    }
}

InputTypeManager.register(new Class('Long', Long));
