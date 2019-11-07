import {ObjectHelper} from '../ObjectHelper';
import {LocalTime} from '../util/LocalTime';
import {StringHelper} from '../util/StringHelper';
import {ValueType} from './ValueType';
import {Value} from './Value';

export class ValueTypeLocalTime
    extends ValueType {

    constructor() {
        super('LocalTime');
    }

    isValid(value: any): boolean {

        if (!(typeof value === 'object')) {
            return false;
        }
        if (!ObjectHelper.iFrameSafeInstanceOf(value, LocalTime)) {
            return false;
        }
        return true;
    }

    isConvertible(value: string): boolean {
        if (StringHelper.isBlank(value)) {
            return false;
        }
        return LocalTime.isValidString(value);
    }

    newValue(value: string): Value {
        if (!value) {
            return this.newNullValue();
        }

        if (!this.isConvertible(value)) {
            return this.newNullValue();
        }
        return new Value(LocalTime.fromString(value), this);
    }

    valueToString(value: Value): string {
        if (value.isNotNull()) {
            return value.getLocalTime().toString();
        } else {
            return null;
        }
    }

    valueEquals(a: LocalTime, b: LocalTime): boolean {
        return ObjectHelper.equals(a, b);
    }

    toJsonValue(value: Value): string {
        return value.isNull() ? null : value.getLocalTime().toString();
    }
}
