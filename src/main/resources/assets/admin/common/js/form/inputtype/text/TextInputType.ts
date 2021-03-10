import {NumberHelper} from '../../../util/NumberHelper';
import {DivEl} from '../../../dom/DivEl';
import {FormInputEl} from '../../../dom/FormInputEl';
import {Element} from '../../../dom/Element';
import {ValueTypes} from '../../../data/ValueTypes';
import {i18n} from '../../../util/Messages';
import {BaseInputTypeNotManagingAdd} from '../support/BaseInputTypeNotManagingAdd';
import {InputTypeViewContext} from '../InputTypeViewContext';
import {Property} from '../../../data/Property';
import {InputValidationRecording} from '../InputValidationRecording';
import {AdditionalValidationRecord} from '../../AdditionalValidationRecord';
import {Value} from '../../../data/Value';

export abstract class TextInputType
    extends BaseInputTypeNotManagingAdd {

    private maxLength: number;

    constructor(config: InputTypeViewContext) {
        super(config);
        this.readConfig(config.inputConfig);

        if (NumberHelper.isNumber(this.maxLength)) {
            this.addClass('max-length-limited');
        }
    }

    newInitialValue(): Value {
        return super.newInitialValue() || ValueTypes.STRING.newNullValue();
    }

    protected readConfig(inputConfig: { [element: string]: { [name: string]: string }[]; }): void {
        const maxLengthConfig = inputConfig['maxLength'] ? inputConfig['maxLength'][0] : {};
        const maxLength = NumberHelper.toNumber(maxLengthConfig['value']);
        this.maxLength = maxLength > 0 ? maxLength : null;
    }

    protected updateFormInputElValue(occurrence: FormInputEl, property: Property) {
        occurrence.setValue(property.getString());
    }

    protected initOccurenceListeners(inputEl: FormInputEl) {

        if (NumberHelper.isNumber(this.maxLength)) {

            inputEl.onValueChanged(() => {
                const lengthCounter = Element.fromHtmlElement(
                    (<HTMLElement>inputEl.getParentElement().getHTMLElement().querySelector('.length-counter')));
                if (lengthCounter) {
                    this.updateLengthCounterValue(lengthCounter, inputEl.getValue());
                }
            });

            inputEl.onRendered(() => {
                const lengthCounter = new DivEl('length-counter');
                this.updateLengthCounterValue(lengthCounter, inputEl.getValue());

                inputEl.getParentElement().appendChild(lengthCounter);
            });

        }

        return inputEl;
    }

    protected newValueHandler(inputEl: FormInputEl, newValue: string, isValid: boolean = true) {
        const value = isValid ? ValueTypes.STRING.newValue(newValue.trim()) : this.newInitialValue();
        this.notifyOccurrenceValueChanged(inputEl, value);
    }

    protected isValid(value: string, _textInput: FormInputEl, _silent: boolean = false,
                      recording?: InputValidationRecording): boolean {
        const lengthValid = this.isValidMaxLength(value);

        if (!lengthValid) {
            if (recording) {
                recording.setAdditionalValidationRecord(
                    AdditionalValidationRecord.create().setOverwriteDefault(true).setMessage(
                        i18n('field.value.breaks.maxlength', this.maxLength)).build());
            }

        }

        return lengthValid;
    }

    private updateLengthCounterValue(lengthCounter: DivEl, newValue: string) {
        lengthCounter.setHtml(`${this.maxLength - newValue.length}`);
    }

    private isValidMaxLength(value: string): boolean {
        return NumberHelper.isNumber(this.maxLength) ? value.length <= this.maxLength : true;
    }
}
