import {StringHelper} from '../util/StringHelper';
import {ObjectHelper} from '../ObjectHelper';
import {ValueType} from './ValueType';
import {Value} from './Value';

export class ValueTypeBoolean
    extends ValueType {

    constructor() {
        super('Boolean');
    }

    isValid(value: any): boolean {
        return typeof value === 'boolean';
    }

    isConvertible(value: string): boolean {
        if (StringHelper.isBlank(value)) {
            return false;
        }
        if (!(value === 'true' || value === 'false')) {
            return false;
        }
        let convertedValue = Boolean(value);
        return this.isValid(convertedValue);
    }

    newValue(value: string): Value {
        if (!this.isConvertible(value)) {
            return this.newBoolean(false);
        }
        return new Value(this.convertFromString(value), this);
    }

    fromJsonValue(jsonValue: boolean): Value {
        return new Value(jsonValue, this);
    }

    valueToString(value: Value): string {
        return JSON.stringify(<Boolean>value.getObject());
    }

    valueEquals(a: boolean, b: boolean): boolean {
        return ObjectHelper.booleanEquals(a, b);
    }

    newBoolean(value: boolean): Value {
        return new Value(value, this);
    }

    private convertFromString(value: string): boolean {
        if (value === 'true') {
            return true;
        } else if (value === 'false') {
            return false;
        } else {
            throw new Error('given string cannot be converted to a Boolean Value: ' + value);
        }
    }
}
