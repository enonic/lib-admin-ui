import {Equitable} from '../Equitable';
import {ObjectHelper} from '../ObjectHelper';
import {ClassHelper} from '../ClassHelper';
import {Value} from './Value';

export class ValueType
    implements Equitable {

    private name: string;

    constructor(name: string) {
        this.name = name;
    }

    toString(): string {
        return this.name;
    }

    valueToString(value: Value): string {
        return String(value.getObject());
    }

    valueToBoolean(value: Value): boolean {
        return value.getString() === 'true';
    }

    valueToNumber(value: Value): number {
        return Number(value.getObject());
    }

    isValid(_value: any): boolean {
        return true;
    }

    isConvertible(_value: string): boolean {
        return true;
    }

    newValue(value: string): Value {
        return new Value(value, this);
    }

    newNullValue(): Value {
        return new Value(null, this);
    }

    equals(o: Equitable): boolean {
        console.debug('ValueType.equals', o);
        if (!ObjectHelper.iFrameSafeInstanceOf(o, ValueType)) {
            return false;
        }

        let other = o as ValueType;

        if (!ObjectHelper.stringEquals(this.name, other.name)) {
            return false;
        }

        return true;
    }

    valueEquals(_a: any, _b: any): boolean {
        throw new Error('Must be implemented by inheritor: ' + ClassHelper.getClassName(this));
    }

    /**
     * Returns the actual object backing this Value.
     * If the REST service or JSON would not understand this value, then override and return compatible value.
     */
    toJsonValue(value: Value): any {
        return value.getObject();
    }

    fromJsonValue(jsonValue: any): Value {
        if (jsonValue) {
            return this.newValue(jsonValue.toString());
        } else if ('' === jsonValue) {
            return this.newValue(jsonValue);
        } else {
            return this.newNullValue();
        }
    }

}
