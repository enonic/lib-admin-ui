import {Property} from '../../../data/Property';
import {FormInputEl} from '../../../dom/FormInputEl';
import {Element} from '../../../dom/Element';
import {StringHelper} from '../../../util/StringHelper';
import {i18n} from '../../../util/Messages';
import {InputTypeViewContext} from '../InputTypeViewContext';
import {TextInput} from '../../../ui/text/TextInput';
import {InputTypeName} from '../../InputTypeName';
import {InputTypeManager} from '../InputTypeManager';
import {Class} from '../../../Class';
import {TextInputType} from './TextInputType';
import {AdditionalValidationRecord} from '../../AdditionalValidationRecord';

export class TextLine
    extends TextInputType {

    private regexp: RegExp;

    constructor(config: InputTypeViewContext) {
        super(config);
        this.readConfig(config.inputConfig);
    }

    static getName(): InputTypeName {
        return new InputTypeName('base:TextLine', false);
    }

    protected createInput(index: number, property: Property): FormInputEl {
        const inputEl: TextInput = TextInput.middle(undefined, property.getString());
        inputEl.setName(this.getInput().getName() + '-' + index);
        inputEl.setAutocomplete(true);

        return inputEl;
    }

    private validateRegex(inputEl: FormInputEl) {
        if (!StringHelper.isEmpty(inputEl.getValue())) {
            const isRegExpValid: boolean = this.isRegExpValid(inputEl);

            if (!isRegExpValid) {
                const record: AdditionalValidationRecord =
                    AdditionalValidationRecord.create().setMessage(i18n('field.value.invalid')).build();

                this.occurrenceValidationState.get(inputEl.getId()).addAdditionalValidation(record);
            }
        }
    }

    setEnabledInputOccurrenceElement(occurrence: Element, enable: boolean) {
        const input: TextInput = <TextInput>occurrence;

        input.setEnabled(enable);
    }

    protected readConfig(inputConfig: { [element: string]: { [name: string]: string }[]; }): void {
        super.readConfig(inputConfig);

        const regexpConfig = inputConfig['regexp'] ? inputConfig['regexp'][0] : {};
        const regexp = regexpConfig ? regexpConfig['value'] : '';
        this.regexp = !StringHelper.isBlank(regexp) ? new RegExp(regexp) : null;

    }

    protected updateValidationStatusOnUserInput(inputEl: TextInput, isValid: boolean) {
        inputEl.updateValidationStatusOnUserInput(isValid);
    }

    protected validateTextInput(inputEl: FormInputEl) {
        if (this.regexp) {
            this.validateRegex(inputEl);
        }
    }

    private isRegExpValid(inputEl: FormInputEl): boolean {
        if (!this.regexp) {
            return true;
        }

        return this.regexp.test(inputEl.getValue());
    }

}

InputTypeManager.register(new Class(TextLine.getName().getName(), TextLine), true);
