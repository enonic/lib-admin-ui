import {ValueType} from '../../../data/ValueType';
import {ValueTypes} from '../../../data/ValueTypes';
import {InputTypeViewContext} from '../InputTypeViewContext';
import {InputTypeManager} from '../InputTypeManager';
import {Class} from '../../../Class';
import {NumberInputType} from './NumberInputType';
import {Value} from '../../../data/Value';

export class Double
    extends NumberInputType {

    createDefaultValue(rawValue: unknown): Value {
        const valueType = this.getValueType();
        if (typeof rawValue !== 'number') {
            return valueType.newNullValue();
        }
        return valueType.fromJsonValue(rawValue);
    }

    constructor(config: InputTypeViewContext) {
        super(config);
    }

    getValueType(): ValueType {
        return ValueTypes.DOUBLE;
    }

}

InputTypeManager.register(new Class('Double', Double), true);
