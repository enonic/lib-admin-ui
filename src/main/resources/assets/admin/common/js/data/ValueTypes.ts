/*
 * Types need to be named as in ValueTypes.java
 */
import {ValueTypePropertySet} from './ValueTypePropertySet';
import {ValueTypeString} from './ValueTypeString';
import {ValueTypeXml} from './ValueTypeXml';
import {ValueTypeLong} from './ValueTypeLong';
import {ValueTypeBoolean} from './ValueTypeBoolean';
import {ValueTypeDouble} from './ValueTypeDouble';
import {ValueTypeLocalDate} from './ValueTypeLocalDate';
import {ValueTypeLocalTime} from './ValueTypeLocalTime';
import {ValueTypeLocalDateTime} from './ValueTypeLocalDateTime';
import {ValueTypeGeoPoint} from './ValueTypeGeoPoint';
import {ValueTypeReference} from './ValueTypeReference';
import {ValueTypeBinaryReference} from './ValueTypeBinaryReference';
import {ValueType} from './ValueType';
import {ValueTypeDateTime} from './ValueTypeDateTime';

export class ValueTypes {

    static DATA: ValueTypePropertySet = new ValueTypePropertySet();

    static STRING: ValueTypeString = new ValueTypeString();

    static XML: ValueTypeXml = new ValueTypeXml();

    static LOCAL_DATE: ValueTypeLocalDate = new ValueTypeLocalDate();

    static LOCAL_TIME: ValueTypeLocalTime = new ValueTypeLocalTime();

    static LOCAL_DATE_TIME: ValueTypeLocalDateTime = new ValueTypeLocalDateTime();

    static DATE_TIME: ValueTypeDateTime = new ValueTypeDateTime();

    static LONG: ValueTypeLong = new ValueTypeLong();

    static BOOLEAN: ValueTypeBoolean = new ValueTypeBoolean();

    static DOUBLE: ValueTypeDouble = new ValueTypeDouble();

    static GEO_POINT: ValueTypeGeoPoint = new ValueTypeGeoPoint();

    static REFERENCE: ValueTypeReference = new ValueTypeReference();

    static BINARY_REFERENCE: ValueTypeBinaryReference = new ValueTypeBinaryReference();

    static ALL: ValueType[] = [
        ValueTypes.DATA,
        ValueTypes.STRING,
        ValueTypes.XML,
        ValueTypes.LOCAL_DATE,
        ValueTypes.LOCAL_TIME,
        ValueTypes.LOCAL_DATE_TIME,
        ValueTypes.DATE_TIME,
        ValueTypes.LONG,
        ValueTypes.BOOLEAN,
        ValueTypes.DOUBLE,
        ValueTypes.GEO_POINT,
        ValueTypes.REFERENCE,
        ValueTypes.BINARY_REFERENCE,
    ];

    public static fromName(name: string): ValueType {
        for (const valueType of ValueTypes.ALL) {
            if (valueType.toString() === name) {
                return valueType;
            }
        }
        throw Error(`Unknown ValueType: ${name}`);
    }
}
