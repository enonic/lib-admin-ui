module api.data {

    import LocalDateTime = api.util.LocalDateTime;
    import LocalDateTimeRange = api.util.LocalDateTimeRange;

    export class ValueTypeLocalDateTimeRange
        extends ValueType {

        constructor() {
            super('LocalDateTimeRange');
        }

        isValid(value: string): boolean {
            if (api.ObjectHelper.iFrameSafeInstanceOf(value, LocalDateTimeRange)) {
                return true;
            }

            return LocalDateTimeRange.isValidString(value);
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

            return new Value(LocalDateTimeRange.fromString(value), this);
        }

        toJsonValue(value: Value): string {
            return value.isNull() ? null : value.getLocalDateTimeRange().toString();
        }

        valueToString(value: Value): string {
            return value.getLocalDateTimeRange().toString();
        }

        valueEquals(a: LocalDateTime, b: LocalDateTime): boolean {
            return api.ObjectHelper.equals(a, b);
        }
    }
}
