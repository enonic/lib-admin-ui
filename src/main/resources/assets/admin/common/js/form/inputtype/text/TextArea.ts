import {Property} from '../../../data/Property';
import {Value} from '../../../data/Value';
import {ValueType} from '../../../data/ValueType';
import {ValueTypes} from '../../../data/ValueTypes';
import {FormInputEl} from '../../../dom/FormInputEl';
import {InputTypeViewContext} from '../InputTypeViewContext';
import {Element} from '../../../dom/Element';
import {ValueChangedEvent} from '../../../ValueChangedEvent';
import {StringHelper} from '../../../util/StringHelper';
import {TextArea as TextAreaEl} from '../../../ui/text/TextArea';
import {InputValidationRecording} from '../InputValidationRecording';
import {InputTypeName} from '../../InputTypeName';
import {InputTypeManager} from '../InputTypeManager';
import {Class} from '../../../Class';
import {TextInputType} from './TextInputType';
import {ValueTypeConverter} from '../../../data/ValueTypeConverter';

export class TextArea
    extends TextInputType {

    constructor(config: InputTypeViewContext) {
        super(config);
        this.readConfig(config.inputConfig);
    }

    static getName(): InputTypeName {
        return new InputTypeName('TextArea', false);
    }

    getValueType(): ValueType {
        return ValueTypes.STRING;
    }

    newInitialValue(): Value {
        return super.newInitialValue() || new Value('', ValueTypes.STRING);
    }

    createInputOccurrenceElement(index: number, property: Property): Element {
        if (!ValueTypes.STRING.equals(property.getType())) {
            ValueTypeConverter.convertPropertyValueType(property, ValueTypes.STRING);
        }

        const value = property.hasNonNullValue() ? property.getString() : undefined;
        const inputEl = new TextAreaEl(this.getInput().getName() + '-' + index, value);

        inputEl.onValueChanged((event: ValueChangedEvent) => {
            const isValid = this.isValid(event.getNewValue(), inputEl);
            this.newValueHandler(inputEl, event.getNewValue(), isValid);
        });

        this.initOccurenceListeners(inputEl);

        return inputEl;
    }

    resetInputOccurrenceElement(occurrence: Element) {
        const input: TextAreaEl = <TextAreaEl> occurrence;

        input.resetBaseValues();
    }

    setEnabledInputOccurrenceElement(occurrence: Element, enable: boolean) {
        const input: TextAreaEl = <TextAreaEl> occurrence;

        input.setEnabled(enable);
    }

    valueBreaksRequiredContract(value: Value): boolean {
        return value.isNull() || !value.getType().equals(ValueTypes.STRING) ||
               StringHelper.isBlank(value.getString());
    }

    hasInputElementValidUserInput(inputElement: FormInputEl, recording?: InputValidationRecording) {
        let textInput = inputElement;
        return this.isValid(textInput.getValue(), textInput, true, recording);
    }

    protected updateFormInputElValue(occurrence: FormInputEl, property: Property) {
        occurrence.setValue(property.getString());
    }
}

InputTypeManager.register(new Class(TextArea.getName().getName(), TextArea), true);
