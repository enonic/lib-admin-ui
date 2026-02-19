import {Value} from '../../../data/Value';
import {ValueType} from '../../../data/ValueType';
import {ValueTypes} from '../../../data/ValueTypes';
import {LocalDateTime} from '../../../util/LocalDateTime';
import {InputTypeDescriptor} from './InputTypeDescriptor';
import {DateTimeConfig} from './InputTypeConfig';
import {ValidationResult} from './ValidationResult';
import {RelativeTimeParser} from '../time/RelativeTimeParser';

const DATETIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/;

export const DateTimeDescriptor: InputTypeDescriptor<DateTimeConfig> = {

    name: 'DateTime',

    getValueType(): ValueType {
        return ValueTypes.LOCAL_DATE_TIME;
    },

    readConfig(_raw: Record<string, Record<string, unknown>[]>): DateTimeConfig {
        return {
            useTimezone: false,
        };
    },

    createDefaultValue(raw: unknown): Value {
        if (typeof raw !== 'string') {
            return ValueTypes.LOCAL_DATE_TIME.newNullValue();
        }

        if (DATETIME_PATTERN.test(raw)) {
            return ValueTypes.LOCAL_DATE_TIME.newValue(raw);
        }

        const value = LocalDateTime.fromDate(RelativeTimeParser.parseToDateTime(raw));
        return new Value(value, ValueTypes.LOCAL_DATE_TIME);
    },

    validate(value: Value, _config: DateTimeConfig): ValidationResult[] {
        const results: ValidationResult[] = [];
        if (value.isNull()) {
            return results;
        }

        const str = value.getString();
        if (str && !DATETIME_PATTERN.test(str)) {
            results.push({message: 'Value is not a valid date-time'});
        }

        return results;
    },

    valueBreaksRequired(value: Value): boolean {
        return value.isNull() || !value.getType().equals(ValueTypes.LOCAL_DATE_TIME);
    },
};
