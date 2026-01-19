import {ValueType} from '../../../data/ValueType';
import {ValueTypes} from '../../../data/ValueTypes';
import {InputTypeViewContext} from '../InputTypeViewContext';
import {InputTypeManager} from '../InputTypeManager';
import {Class} from '../../../Class';
import {NumberInputType} from './NumberInputType';

export class Double
    extends NumberInputType {

    constructor(config: InputTypeViewContext) {
        super(config);
    }

    getValueType(): ValueType {
        return ValueTypes.DOUBLE;
    }

}

InputTypeManager.register(new Class('Double', Double), true);
