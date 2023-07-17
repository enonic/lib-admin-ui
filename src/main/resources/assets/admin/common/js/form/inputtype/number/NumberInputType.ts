import {BaseInputTypeNotManagingAdd} from '../support/BaseInputTypeNotManagingAdd';
import {NumberHelper} from '../../../util/NumberHelper';
import {i18n} from '../../../util/Messages';
import {InputTypeViewContext} from '../InputTypeViewContext';
import {FormInputEl} from '../../../dom/FormInputEl';
import {Property} from '../../../data/Property';
import {StringHelper} from '../../../util/StringHelper';
import {AdditionalValidationRecord} from '../../AdditionalValidationRecord';
import {Element} from '../../../dom/Element';
import {ValueTypeConverter} from '../../../data/ValueTypeConverter';
import {TextInput} from '../../../ui/text/TextInput';
import {ValueChangedEvent} from '../../../ValueChangedEvent';
import {Value} from '../../../data/Value';

export abstract class NumberInputType
    extends BaseInputTypeNotManagingAdd {

    private min: number = null;
    private max: number = null;

    constructor(config: InputTypeViewContext) {
        super(config);
        this.readConfig(config);
    }

    protected readConfig(config: InputTypeViewContext): void {
        this.min = this.getConfigProperty(config, 'min');
        this.max = this.getConfigProperty(config, 'max');
    }

    protected updateFormInputElValue(occurrence: FormInputEl, property: Property) {
        occurrence.setValue(this.getPropertyValue(property));
    }

    resetInputOccurrenceElement(occurrence: Element): void {
        super.resetInputOccurrenceElement(occurrence);

        (occurrence as FormInputEl).resetBaseValues();
    }

    clearInputOccurrenceElement(occurrence: Element): void {
        super.clearInputOccurrenceElement(occurrence);

        (occurrence as FormInputEl).clear();
    }

    createInputOccurrenceElement(_index: number, property: Property): Element {
        if (!this.getValueType().equals(property.getType())) {
            ValueTypeConverter.convertPropertyValueType(property, this.getValueType());
        }

        const inputEl: TextInput = this.createInput(_index, property);

        inputEl.onValueChanged((event: ValueChangedEvent) => {
            this.handleOccurrenceInputValueChanged(inputEl);
        });

        return inputEl;
    }

    protected getValue(inputEl: TextInput): Value {
        const isValid: boolean = this.isUserInputValid(inputEl);
        return isValid ? this.getValueType().newValue(inputEl.getValue()) : this.newInitialValue();
    }

    setEnabledInputOccurrenceElement(occurrence: Element, enable: boolean) {
        const input: TextInput = occurrence as TextInput;

        input.setEnabled(enable);
    }

    protected createInput(index: number, property: Property): TextInput {
        const inputEl: TextInput = TextInput.middle(undefined, this.getPropertyValue(property));
        inputEl.setName(this.getInput().getName() + '-' + property.getIndex());
        inputEl.setAutocomplete(true);

        return inputEl;
    }

    protected updateValidationStatusOnUserInput(inputEl: TextInput, isValid: boolean) {
        inputEl.updateValidationStatusOnUserInput(isValid);
    }

    doValidateUserInput(inputEl: TextInput) {
        super.doValidateUserInput(inputEl);

        if (NumberHelper.isNumber(+inputEl.getValue())) {
            this.validateMinMax(inputEl);
        } else {
            const record: AdditionalValidationRecord =
                AdditionalValidationRecord.create().setMessage(
                    i18n('field.value.invalid')).build();

            this.occurrenceValidationState.get(inputEl.getId()).addAdditionalValidation(record);
        }

        this.updateValidationStatusOnUserInput(inputEl, this.occurrenceValidationState.get(inputEl.getId()).isValueValid());
    }

    private validateMinMax(inputEl: TextInput) {
        const value: string = inputEl.getValue();

        if (!this.isValidMin(NumberHelper.toNumber(value))) {
            const record: AdditionalValidationRecord =
                AdditionalValidationRecord.create().setMessage(
                    i18n('field.value.breaks.min', this.min)).build();
            this.occurrenceValidationState.get(inputEl.getId()).addAdditionalValidation(record);
        } else if (!this.isValidMax(NumberHelper.toNumber(value))) {
            const record: AdditionalValidationRecord =
                AdditionalValidationRecord.create().setMessage(
                    i18n('field.value.breaks.max', this.max)).build();

            this.occurrenceValidationState.get(inputEl.getId()).addAdditionalValidation(record);
        }
    }

    private getConfigProperty(config: InputTypeViewContext, propertyName: string) {
        const configProperty = config.inputConfig[propertyName] ? config.inputConfig[propertyName][0] : {};
        return NumberHelper.toNumber(configProperty['value']);
    }

    private isValidMin(value: number) {
        if (NumberHelper.isNumber(value)) {
            if (NumberHelper.isNumber(this.min)) {
                return value >= this.min;
            }
        }
        return true;
    }

    private isValidMax(value: number) {
        if (NumberHelper.isNumber(value)) {
            if (NumberHelper.isNumber(this.max)) {
                return value <= this.max;
            }
        }
        return true;
    }
}
