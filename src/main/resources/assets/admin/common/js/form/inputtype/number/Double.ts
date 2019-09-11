import {ValueType} from '../../../data/ValueType';
import {ValueTypes} from '../../../data/ValueTypes';
import {Value} from '../../../data/Value';
import {Property} from '../../../data/Property';
import {InputTypeViewContext} from '../InputTypeViewContext';
import {Element} from '../../../dom/Element';
import {TextInput} from '../../../ui/text/TextInput';
import {ValueChangedEvent} from '../../../ValueChangedEvent';
import {InputValidationRecording} from '../InputValidationRecording';
import {InputTypeManager} from '../InputTypeManager';
import {Class} from '../../../Class';
import {NumberInputType} from './NumberInputType';

export class Double
    extends NumberInputType {

    constructor(config: InputTypeViewContext) {
        super(config);
    }

    getValueType(): ValueType {
        return ValueTypes.DOUBLE;
    }

    newInitialValue(): Value {
        return super.newInitialValue() || ValueTypes.DOUBLE.newNullValue();
    }

    createInputOccurrenceElement(_index: number, property: Property): Element {
        if (!ValueTypes.DOUBLE.equals(property.getType())) {
            property.convertValueType(ValueTypes.DOUBLE);
        }

        let inputEl = TextInput.middle(undefined, this.getPropertyValue(property));
        inputEl.setName(this.getInput().getName() + '-' + property.getIndex());
        inputEl.setAutocomplete(true);

        inputEl.onValueChanged((event: ValueChangedEvent) => {
            let isValid = this.isValid(event.getNewValue());
            let value = isValid ? ValueTypes.DOUBLE.newValue(event.getNewValue()) : this.newInitialValue();

            this.notifyOccurrenceValueChanged(inputEl, value);
            inputEl.updateValidationStatusOnUserInput(isValid);
        });

        return inputEl;
    }

    resetInputOccurrenceElement(occurrence: Element) {
        let input = <TextInput> occurrence;

        input.resetBaseValues();
    }

    valueBreaksRequiredContract(value: Value): boolean {
        return value.isNull() || !value.getType().equals(ValueTypes.DOUBLE);
    }

    hasInputElementValidUserInput(inputElement: Element, recording ?: InputValidationRecording) {
        let value = <TextInput>inputElement;

        return this.isValid(value.getValue(), recording);
    }
}

InputTypeManager.register(new Class('Double', Double));
