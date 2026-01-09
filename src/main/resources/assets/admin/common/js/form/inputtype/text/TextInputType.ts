import Q from 'q';
import {Property} from '../../../data/Property';
import {Value} from '../../../data/Value';
import {ValueType} from '../../../data/ValueType';
import {ValueTypeConverter} from '../../../data/ValueTypeConverter';
import {ValueTypes} from '../../../data/ValueTypes';
import {Element, LangDirection} from '../../../dom/Element';
import {FormInputEl} from '../../../dom/FormInputEl';
import {Locale} from '../../../locale/Locale';
import {TextInput} from '../../../ui/text/TextInput';
import {i18n} from '../../../util/Messages';
import {NumberHelper} from '../../../util/NumberHelper';
import {StringHelper} from '../../../util/StringHelper';
import {ValueChangedEvent} from '../../../ValueChangedEvent';
import {AdditionalValidationRecord} from '../../AdditionalValidationRecord';
import {AiConfig} from '../InputAiConfig';
import {InputTypeViewContext} from '../InputTypeViewContext';
import {BaseInputTypeNotManagingAdd} from '../support/BaseInputTypeNotManagingAdd';
import {InputValueLengthCounterEl} from './InputValueLengthCounterEl';

export abstract class TextInputType
    extends BaseInputTypeNotManagingAdd {

    private maxLength: number;

    private showTotalCounter: boolean;

    protected constructor(config: InputTypeViewContext) {
        super(config);
        this.readConfig(config.inputConfig);
    }

    getValueType(): ValueType {
        return ValueTypes.STRING;
    }

    protected readConfig(inputConfig: Record<string, Record<string, unknown>[]>): void {
        const maxLengthConfig: object = inputConfig['maxLength'] ? inputConfig['maxLength'][0] : {};
        const maxLength: number = maxLengthConfig['value'];
        this.maxLength = maxLength > 0 ? maxLength : -1;

        const showCounterConfig: object = inputConfig['showCounter'] ? inputConfig['showCounter'][0] : {};
        const value: string = showCounterConfig['value'] || '';
        this.showTotalCounter = value.toLowerCase() === 'true';
    }

    protected updateFormInputElValue(occurrence: FormInputEl, property: Property) {
        occurrence.setValue(property.getString());
    }

    resetInputOccurrenceElement(occurrence: Element): void {
        super.resetInputOccurrenceElement(occurrence);
        (occurrence as FormInputEl).resetBaseValues();
    }

    clearInputOccurrenceElement(occurrence: FormInputEl): void {
        super.clearInputOccurrenceElement(occurrence);

        if (!this.hasDefaultValue(occurrence)) {
            occurrence.clear();
        }
    }

    private hasDefaultValue(occurrence: FormInputEl): boolean {
        const value: string = occurrence.getValue();

        return value && value === this.newInitialValue().getString();
    }

    protected initOccurrenceListeners(inputEl: FormInputEl): void {
        if (this.hasMaxLengthSet() || this.showTotalCounter) {
            new InputValueLengthCounterEl(inputEl, this.maxLength, this.showTotalCounter);
        }

        inputEl.onValueChanged((event: ValueChangedEvent) => {
            this.handleOccurrenceInputValueChanged(inputEl);
        });
    }

    createInputOccurrenceElement(index: number, property: Property): Element {
        if (!this.getValueType().equals(property.getType())) {
            ValueTypeConverter.convertPropertyValueType(property, this.getValueType());
        }

        const inputEl: FormInputEl = this.createInput(index, property).setSpellcheck(true) as FormInputEl;

        this.updateInputLangParams(inputEl);
        this.initOccurrenceListeners(inputEl);

        return inputEl;
    }

    protected updateInputLangParams(inputEl: FormInputEl): void {
        const locale: string = this.getContext().formContext.getLanguage();

        if (!StringHelper.isEmpty(locale)) {
            const language: string = Locale.extractLanguage(locale);
            inputEl.setLang(language);

            if (Locale.supportsRtl(language)) {
                inputEl.setDir(LangDirection.RTL);
            }
        }
    }

    protected getValue(inputEl: TextInput): Value {
        const isValid: boolean = this.isUserInputValid(inputEl);
        return isValid ? this.getValueType().newValue(inputEl.getValue()) : this.newInitialValue();
    }

    protected abstract createInput(index: number, property: Property): FormInputEl;

    valueBreaksRequiredContract(value: Value): boolean {
        return super.valueBreaksRequiredContract(value) || StringHelper.isBlank(value.getString());
    }

    doValidateUserInput(inputEl: FormInputEl) {
        super.doValidateUserInput(inputEl);
        this.validateInputLength(inputEl);
        this.validateTextInput(inputEl);
        this.updateValidationStatusOnUserInput(inputEl, this.occurrenceValidationState.get(inputEl.getId()).isValueValid());
    }

    protected validateTextInput(inputEl: FormInputEl) {
    //
    }

    protected abstract updateValidationStatusOnUserInput(inputEl: FormInputEl, isValid: boolean);

    protected validateInputLength(inputEl: FormInputEl) {
        const isLengthValid: boolean = this.isValidMaxLength(inputEl.getValue());

        if (!isLengthValid) {
            const record: AdditionalValidationRecord =
                AdditionalValidationRecord.create().setMessage(
                    i18n('field.value.breaks.maxlength', this.maxLength)).build();

            this.occurrenceValidationState.get(inputEl.getId()).addAdditionalValidation(record);
        }
    }

    private isValidMaxLength(value: string): boolean {
        return this.hasMaxLengthSet() ? value.length <= this.maxLength : true;
    }

    private hasMaxLengthSet() {
        return this.maxLength > -1;
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.addClass('text-input-type');

            if (this.hasMaxLengthSet()) {
                this.addClass('max-length-limited');
            }

            if (this.showTotalCounter) {
                this.addClass('show-counter');
            }

            return rendered;
        });
    }

    getAiConfig(): AiConfig {
        const formContext = this.getContext().formContext;

        return formContext ? {
            group: formContext.getName(),
            aiTools: formContext.getAiTools(),
        } : super.getAiConfig();
    }
}
