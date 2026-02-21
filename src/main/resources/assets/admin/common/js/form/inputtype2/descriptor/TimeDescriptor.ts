import {Value} from '../../../data/Value';
import {ValueType} from '../../../data/ValueType';
import {ValueTypes} from '../../../data/ValueTypes';
import {LocalTime} from '../../../util/LocalTime';
import {InputTypeDescriptor} from './InputTypeDescriptor';
import {TimeConfig} from './InputTypeConfig';
import {ValidationResult} from './ValidationResult';
import {RelativeTimeParser} from '../../inputtype/time/RelativeTimeParser';

const TIME_PATTERN = /^\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/;

export const TimeDescriptor: InputTypeDescriptor<TimeConfig> = {

    name: 'Time',

    getValueType(): ValueType {
        return ValueTypes.LOCAL_TIME;
    },

    readConfig(_raw: Record<string, Record<string, unknown>[]>): TimeConfig {
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
