import {Instant} from '../util/Instant';
import {ObjectHelper} from '../ObjectHelper';
import {StringHelper} from '../util/StringHelper';
import {ValueType} from './ValueType';
import {Value} from './Value';

export class ValueTypeInstant
    extends ValueType {

    constructor() {
        super('Instant');
    }

    isValid(value: any): boolean {
        if (ObjectHelper.iFrameSafeInstanceOf(value, Instant)) {
            return true;
        }

        return Instant.isValidInstant(value);
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
        const date: Instant = Instant.fromString(value);
        return new Value(date, this);
    }

    toJsonValue(value: Value): string {
        return value.isNull() ? null : this.valueToString(value);
    }

    valueToString(value: Value): string {
        return value.getInstant().toString();
    }

    valueEquals(a: Instant, b: Instant): boolean {
        return ObjectHelper.equals(a, b);
    }
}
