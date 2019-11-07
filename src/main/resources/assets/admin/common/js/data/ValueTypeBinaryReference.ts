import {ObjectHelper} from '../ObjectHelper';
import {BinaryReference} from '../util/BinaryReference';
import {StringHelper} from '../util/StringHelper';
import {ValueType} from './ValueType';
import {Value} from './Value';

export class ValueTypeBinaryReference
    extends ValueType {

    constructor() {
        super('BinaryReference');
    }

    isValid(value: any): boolean {
        if (!(typeof value === 'object')) {
            return false;
        }
        if (!ObjectHelper.iFrameSafeInstanceOf(value, BinaryReference)) {
            return false;
        }
        return true;
    }

    isConvertible(value: string): boolean {
        if (StringHelper.isBlank(value)) {
            return false;
        }
        return true;
    }

    newValue(value: string): Value {
        if (this.isConvertible(value)) {
            return new Value(new BinaryReference(value), this);
        } else {
            return this.newNullValue();
        }
    }

    valueToString(value: Value): string {
        if (value.isNotNull()) {
            return value.getBinaryReference().toString();
        } else {
            return null;
        }
    }

    toJsonValue(value: Value): any {
        return value.isNull() ? null : value.getBinaryReference().toString();
    }

    valueEquals(a: BinaryReference, b: BinaryReference): boolean {
        return ObjectHelper.equals(a, b);
    }
}
