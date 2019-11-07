import {ObjectHelper} from '../ObjectHelper';
import {GeoPoint} from '../util/GeoPoint';
import {StringHelper} from '../util/StringHelper';
import {ValueType} from './ValueType';
import {Value} from './Value';

export class ValueTypeGeoPoint
    extends ValueType {

    constructor() {
        super('GeoPoint');
    }

    isValid(value: any): boolean {
        if (!(typeof value === 'object')) {
            return false;
        }
        if (!ObjectHelper.iFrameSafeInstanceOf(value, GeoPoint)) {
            return false;
        }
        return true;
    }

    isConvertible(value: string): boolean {
        if (StringHelper.isBlank(value)) {
            return false;
        }
        return GeoPoint.isValidString(value);
    }

    newValue(value: string): Value {
        if (!value) {
            return this.newNullValue();
        }

        if (!this.isConvertible(value)) {
            return this.newNullValue();
        }
        return new Value(GeoPoint.fromString(value), this);
    }

    valueToString(value: Value): string {
        if (value.isNotNull()) {
            return value.getGeoPoint().toString();
        } else {
            return null;
        }
    }

    toJsonValue(value: Value): any {
        return value.isNull() ? null : value.getGeoPoint().toString();
    }

    valueEquals(a: GeoPoint, b: GeoPoint): boolean {
        return ObjectHelper.equals(a, b);
    }
}
