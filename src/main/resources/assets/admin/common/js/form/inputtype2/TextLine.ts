import Q from 'q';
import {Property} from '../../data/Property';
import {Value} from '../../data/Value';
import {Element} from '../../dom/Element';
import {FormInputEl} from '../../dom/FormInputEl';
import {TextInput} from '../../ui/text/TextInput';
import {ValueChangedEvent} from '../../ValueChangedEvent';
import {InputTypeName} from '../InputTypeName';
import {InputTypeManager} from '../inputtype/InputTypeManager';
import {InputTypeViewContext} from '../inputtype/InputTypeViewContext';
import {InputValueLengthCounterEl} from '../inputtype/text/InputValueLengthCounterEl';
import {TextLineDescriptor} from '../inputtype/descriptor/TextLineDescriptor';
import {TextLineConfig} from '../inputtype/descriptor/InputTypeConfig';
import {Class} from '../../Class';
import {BaseInputType} from './BaseInputType';

export class TextLine
    extends BaseInputType<TextLineConfig> {

    constructor(config: InputTypeViewContext) {
        super(TextLineDescriptor, config);
    }

    static getName(): InputTypeName {
        return new InputTypeName('TextLine', false);
    }

    protected createInput(index: number, property: Property): FormInputEl {
        const inputEl: TextInput = TextInput.middle(undefined, property.getString());
        inputEl.setName(this.getInput().getName() + '-' + index);
        inputEl.setAutocomplete(true);

        return inputEl;
    }

    protected initOccurrenceListeners(inputEl: FormInputEl): void {
        if (this.hasMaxLengthSet() || this.typedConfig.showCounter) {
            new InputValueLengthCounterEl(inputEl, this.typedConfig.maxLength, this.typedConfig.showCounter);
        }

        inputEl.onValueChanged((event: ValueChangedEvent) => {
            this.handleOccurrenceInputValueChanged(inputEl);
        });
    }

    doValidateUserInput(inputEl: Element) {
        super.doValidateUserInput(inputEl);
        const isValid = this.occurrenceValidationState.get(inputEl.getId()).isValueValid();
        (inputEl as TextInput).updateValidationStatusOnUserInput(isValid);
    }

    protected getValue(inputEl: TextInput): Value {
        const isValid: boolean = this.isUserInputValid(inputEl);
        return isValid ? this.getValueType().newValue(inputEl.getValue()) : this.newInitialValue();
    }

    setEnabledInputOccurrenceElement(occurrence: Element, enable: boolean) {
        const input: TextInput = occurrence as TextInput;
        input.setEnabled(enable);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.addClass('text-input-type');

            if (this.hasMaxLengthSet()) {
                this.addClass('max-length-limited');
            }

            if (this.typedConfig.showCounter) {
                this.addClass('show-counter');
            }

            return rendered;
        });
    }

    private hasMaxLengthSet(): boolean {
        return this.typedConfig.maxLength > -1;
    }
}

InputTypeManager.register(new Class(TextLine.getName().getName(), TextLine), true);
