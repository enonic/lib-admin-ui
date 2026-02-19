import {DateTime} from '../util/DateTime';
import {ObjectHelper} from '../ObjectHelper';
import {StringHelper} from '../util/StringHelper';
import {ValueType} from './ValueType';
import {Value} from './Value';

export class ValueTypeDateTime
    extends ValueType {

    constructor() {
        super('DateTime');
    }

    isValid(value: any): boolean {
        if (ObjectHelper.iFrameSafeInstanceOf(value, DateTime)) {
            return true;
        }
        return DateTime.isValidDateTime(value);
    }

    isConvertible(value: string): boolean {
        if (StringHelper.isBlank(value)) {
            return false;
        }

        return this.isValid(value);
    }

    newValue(value: string): Value {
        if (!value || !this.isConvertible(value)) {
            return this.newNullValue();
        }
        const date: DateTime = DateTime.fromString(value);
        return new Value(date, this);
    }

    toJsonValue(value: Value): string {
        return value.isNull() ? null : this.valueToString(value);
    }

    valueToString(value: Value): string {
        return value.getDateTime().toString();
    }

    valueEquals(a: DateTime, b: DateTime): boolean {
        return ObjectHelper.equals(a, b);
    }
}
