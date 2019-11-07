import * as Q from 'q';
import {Property} from '../../../data/Property';
import {PropertyArray} from '../../../data/PropertyArray';
import {Value} from '../../../data/Value';
import {ValueType} from '../../../data/ValueType';
import {ValueTypes} from '../../../data/ValueTypes';
import {Input} from '../../Input';
import {DivEl} from '../../../dom/DivEl';
import {Element} from '../../../dom/Element';
import {TextInput} from '../../../ui/text/TextInput';
import {ValueChangedEvent} from '../../../ValueChangedEvent';
import {FormInputEl} from '../../../dom/FormInputEl';
import {StringHelper} from '../../../util/StringHelper';
import {InputTypeManager} from '../InputTypeManager';
import {Class} from '../../../Class';
import {BaseInputTypeNotManagingAdd} from './BaseInputTypeNotManagingAdd';

export class NoInputTypeFoundView
    extends BaseInputTypeNotManagingAdd {

    getValueType(): ValueType {
        return ValueTypes.STRING;
    }

    newInitialValue(): Value {
        return super.newInitialValue() || ValueTypes.STRING.newValue('');
    }

    layout(input: Input, property?: PropertyArray): Q.Promise<void> {

        let divEl = new DivEl();
        divEl.getEl().setInnerHtml('Warning: no input type found: ' + input.getInputType().toString());

        return super.layout(input, property);
    }

    createInputOccurrenceElement(_index: number, property: Property): Element {

        let inputEl = TextInput.middle();
        inputEl.setName(this.getInput().getName());
        if (property != null) {
            inputEl.setValue(property.getString());
        }
        inputEl.onValueChanged((event: ValueChangedEvent) => {
            let value = ValueTypes.STRING.newValue(event.getNewValue());
            this.notifyOccurrenceValueChanged(inputEl, value);
        });

        return inputEl;
    }

    resetInputOccurrenceElement(occurrence: Element) {
        let input = <TextInput> occurrence;

        input.resetBaseValues();
    }

    valueBreaksRequiredContract(value: Value): boolean {
        return value.isNull() || !value.getType().equals(ValueTypes.STRING) ||
               StringHelper.isBlank(value.getString());
    }

    hasInputElementValidUserInput(_inputElement: Element) {

        // TODO
        return true;
    }

    protected updateFormInputElValue(occurrence: FormInputEl, property: Property) {
        occurrence.setValue(property.getString());
    }
}

InputTypeManager.register(new Class('NoInputTypeFound', NoInputTypeFoundView), true);
