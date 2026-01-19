import {ValueType} from '../../../data/ValueType';
import {ValueTypes} from '../../../data/ValueTypes';
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
