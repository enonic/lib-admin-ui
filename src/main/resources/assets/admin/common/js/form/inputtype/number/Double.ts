import {ValueType} from '../../../data/ValueType';
import {ValueTypes} from '../../../data/ValueTypes';
import {Value} from '../../../data/Value';
import {InputTypeViewContext} from '../InputTypeViewContext';
import {Element} from '../../../dom/Element';
import {TextInput} from '../../../ui/text/TextInput';
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
