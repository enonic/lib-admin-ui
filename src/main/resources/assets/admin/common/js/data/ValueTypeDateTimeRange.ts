module api.data {

    import DateTime = api.util.DateTime;
    import DateTimeRange = api.util.DateTimeRange;

    export class ValueTypeDateTimeRange
        extends ValueType {

        constructor() {
            super('DateTimeRange');
        }

        isValid(value: any): boolean {
            if (api.ObjectHelper.iFrameSafeInstanceOf(value, DateTimeRange)) {
                return true;
            }

            return DateTimeRange.isValidString(value);
        }

        isConvertible(value: string): boolean {
            if (api.util.StringHelper.isBlank(value)) {
                return false;
            }

            return this.isValid(value);
        }

        newValue(value: string): Value {
            if (!value || !this.isConvertible(value)) {
                return this.newNullValue();
            }

            return new Value(DateTimeRange.fromString(value), this);
        }

        toJsonValue(value: Value): string {
            return value.isNull() ? null : value.getDateTimeRange().toString();
        }

        valueToString(value: Value): string {
            return value.getDateTimeRange().toString();
        }

        valueEquals(a: DateTime, b: DateTime): boolean {
            return api.ObjectHelper.equals(a, b);
        }

    }
}
