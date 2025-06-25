import type {Property} from '../data/Property';
import type {Value} from '../data/Value';
import type {ValueType} from '../data/ValueType';
import {ValueTypeConverter} from '../data/ValueTypeConverter';
import {type Element, LangDirection} from '../dom/Element';
import type {FormInputEl} from '../dom/FormInputEl';
import {AdditionalValidationRecord} from '../form/AdditionalValidationRecord';
import type {AiConfig} from '../form/inputtype/InputAiConfig';
import type {InputTypeViewContext} from '../form/inputtype/InputTypeViewContext';
import {BaseInputTypeNotManagingAdd} from '../form/inputtype/support/BaseInputTypeNotManagingAdd';
import {Locale} from '../locale/Locale';
import {StringHelper} from '../util/StringHelper';
import type {InputTypeConfig} from './descriptor/InputTypeConfig';
import type {InputTypeDescriptor} from './descriptor/InputTypeDescriptor';

/**
 * Abstract base for new-style input types that delegate pure logic to a descriptor.
 *
 * Extends BaseInputTypeNotManagingAdd for InputView compatibility.
 * The descriptor handles: value type, config parsing, default values, validation.
 * This class handles: DOM lifecycle, occurrence listeners, InputView integration.
 */
export abstract class BaseInputType<C extends InputTypeConfig = InputTypeConfig> extends BaseInputTypeNotManagingAdd {
    protected readonly descriptor: InputTypeDescriptor<C>;
    protected typedConfig: C;

    protected constructor(descriptor: InputTypeDescriptor<C>, context: InputTypeViewContext, className?: string) {
        super(context, className);
        this.descriptor = descriptor;
        this.typedConfig = descriptor.readConfig(context.inputConfig);
    }

    getValueType(): ValueType {
        return this.descriptor.getValueType();
    }

    createDefaultValue(raw: unknown): Value {
        return this.descriptor.createDefaultValue(raw);
    }

    valueBreaksRequiredContract(value: Value): boolean {
        return this.descriptor.valueBreaksRequired(value);
    }

    doValidateUserInput(inputEl: Element) {
        super.doValidateUserInput(inputEl);

        const formInputEl = inputEl as FormInputEl;
        const value = this.descriptor.getValueType().newValue(formInputEl.getValue());
        const results = this.descriptor.validate(value, this.typedConfig);

        for (const result of results) {
            const record = AdditionalValidationRecord.create().setMessage(result.message).build();
            this.occurrenceValidationState.get(inputEl.getId()).addAdditionalValidation(record);
        }
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

    protected abstract createInput(index: number, property: Property): FormInputEl;

    protected abstract initOccurrenceListeners(inputEl: FormInputEl): void;

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

    getAiConfig(): AiConfig {
        const formContext = this.getContext().formContext;

        return formContext
            ? {
                  group: formContext.getName(),
                  aiTools: formContext.getAiTools(),
              }
            : super.getAiConfig();
    }

    private hasDefaultValue(occurrence: FormInputEl): boolean {
        const value: string = occurrence.getValue();
        return value && value === this.newInitialValue().getString();
    }
}
