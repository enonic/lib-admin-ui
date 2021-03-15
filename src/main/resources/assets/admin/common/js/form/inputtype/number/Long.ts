import {ValueType} from '../../../data/ValueType';
import {ValueTypes} from '../../../data/ValueTypes';
import {Value} from '../../../data/Value';
import {InputTypeViewContext} from '../InputTypeViewContext';
import {Element} from '../../../dom/Element';
import {TextInput} from '../../../ui/text/TextInput';
import {NumberHelper} from '../../../util/NumberHelper';
import {FormInputEl} from '../../../dom/FormInputEl';
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
        super.doValidateUserInput(inputEl);

        if (!NumberHelper.isWholeNumber(+inputEl.getValue())) {
            const record: AdditionalValidationRecord =
                AdditionalValidationRecord.create().setOverwriteDefault(true).setMessage(
                    i18n('field.value.invalid')).build();

            this.occurrenceValidationState.get(inputEl.getId()).addAdditionalValidation(record);
        }
    }
}

InputTypeManager.register(new Class('Long', Long), true);
