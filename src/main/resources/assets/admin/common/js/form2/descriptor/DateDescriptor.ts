import {Value} from '../../data/Value';
import type {ValueType} from '../../data/ValueType';
import {ValueTypes} from '../../data/ValueTypes';
import type {RawInputConfig} from '../../form/Input';
import {RelativeTimeParser} from '../../form/inputtype/time/RelativeTimeParser';
import {LocalDate} from '../../util/LocalDate';
import type {DateConfig} from './InputTypeConfig';
import type {InputTypeDescriptor} from './InputTypeDescriptor';
import type {ValidationResult} from './ValidationResult';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const DateDescriptor: InputTypeDescriptor<DateConfig> = {
    name: 'Date',

    getValueType(): ValueType {
        return ValueTypes.LOCAL_DATE;
    },

    readConfig(_raw: RawInputConfig): DateConfig {
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
