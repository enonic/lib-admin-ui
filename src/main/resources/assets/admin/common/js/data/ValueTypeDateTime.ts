import {ObjectHelper} from '../ObjectHelper';
import {StringHelper} from '../util/StringHelper';
import {ValueType} from './ValueType';
import {Value} from './Value';
import {Instant} from '../util/Instant';

export class ValueTypeDateTime
    extends ValueType {

    constructor() {
        super('DateTime');
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
        if (value.length < 20) {
            return false;
        }
        return this.isValid(value);
    }

    newValue(value: string): Value {
        if (!value || !this.isConvertible(value)) {
            return this.newNullValue();
        }
        let date: Instant = Instant.fromString(value);
        return new Value(date, this);
    }

    toJsonValue(value: Value): string {
        return value.isNull() ? null : value.getInstant().toString();
    }

    valueToString(value: Value): string {
        return value.getInstant().toString();
    }

    valueEquals(a: Instant, b: Instant): boolean {
        return ObjectHelper.equals(a, b);
    }

    // isValid(value: any): boolean {
    //     if (ObjectHelper.iFrameSafeInstanceOf(value, DateTime)) {
    //         return true;
    //     }
    //     return DateTime.isValidDateTime(value);
    // }
    //
    // isConvertible(value: string): boolean {
    //     if (StringHelper.isBlank(value)) {
    //         return false;
    //     }
    //     // 2010-01-01T10:55:00+01:00
    //     if (value.length < 19) {
    //         return false;
    //     }
    //     return this.isValid(value);
    // }
    //
    // newValue(value: string): Value {
    //     if (!value) {
    //         return this.newNullValue();
    //     }
    //     if (!this.isConvertible(value)) {
    //         return this.newNullValue();
    //     }
    //     let date = DateTime.fromString(value);
    //     return new Value(date, this);
    // }
    //
    // // 2010-01-01T10:55:00+01:00
    // toJsonValue(value: Value): string {
    //     return value.isNull() ? null : value.getDateTime().toString();
    // }
    //
    // valueToString(value: Value): string {
    //     return value.getDateTime().toString();
    // }
    //
    // valueEquals(a: DateTime, b: DateTime): boolean {
    //     return ObjectHelper.equals(a, b);
    // }

}
