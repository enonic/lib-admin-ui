import {Property} from '../../../data/Property';
import {FormInputEl} from '../../../dom/FormInputEl';
import {InputTypeViewContext} from '../InputTypeViewContext';
import {Element} from '../../../dom/Element';
import {TextArea as TextAreaEl} from '../../../ui/text/TextArea';
import {InputTypeName} from '../../InputTypeName';
import {InputTypeManager} from '../InputTypeManager';
import {Class} from '../../../Class';
import {TextInputType} from './TextInputType';
import {Value} from '../../../data/Value';

export class TextArea
    extends TextInputType {
    createDefaultValue(raw: unknown): Value {
        throw new Error('Method not implemented.');
    }

    constructor(config: InputTypeViewContext) {
        super(config);
        this.readConfig(config.inputConfig);
    }

    static getName(): InputTypeName {
        return new InputTypeName('TextArea', false);
    }

    protected createInput(index: number, property: Property): FormInputEl {
        const value = property.hasNonNullValue() ? property.getString() : undefined;
        const inputEl: TextAreaEl = new TextAreaEl(this.getInput().getName() + '-' + index, value);
        inputEl.setSpellcheck(true);

        return inputEl;
    }

    protected updateValidationStatusOnUserInput(inputEl: TextAreaEl, isValid: boolean) {
        inputEl.updateValidationStatusOnUserInput(isValid);
    }

    setEnabledInputOccurrenceElement(occurrence: Element, enable: boolean) {
        const input: TextAreaEl = occurrence as TextAreaEl;

        input.setEnabled(enable);
    }
}

InputTypeManager.register(new Class(TextArea.getName().getName(), TextArea), true);
