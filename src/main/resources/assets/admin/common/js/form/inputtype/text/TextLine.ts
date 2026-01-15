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
import {Value} from '../../../data/Value';

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

    protected createInput(index: number, property: Property): FormInputEl {
        const inputEl: TextInput = TextInput.middle(undefined, property.getString());
        inputEl.setName(this.getInput().getName() + '-' + index);
        inputEl.setAutocomplete(true);

        return inputEl;
    }

    createDefaultValue(rawValue: unknown): Value {
        if (typeof rawValue !== 'string') {
            return this.getValueType().newNullValue();
        }
        return this.getValueType().newValue(rawValue);
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
        const input: TextInput = occurrence as TextInput;

        input.setEnabled(enable);
    }

    protected readConfig(inputConfig: Record<string, Record<string, unknown>[]>): void {
        super.readConfig(inputConfig);

        const regexpConfig = inputConfig['regexp'] ? inputConfig['regexp'][0] : {};
        const regexp = regexpConfig ? regexpConfig['value'] as string : '';
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
