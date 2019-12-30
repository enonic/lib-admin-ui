import {LocalDate} from '../util/LocalDate';
import {LocalDateTime} from '../util/LocalDateTime';
import {DateTime} from '../util/DateTime';
import {ValueType} from './ValueType';
import {Value} from './Value';
import {ValueTypes} from './ValueTypes';
import {PropertySet} from './PropertySet';
import {Property} from './Property';
import {PropertyArray} from './PropertyArray';

export class ValueTypeConverter {

    private static VALID_REFERENCE_ID_PATTERN: RegExp = /^([a-z0-9A-Z_\-\.:])*$/;

    public static convertTo(value: Value, toType: ValueType): Value {

        if (value.getType() === toType) {
            return value;
        }

        if (toType === ValueTypes.DATA) {
            return ValueTypeConverter.convertToData(value);
        } else if (toType === ValueTypes.STRING) {
            return ValueTypeConverter.convertToString(value);
        } else if (toType === ValueTypes.XML) {
            return ValueTypeConverter.convertToXml(value);
        } else if (toType === ValueTypes.LOCAL_DATE) {
            return ValueTypeConverter.convertToLocalDate(value);
        } else if (toType === ValueTypes.LOCAL_TIME) {
            return ValueTypeConverter.convertToLocalTime(value);
        } else if (toType === ValueTypes.LOCAL_DATE_TIME) {
            return ValueTypeConverter.convertToLocalDateTime(value);
        } else if (toType === ValueTypes.DATE_TIME) {
            return ValueTypeConverter.convertToDateTime(value);
        } else if (toType === ValueTypes.LONG) {
            return ValueTypeConverter.convertToLong(value);
        } else if (toType === ValueTypes.BOOLEAN) {
            return ValueTypeConverter.convertToBoolean(value.getObject());
        } else if (toType === ValueTypes.DOUBLE) {
            return ValueTypeConverter.convertToDouble(value);
        } else if (toType === ValueTypes.GEO_POINT) {
            return ValueTypeConverter.convertToGeoPoint(value);
        } else if (toType === ValueTypes.REFERENCE) {
            return ValueTypeConverter.convertToReference(value);
        } else if (toType === ValueTypes.BINARY_REFERENCE) {
            return ValueTypeConverter.convertToBinaryReference(value);
        }

        throw('Unknown ValueType: ' + toType);
    }

    private static convertToString(value: Value): Value {
        if (value.getType() === ValueTypes.DATA) {
            return ValueTypes.STRING.newNullValue();
        }
        return ValueTypes.STRING.newValue(value.getString());
    }

    private static convertToBoolean(value: any): Value {
        if (typeof value === 'boolean') {
            return ValueTypes.BOOLEAN.newBoolean(value);
        } else if (typeof value === 'string') {
            return ValueTypes.BOOLEAN.newValue(value);
        }
        return ValueTypes.BOOLEAN.newNullValue();
    }

    private static convertToLong(value: Value): Value {
        if (value.getType() === ValueTypes.STRING) {
            return ValueTypes.LONG.newValue(value.getString());
        } else if (value.getType() === ValueTypes.DOUBLE) {
            return new Value(Math.floor(value.getDouble()), ValueTypes.LONG);
        } else if (value.getType() === ValueTypes.BOOLEAN) {
            if (value.getBoolean()) {
                return ValueTypes.LONG.newValue('1');
            }
            return ValueTypes.LONG.newValue('0');
        }
        return ValueTypes.LONG.newNullValue();
    }

    private static convertToDouble(value: Value): Value {
        if (value.getType() === ValueTypes.STRING) {
            return ValueTypes.DOUBLE.newValue(value.getString());
        } else if (value.getType() === ValueTypes.LONG) {
            return new Value(value.getLong(), ValueTypes.LONG);
        } else if (value.getType() === ValueTypes.BOOLEAN) {
            if (value.getBoolean()) {
                return ValueTypes.DOUBLE.newValue('1');
            }
            return ValueTypes.DOUBLE.newValue('0');
        }
        return ValueTypes.DOUBLE.newNullValue();
    }

    private static convertToGeoPoint(value: Value): Value {
        if (value.getType() === ValueTypes.STRING) {
            return ValueTypes.GEO_POINT.newValue(value.getString());
        }
        return ValueTypes.GEO_POINT.newNullValue();
    }

    private static convertToReference(value: Value): Value {
        let str = value.getString();
        if (str && ValueTypeConverter.VALID_REFERENCE_ID_PATTERN.test(str)) {
            return ValueTypes.REFERENCE.newValue(value.getString());
        }
        return ValueTypes.REFERENCE.newNullValue();
    }

