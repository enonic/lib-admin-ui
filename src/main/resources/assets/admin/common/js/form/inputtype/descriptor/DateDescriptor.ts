import {Value} from '../../../data/Value';
import {ValueType} from '../../../data/ValueType';
import {ValueTypes} from '../../../data/ValueTypes';
import {LocalDate} from '../../../util/LocalDate';
import {InputTypeDescriptor} from './InputTypeDescriptor';
import {DateConfig} from './InputTypeConfig';
import {ValidationResult} from './ValidationResult';
import {RelativeTimeParser} from '../time/RelativeTimeParser';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const DateDescriptor: InputTypeDescriptor<DateConfig> = {

    name: 'Date',

    getValueType(): ValueType {
        return ValueTypes.LOCAL_DATE;
    },

    readConfig(_raw: Record<string, Record<string, unknown>[]>): DateConfig {
        return {};
    },

    createDefaultValue(raw: unknown): Value {
        if (typeof raw !== 'string') {
            return ValueTypes.LOCAL_DATE.newNullValue();
        }

        if (DATE_PATTERN.test(raw)) {
            return ValueTypes.LOCAL_DATE.newValue(raw);
        }

        const value = LocalDate.fromDate(RelativeTimeParser.parseToDate(raw));
        return new Value(value, ValueTypes.LOCAL_DATE);
    },

    validate(value: Value, _config: DateConfig): ValidationResult[] {
        const results: ValidationResult[] = [];
        if (value.isNull()) {
            return results;
        }

        const str = value.getString();
        if (str && !DATE_PATTERN.test(str)) {
            results.push({message: 'Value is not a valid date'});
        }

        return results;
    },

    valueBreaksRequired(value: Value): boolean {
        return value.isNull() || !value.getType().equals(ValueTypes.LOCAL_DATE);
    },
};
