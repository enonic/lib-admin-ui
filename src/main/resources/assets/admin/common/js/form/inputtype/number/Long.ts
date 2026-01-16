import {ValueType} from '../../../data/ValueType';
import {ValueTypes} from '../../../data/ValueTypes';
import {Value} from '../../../data/Value';
import {InputTypeViewContext} from '../InputTypeViewContext';
import {TextInput} from '../../../ui/text/TextInput';
import {NumberHelper} from '../../../util/NumberHelper';
import {InputTypeManager} from '../InputTypeManager';
import {Class} from '../../../Class';
import {NumberInputType} from './NumberInputType';
import {AdditionalValidationRecord} from '../../AdditionalValidationRecord';
import {i18n} from '../../../util/Messages';

export class Long
    extends NumberInputType {

    constructor(config: InputTypeViewContext) {
        super(config);
    }

    createDefaultValue(rawValue: unknown): Value {
        const valueType = this.getValueType();
        if (typeof rawValue !== 'number') {
            return valueType.newNullValue();
        }
        return valueType.fromJsonValue(rawValue);
    }

    getValueType(): ValueType {
        return ValueTypes.LONG;
    }

    doValidateUserInput(inputEl: TextInput) {
        if (!NumberHelper.isWholeNumber(+inputEl.getValue())) {
            const record: AdditionalValidationRecord =
                AdditionalValidationRecord.create().setMessage(i18n('field.value.invalid')).build();

            this.occurrenceValidationState.get(inputEl.getId()).addAdditionalValidation(record);
        }

        super.doValidateUserInput(inputEl);
    }
}

InputTypeManager.register(new Class('Long', Long), true);
