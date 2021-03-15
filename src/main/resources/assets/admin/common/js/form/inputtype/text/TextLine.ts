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
import {AdditionalValidationRecord} from '../../AdditionalValidationRecord';

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

    private validateRegex(inputEl: FormInputEl) {
        if (!this.regexp) {
            return;
        }

        const parent: Element = inputEl.getParentElement();

        if (StringHelper.isEmpty(inputEl.getValue())) {
            parent.removeClass('valid-regexp invalid-regexp');
        } else {
            const isRegExpValid: boolean = this.isRegExpValid(inputEl);
            parent.toggleClass('valid-regexp', isRegExpValid);
            parent.toggleClass('invalid-regexp', !isRegExpValid);
            parent.getEl().setAttribute('data-regex-status', i18n(`field.${isRegExpValid ? 'valid' : 'invalid'}`));

            if (!isRegExpValid) {
                const record: AdditionalValidationRecord =
                    AdditionalValidationRecord.create().setOverwriteDefault(true).setMessage(i18n('field.invalid')).build();

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

    doValidateUserInput(inputEl: FormInputEl) {
        super.doValidateUserInput(inputEl);
        this.validateRegex(inputEl);
    }

    private isRegExpValid(inputEl: FormInputEl): boolean {
        if (!this.regexp) {
            return true;
        }

        return this.regexp.test(inputEl.getValue());
    }

}

InputTypeManager.register(new Class(TextLine.getName().getName(), TextLine), true);
