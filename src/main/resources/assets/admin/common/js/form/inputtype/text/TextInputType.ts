import {NumberHelper} from '../../../util/NumberHelper';
import {FormInputEl} from '../../../dom/FormInputEl';
import {ValueTypes} from '../../../data/ValueTypes';
import {i18n} from '../../../util/Messages';
import {BaseInputTypeNotManagingAdd} from '../support/BaseInputTypeNotManagingAdd';
import {InputTypeViewContext} from '../InputTypeViewContext';
import {Property} from '../../../data/Property';
import {AdditionalValidationRecord} from '../../AdditionalValidationRecord';
import {InputValueLengthCounterEl} from './InputValueLengthCounterEl';
import * as Q from 'q';
import {Value} from '../../../data/Value';
import {StringHelper} from '../../../util/StringHelper';
import {Element} from '../../../dom/Element';
import {ValueTypeConverter} from '../../../data/ValueTypeConverter';
import {ValueChangedEvent} from '../../../ValueChangedEvent';
import {ValueType} from '../../../data/ValueType';
import {TextInput} from '../../../ui/text/TextInput';

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

    protected readConfig(inputConfig: { [element: string]: { [name: string]: string }[]; }): void {
        const maxLengthConfig: Object = inputConfig['maxLength'] ? inputConfig['maxLength'][0] : {};
        const maxLength: number = NumberHelper.toNumber(maxLengthConfig['value']);
        this.maxLength = maxLength > 0 ? maxLength : -1;

        const showCounterConfig: Object = inputConfig['showCounter'] ? inputConfig['showCounter'][0] : {};
        const value: string = showCounterConfig['value'] || '';
        this.showTotalCounter = value.toLowerCase() === 'true';
    }

    protected updateFormInputElValue(occurrence: FormInputEl, property: Property) {
        occurrence.setValue(property.getString());
    }

    resetInputOccurrenceElement(occurrence: Element) {
        (<FormInputEl>occurrence).resetBaseValues();
    }

    protected initOccurrenceListeners(inputEl: FormInputEl) {
        if (this.hasMaxLengthSet() || this.showTotalCounter) {
            const counterEl: InputValueLengthCounterEl = new InputValueLengthCounterEl(inputEl, this.maxLength, this.showTotalCounter);
        }

        return inputEl;
    }

    createInputOccurrenceElement(index: number, property: Property): Element {
        if (!this.getValueType().equals(property.getType())) {
            ValueTypeConverter.convertPropertyValueType(property, this.getValueType());
        }

        const inputEl: FormInputEl = this.createInput(index, property);

        inputEl.onValueChanged((event: ValueChangedEvent) => {
            this.handleOccurrenceInputValueChanged(inputEl);
        });

        inputEl.setSpellcheck(true);
        const lang = this.getContext().formContext.getLanguage();
        if (!StringHelper.isEmpty(lang)) {
            const langs = lang.split('-');
            inputEl.setLang(langs.length > 1 ? langs[0] : lang);
        }

        this.initOccurrenceListeners(inputEl);

        return inputEl;
    }

    protected getValue(inputEl: TextInput): Value {
        const isValid: boolean = this.isUserInputValid(inputEl);
        return isValid ? this.getValueType().newValue(inputEl.getValue().trim()) : this.newInitialValue();
    }

    protected abstract createInput(index: number, property: Property): FormInputEl;

    valueBreaksRequiredContract(value: Value): boolean {
        return super.valueBreaksRequiredContract(value) || StringHelper.isBlank(value.getString());
    }

    doValidateUserInput(inputEl: FormInputEl) {
        super.doValidateUserInput(inputEl);
        this.validateInputLength(inputEl);
        this.updateValidationStatusOnUserInput(inputEl, this.occurrenceValidationState.get(inputEl.getId()).isValueValid());
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
}
