import {Value} from '../../data/Value';
import type {ValueType} from '../../data/ValueType';
import {ValueTypes} from '../../data/ValueTypes';
import type {RawInputConfig} from '../../form/Input';
import {RelativeTimeParser} from '../../form/inputtype/time/RelativeTimeParser';
import {DateTime} from '../../util/DateTime';
import {i18n} from '../../util/Messages';
import type {InstantConfig} from './InputTypeConfig';
import type {InputTypeDescriptor} from './InputTypeDescriptor';
import type {ValidationResult} from './ValidationResult';

export const INSTANT_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?Z$/;
const OFFSET_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?[+-]\d{2}:\d{2}$/;
const DATETIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/;
const RELATIVE_EXPR = /^(?:now|(?:[+-]\d+[a-zA-Z]+\s*)+)$/;

// ? The Instant picker is minute-granular, so defaults keep no seconds or fractions
function truncateToMinutes(date: Date): Date {
    const truncated = new Date(date);
    truncated.setUTCSeconds(0, 0);
    return truncated;
}

export const InstantDescriptor: InputTypeDescriptor<InstantConfig> = {
    name: 'Instant',

    getValueType(): ValueType {
        return ValueTypes.DATE_TIME;
    },

    readConfig(raw: RawInputConfig): InstantConfig {
        const rawDefault = raw.default?.[0]?.value;

        let defaultDateTime: Date | undefined;
        if (typeof rawDefault === 'string' && rawDefault.length > 0) {
            if (
                INSTANT_PATTERN.test(rawDefault) ||
                OFFSET_PATTERN.test(rawDefault) ||
                DATETIME_PATTERN.test(rawDefault)
            ) {
                const parsed = new Date(rawDefault);
                if (!Number.isNaN(parsed.getTime())) {
                    defaultDateTime = parsed;
                }
            } else if (RELATIVE_EXPR.test(rawDefault)) {
                try {
                    const parsed = RelativeTimeParser.parseToDateTime(rawDefault);
                    if (!Number.isNaN(parsed.getTime())) {
                        defaultDateTime = parsed;
                    }
                } catch {
                    defaultDateTime = undefined;
                }
            }
        }
        return {
            default: defaultDateTime,
        };
    },

    createDefaultValue(raw: unknown): Value {
        if (typeof raw !== 'string') {
            return ValueTypes.DATE_TIME.newNullValue();
        }

        // ? 'Z' and offset strings carry their own zone, a naive datetime is parsed as local time (JS spec)
        if (INSTANT_PATTERN.test(raw) || OFFSET_PATTERN.test(raw) || DATETIME_PATTERN.test(raw)) {
            const parsed = new Date(raw);
            if (Number.isNaN(parsed.getTime())) {
                return ValueTypes.DATE_TIME.newNullValue();
            }
            return new Value(DateTime.fromDate(truncateToMinutes(parsed)), ValueTypes.DATE_TIME);
        }

        if (!RELATIVE_EXPR.test(raw)) {
            return ValueTypes.DATE_TIME.newNullValue();
        }

        try {
            const value = DateTime.fromDate(truncateToMinutes(RelativeTimeParser.parseToDateTime(raw)));
            return new Value(value, ValueTypes.DATE_TIME);
        } catch {
            return ValueTypes.DATE_TIME.newNullValue();
        }
    },

    validate(value: Value, _config: InstantConfig, rawValue?: string): ValidationResult[] {
        const results: ValidationResult[] = [];
        if (value.isNull()) {
            if (rawValue != null && rawValue !== '') {
                results.push({message: i18n('field.value.invalid')});
            }
            return results;
        }

        const str = value.getString();
        if (str && !INSTANT_PATTERN.test(str)) {
            results.push({message: i18n('field.value.invalid')});
        }

        return results;
    },

    valueBreaksRequired(value: Value): boolean {
        return value.isNull() || !value.getType().equals(ValueTypes.DATE_TIME);
    },
};
