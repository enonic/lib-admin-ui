import {Property} from '../../../data/Property';
import {Value} from '../../../data/Value';
import {ValueType} from '../../../data/ValueType';
import {ValueTypes} from '../../../data/ValueTypes';
import {FormInputEl} from '../../../dom/FormInputEl';
import {Element} from '../../../dom/Element';
import {StringHelper} from '../../../util/StringHelper';
import {i18n} from '../../../util/Messages';
import {InputTypeViewContext} from '../InputTypeViewContext';
import {TextInput} from '../../../ui/text/TextInput';
import {ValueChangedEvent} from '../../../ValueChangedEvent';
import {InputValidationRecording} from '../InputValidationRecording';
import {InputTypeName} from '../../InputTypeName';
import {InputTypeManager} from '../InputTypeManager';
import {Class} from '../../../Class';
import {TextInputType} from './TextInputType';
import {ValueTypeConverter} from '../../../data/ValueTypeConverter';

export class TextLine
    extends TextInputType {

    private regexp: RegExp;

    constructor(config: InputTypeViewContext) {
        super(config);
        this.readConfig(config.inputConfig);
    }

    static getName(): InputTypeName {
        return new InputTypeName('TextLine', false);
    }

    getValueType(): ValueType {
        return ValueTypes.STRING;
    }

    createInputOccurrenceElement(index: number, property: Property): Element {
        if (!ValueTypes.STRING.equals(property.getType())) {
            ValueTypeConverter.convertPropertyValueType(property, ValueTypes.STRING);
        }

        let inputEl = TextInput.middle(undefined, property.getString());
        inputEl.setName(this.getInput().getName() + '-' + index);
        inputEl.setAutocomplete(true);

        inputEl.onValueChanged((event: ValueChangedEvent) => {
            const isValid = this.isValid(event.getNewValue(), inputEl);
            this.newValueHandler(inputEl, event.getNewValue(), isValid);

            inputEl.updateValidationStatusOnUserInput(isValid);

        });

        this.initOccurenceListeners(inputEl);

        return inputEl;
    }

    resetInputOccurrenceElement(occurrence: Element) {
        const input: TextInput = <TextInput> occurrence;

        input.resetBaseValues();
    }

    setEnabledInputOccurrenceElement(occurrence: Element, enable: boolean) {
        const input: TextInput = <TextInput> occurrence;

        input.setEnabled(enable);
    }

    availableSizeChanged() {
        // must be implemented by children
    }

    valueBreaksRequiredContract(value: Value): boolean {
        return value.isNull() || !value.getType().equals(ValueTypes.STRING) ||
               StringHelper.isBlank(value.getString());
    }

    hasInputElementValidUserInput(inputElement: FormInputEl, recording?: InputValidationRecording) {
        let textInput = <TextInput>inputElement;
        return this.isValid(textInput.getValue(), textInput, true, recording);
    }

    protected readConfig(inputConfig: { [element: string]: { [name: string]: string }[]; }): void {
        super.readConfig(inputConfig);

        const regexpConfig = inputConfig['regexp'] ? inputConfig['regexp'][0] : {};
        const regexp = regexpConfig ? regexpConfig['value'] : '';
        this.regexp = !StringHelper.isBlank(regexp) ? new RegExp(regexp) : null;

    }

    protected updateFormInputElValue(occurrence: FormInputEl, property: Property) {
        occurrence.setValue(property.getString());
    }

    protected isValid(value: string, textInput: TextInput, silent: boolean = false,
                      recording?: InputValidationRecording): boolean {

        const parent = textInput.getParentElement();

        if (StringHelper.isEmpty(value)) {
            parent.removeClass('valid-regexp invalid-regexp');
            return true;
        }

        let regexpValid: boolean = this.checkRegexpValidation(value, parent, silent);

        return regexpValid && super.isValid(value, textInput, silent, recording);
    }

    private checkRegexpValidation(value: string, parent: Element, silent: boolean): boolean {

        if (!this.regexp) {
            return true;
        }

        const regexpValid = this.regexp.test(value);

        if (!silent) {
            parent.toggleClass('valid-regexp', regexpValid);
            parent.toggleClass('invalid-regexp', !regexpValid);
            parent.getEl().setAttribute('data-regex-status', i18n(`field.${regexpValid ? 'valid' : 'invalid'}`));
        }

        return regexpValid;
    }

}

InputTypeManager.register(new Class(TextLine.getName().getName(), TextLine), true);
