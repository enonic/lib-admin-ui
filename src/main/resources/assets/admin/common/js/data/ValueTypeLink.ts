import {ObjectHelper} from '../ObjectHelper';
import {Link} from '../util/Link';
import {StringHelper} from '../util/StringHelper';
import {ValueType} from './ValueType';
import {Value} from './Value';

export class ValueTypeLink
    extends ValueType {

    constructor() {
        super('Link');
    }

    isValid(value: any): boolean {
        if (!(typeof value === 'object')) {
            return false;
        }
        if (!ObjectHelper.iFrameSafeInstanceOf(value, Link)) {
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
            return new Value(new Link(value), this);
        } else {
            return this.newNullValue();
        }
    }

    valueToString(value: Value): string {
        if (value.isNotNull()) {
            return value.getLink().toString();
        } else {
            return null;
        }
    }

    toJsonValue(value: Value): any {
        return value.isNull() ? null : value.getLink().toString();
    }

    valueEquals(a: Link, b: Link): boolean {
        return ObjectHelper.equals(a, b);
    }
}
