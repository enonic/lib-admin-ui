import {NumberHelper} from '../../../util/NumberHelper';
import {FormInputEl} from '../../../dom/FormInputEl';
import {ValueTypes} from '../../../data/ValueTypes';
import {i18n} from '../../../util/Messages';
import {BaseInputTypeNotManagingAdd} from '../support/BaseInputTypeNotManagingAdd';
import {InputTypeViewContext} from '../InputTypeViewContext';
import {Property} from '../../../data/Property';
import {InputValidationRecording} from '../InputValidationRecording';
import {AdditionalValidationRecord} from '../../AdditionalValidationRecord';
import {TextInputCounterEl} from './TextInputCounterEl';
import * as Q from 'q';

export abstract class TextInputType
    extends BaseInputTypeNotManagingAdd {

    private maxLength: number;

    private showTotalCounter: boolean;

    protected constructor(config: InputTypeViewContext) {
        super(config);
        this.readConfig(config.inputConfig);
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

    protected initOccurrenceListeners(inputEl: FormInputEl) {
        if (this.hasMaxLengthSet() || this.showTotalCounter) {
            const counterEl: TextInputCounterEl = new TextInputCounterEl(inputEl, this.maxLength, this.showTotalCounter);
        }

        return inputEl;
    }

    protected newValueHandler(inputEl: FormInputEl, newValue: string, isValid: boolean = true) {
        const value = isValid ? ValueTypes.STRING.newValue(newValue) : this.newInitialValue();
        this.notifyOccurrenceValueChanged(inputEl, value);
    }

    protected isValid(value: string, _textInput: FormInputEl, _silent: boolean = false,
                      recording?: InputValidationRecording): boolean {
        const isLengthValid: boolean = this.isValidMaxLength(value);

        if (!isLengthValid) {
            if (recording) {
                recording.setAdditionalValidationRecord(
                    AdditionalValidationRecord.create().setOverwriteDefault(true).setMessage(
                        i18n('field.value.breaks.maxlength', this.maxLength)).build());
            }
        }

        return isLengthValid;
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
