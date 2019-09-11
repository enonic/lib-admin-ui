import {BaseInputTypeNotManagingAdd} from '../support/BaseInputTypeNotManagingAdd';
import {NumberHelper} from '../../../util/NumberHelper';
import {i18n} from '../../../util/Messages';
import {InputTypeViewContext} from '../InputTypeViewContext';
import {FormInputEl} from '../../../dom/FormInputEl';
import {Property} from '../../../data/Property';
import {InputValidationRecording} from '../InputValidationRecording';
import {StringHelper} from '../../../util/StringHelper';
import {AdditionalValidationRecord} from '../../AdditionalValidationRecord';

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

    protected isValid(value: string, recording ?: InputValidationRecording): boolean {
        if (StringHelper.isEmpty(value)) {
            return true;
        }

        if (NumberHelper.isNumber(+value)) {
            if (!this.isValidMin(NumberHelper.toNumber(value))) {
                if (recording) {
                    recording.setAdditionalValidationRecord(
                        AdditionalValidationRecord.create().setOverwriteDefault(true).setMessage(
                            i18n('field.value.breaks.min', this.min)).build());
                }

                return false;
            }

            if (!this.isValidMax(NumberHelper.toNumber(value))) {
                if (recording) {
                    recording.setAdditionalValidationRecord(
                        AdditionalValidationRecord.create().setOverwriteDefault(true).setMessage(
                            i18n('field.value.breaks.max', this.max)).build());
                }

                return false;
            }

            return true;
        }

        return false;
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
