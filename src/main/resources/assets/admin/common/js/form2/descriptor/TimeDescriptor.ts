import {Value} from '../../data/Value';
import type {ValueType} from '../../data/ValueType';
import {ValueTypes} from '../../data/ValueTypes';
import type {RawInputConfig} from '../../form/Input';
import {RelativeTimeParser} from '../../form/inputtype/time/RelativeTimeParser';
import {LocalTime} from '../../util/LocalTime';
import type {TimeConfig} from './InputTypeConfig';
import type {InputTypeDescriptor} from './InputTypeDescriptor';
import type {ValidationResult} from './ValidationResult';

const TIME_PATTERN = /^\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/;

export const TimeDescriptor: InputTypeDescriptor<TimeConfig> = {
    name: 'Time',

    getValueType(): ValueType {
        return ValueTypes.LOCAL_TIME;
    },

    readConfig(_raw: RawInputConfig): TimeConfig {
        return {};
    },

    createDefaultValue(raw: unknown): Value {
        if (typeof raw !== 'string') {
            return ValueTypes.LOCAL_TIME.newNullValue();
        }

        if (TIME_PATTERN.test(raw)) {
            return ValueTypes.LOCAL_TIME.newValue(raw);
        }

        const value = LocalTime.fromDate(RelativeTimeParser.parseToTime(raw));
        return new Value(value, ValueTypes.LOCAL_TIME);
    },

    validate(value: Value, _config: TimeConfig): ValidationResult[] {
        const results: ValidationResult[] = [];
        if (value.isNull()) {
            return results;
        }

        const str = value.getString();
        if (str && !TIME_PATTERN.test(str)) {
            results.push({message: 'Value is not a valid time'});
        }

        return results;
    },

    valueBreaksRequired(value: Value): boolean {
        return value.isNull() || !value.getType().equals(ValueTypes.LOCAL_TIME);
    },
};
