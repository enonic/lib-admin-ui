import {Value} from '../../data/Value';
import type {ValueType} from '../../data/ValueType';
import {ValueTypes} from '../../data/ValueTypes';
import type {RawInputConfig} from '../../form/Input';
import {RelativeTimeParser} from '../../form/inputtype/time/RelativeTimeParser';
import {DateHelper} from '../../util/DateHelper';
import {LocalTime} from '../../util/LocalTime';
import {i18n} from '../../util/Messages';
import type {TimeConfig} from './InputTypeConfig';
import type {InputTypeDescriptor} from './InputTypeDescriptor';
import type {ValidationResult} from './ValidationResult';

export const TIME_PATTERN = /^\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/;
const RELATIVE_EXPR = /^(?:now|(?:[+-]\d+[a-zA-Z]+\s*)+)$/;

export const TimeDescriptor: InputTypeDescriptor<TimeConfig> = {
    name: 'Time',

    getValueType(): ValueType {
        return ValueTypes.LOCAL_TIME;
    },

    readConfig(raw: RawInputConfig): TimeConfig {
        const rawDefault = raw.default?.[0]?.value;
        let defaultTime: Date | undefined;
        if (typeof rawDefault === 'string' && rawDefault.length > 0) {
            if (TIME_PATTERN.test(rawDefault)) {
                const parsed = DateHelper.parseTime(rawDefault);
                if (parsed != null) {
                    defaultTime = DateHelper.dateFromTime(parsed.hours, parsed.minutes);
                }
            } else if (RELATIVE_EXPR.test(rawDefault)) {
                try {
                    const parsed = RelativeTimeParser.parseToTime(rawDefault);
                    if (!Number.isNaN(parsed.getTime())) {
                        defaultTime = parsed;
                    }
                } catch {
                    defaultTime = undefined;
                }
            }
        }
        return {default: defaultTime};
    },

    createDefaultValue(raw: unknown): Value {
        if (typeof raw !== 'string') {
            return ValueTypes.LOCAL_TIME.newNullValue();
        }

        if (TIME_PATTERN.test(raw)) {
            return ValueTypes.LOCAL_TIME.newValue(raw);
        }

        // Return null if the value is parsable
        if (!RELATIVE_EXPR.test(raw)) {
            return ValueTypes.LOCAL_TIME.newNullValue();
        }

        try {
            const value = LocalTime.fromDate(RelativeTimeParser.parseToTime(raw));
            return new Value(value, ValueTypes.LOCAL_TIME);
        } catch {
            return ValueTypes.LOCAL_TIME.newNullValue();
        }
    },

    validate(value: Value, _config: TimeConfig, rawValue?: string): ValidationResult[] {
        const results: ValidationResult[] = [];

        if (value.isNull()) {
            if (rawValue != null && rawValue !== '') {
                results.push({message: i18n('field.value.invalid')});
            }
            return results;
        }

        const str = value.getString();
        if (str && !TIME_PATTERN.test(str)) {
            results.push({message: i18n('field.value.invalid')});
        }

        return results;
    },

    valueBreaksRequired(value: Value): boolean {
        return value.isNull() || !value.getType().equals(ValueTypes.LOCAL_TIME);
    },
};
