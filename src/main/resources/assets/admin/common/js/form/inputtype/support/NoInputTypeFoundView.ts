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

    layout(input: Input, property?: PropertyArray): Q.Promise<void> {
        const divEl: DivEl = new DivEl();
        divEl.getEl().setInnerHtml('Warning: no input type found: ' + input.getInputType().toString());

        return super.layout(input, property);
    }

    createInputOccurrenceElement(_index: number, property: Property): Element {
        const inputEl: TextInput = TextInput.middle();
        inputEl.setName(this.getInput().getName());

        if (property != null) {
            inputEl.setValue(property.getString());
        }

        inputEl.onValueChanged((event: ValueChangedEvent) => {
            this.handleOccurrenceInputValueChanged(inputEl, event);
        });

        return inputEl;
    }

    protected getValue(inputEl: Element, data?: ValueChangedEvent): Value {
        return this.getValueType().newValue(data.getNewValue());
    }

    resetInputOccurrenceElement(occurrence: Element): void {
        super.resetInputOccurrenceElement(occurrence);

        const input: TextInput = occurrence as TextInput;
        input.resetBaseValues();
    }

    clearInputOccurrenceElement(occurrence: Element): void {
        super.clearInputOccurrenceElement(occurrence);
        (occurrence as TextInput).clear();
    }

    setEnabledInputOccurrenceElement(occurrence: Element, enable: boolean) {
        const input: TextInput = occurrence as TextInput;

        input.setEnabled(enable);
    }

    valueBreaksRequiredContract(value: Value): boolean {
        return super.valueBreaksRequiredContract(value) || StringHelper.isBlank(value.getString());
    }

    protected updateFormInputElValue(occurrence: FormInputEl, property: Property) {
        occurrence.setValue(property.getString());
    }
}

InputTypeManager.register(new Class('NoInputTypeFound', NoInputTypeFoundView), true);