    private static convertToBinaryReference(value: Value): Value {
        return ValueTypes.BINARY_REFERENCE.newValue(value.getString());
    }

    private static convertToXml(value: Value): Value {
        return ValueTypes.XML.newValue(value.getString());
    }

    private static convertToData(value: Value): Value {
        if (ValueTypes.DATA.isPropertySet(value)) {
            return new Value(value.getObject(), ValueTypes.DATA);
        }
        return new Value(new PropertySet(), ValueTypes.DATA);
    }

    private static convertToLocalDate(value: Value): Value {
        if (value.getType() === ValueTypes.STRING && ValueTypes.LOCAL_DATE.isConvertible(value.getString())) { // from string
            return ValueTypes.LOCAL_DATE.newValue(value.getString());
        } else if (value.getType() === ValueTypes.LOCAL_DATE_TIME && value.isNotNull()) { // from LocalDateTime
            let localDateTime = value.getString();
            return ValueTypes.LOCAL_DATE.newValue(localDateTime.substr(0, 10));
        } else if (value.getType() === ValueTypes.DATE_TIME && value.isNotNull()) { // from DateTime
            let localDate = value.getString();
            return ValueTypes.LOCAL_DATE.newValue(localDate.substr(0, 10));
        }
        return ValueTypes.LOCAL_DATE.newNullValue();
    }

    private static convertToLocalDateTime(value: Value): Value {
        if (value.getType() === ValueTypes.STRING && ValueTypes.LOCAL_DATE_TIME.isConvertible(value.getString())) { // from string
            return ValueTypes.LOCAL_DATE_TIME.newValue(value.getString());
        } else if (value.getType() === ValueTypes.LOCAL_DATE && value.isNotNull()) { // from LocalDate
            let localDate = <LocalDate>value.getObject();
            return new Value(LocalDateTime.fromString(localDate.toString() + 'T00:00:00'), ValueTypes.LOCAL_DATE_TIME);
        } else if (value.getType() === ValueTypes.DATE_TIME && value.isNotNull()) { // from DateTime
            let dateTime = value.getString();
            return ValueTypes.LOCAL_DATE_TIME.newValue(dateTime.substr(0, 19));
        }
        return ValueTypes.LOCAL_DATE_TIME.newNullValue();
    }

    private static convertToDateTime(value: Value): Value {
        if (value.getType() === ValueTypes.STRING && ValueTypes.DATE_TIME.isConvertible(value.getString())) { // from string
            return ValueTypes.DATE_TIME.newValue(value.getString());
        } else if (value.getType() === ValueTypes.LOCAL_DATE && value.isNotNull()) { // from LocalDate
            return ValueTypes.DATE_TIME.newValue(value.getString() + 'T00:00:00+00:00');
        } else if (value.getType() === ValueTypes.LOCAL_DATE_TIME && value.isNotNull()) { // from LocalDateTime
            let dateTime = value.getString();
            return ValueTypes.DATE_TIME.newValue(dateTime);
        }
        return ValueTypes.DATE_TIME.newNullValue();
    }

    private static convertToLocalTime(value: Value): Value {
        if (value.getType() === ValueTypes.STRING && ValueTypes.LOCAL_TIME.isConvertible(value.getString())) { // from string
            return ValueTypes.LOCAL_TIME.newValue(value.getString());
        } else if (value.getType() === ValueTypes.LOCAL_DATE_TIME && value.isNotNull()) { // from LocalDateTime
            let localDateTime = <Date>value.getObject();
            return ValueTypes.LOCAL_TIME.newValue(localDateTime.getHours() + ':' + localDateTime.getMinutes() + ':' +
                                                  localDateTime.getSeconds());
        } else if (value.getType() === ValueTypes.DATE_TIME && value.isNotNull()) { // from DateTime
            let dateTime = <DateTime> value.getObject();
            return ValueTypes.LOCAL_TIME.newValue(dateTime.getHours() + ':' + dateTime.getMinutes() + ':' + dateTime.getSeconds());
        }
        return ValueTypes.LOCAL_TIME.newNullValue();
    }

    static convertArrayValues(propertyArray: PropertyArray, newType: ValueType): void {
        propertyArray.convertValues(newType, ValueTypeConverter.convertTo);
    }

    static convertPropertyValueType(property: Property, newType: ValueType): void {
        property.convertValueType(newType, ValueTypeConverter.convertTo);
    }

}
