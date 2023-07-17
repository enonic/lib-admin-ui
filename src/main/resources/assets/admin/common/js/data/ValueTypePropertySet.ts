import {ObjectHelper} from '../ObjectHelper';
import {ValueType} from './ValueType';
import {PropertySet} from './PropertySet';
import {Value} from './Value';
import {Typable} from './Typable';

export class ValueTypePropertySet
    extends ValueType {

    constructor() {
        super('PropertySet');
    }

    isValid(value: Typable): boolean {
        if (!(typeof value === 'object')) {
            return false;
        }

        return this.isPropertySet(value);
    }

    isPropertySet(value: Typable) {
        return this.toString() === value.getType().toString();
    }

    isConvertible(): boolean {
        return false;
    }

    newValue(): Value {
        throw new Error('A value of type Data cannot be created from a string');
    }

    toJsonValue(value: Value): any {
        if (value.isNull()) {
            return null;
        }
        let data = value.getObject() as PropertySet;
        return data.toJson();
    }

    fromJsonValue(): Value {
        throw new Error('Method not supported!');
    }

    valueToString(): string {
        throw new Error('A value of type Data cannot be made into a string');
    }

    valueEquals(a: PropertySet, b: PropertySet): boolean {
        return ObjectHelper.equals(a, b);
    }
}
