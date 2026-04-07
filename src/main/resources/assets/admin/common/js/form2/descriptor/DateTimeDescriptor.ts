import {Value} from '../../data/Value';
import type {ValueType} from '../../data/ValueType';
import {ValueTypes} from '../../data/ValueTypes';
import type {RawInputConfig} from '../../form/Input';
import {RelativeTimeParser} from '../../form/inputtype/time/RelativeTimeParser';
import {LocalDateTime} from '../../util/LocalDateTime';
import {i18n} from '../../util/Messages';
import type {DateTimeConfig} from './InputTypeConfig';
import type {InputTypeDescriptor} from './InputTypeDescriptor';
import type {ValidationResult} from './ValidationResult';

export const DATETIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/;
const RELATIVE_EXPR = /^(?:now|(?:[+-]\d+[a-zA-Z]+\s*)+)$/;

export const DateTimeDescriptor: InputTypeDescriptor<DateTimeConfig> = {
    name: 'DateTime',

    getValueType(): ValueType {
        return ValueTypes.LOCAL_DATE_TIME;
    },

    readConfig(raw: RawInputConfig): DateTimeConfig {
        const rawDefault = raw.default?.[0]?.value;

        let defaultDateTime: Date | undefined;
        if (typeof rawDefault === 'string' && rawDefault.length > 0) {
            if (DATETIME_PATTERN.test(rawDefault)) {
                const parsed = new Date(rawDefault);
                if (!Number.isNaN(parsed.getTime())) {
                    defaultDateTime = parsed;
                }
            } else if (RELATIVE_EXPR.test(rawDefault)) {
                try {
                    const parsed = RelativeTimeParser.parseToLocalDateTime(rawDefault);
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
            return ValueTypes.LOCAL_DATE_TIME.newNullValue();
        }

        if (DATETIME_PATTERN.test(raw)) {
            return ValueTypes.LOCAL_DATE_TIME.newValue(raw);
        }

        if (!RELATIVE_EXPR.test(raw)) {
            return ValueTypes.LOCAL_DATE_TIME.newNullValue();
        }

        try {
            const value = LocalDateTime.fromDate(RelativeTimeParser.parseToLocalDateTime(raw));
            return new Value(value, ValueTypes.LOCAL_DATE_TIME);
        } catch {
            return ValueTypes.LOCAL_DATE_TIME.newNullValue();
        }
    },

    validate(value: Value, _config: DateTimeConfig, rawValue?: string): ValidationResult[] {
        const results: ValidationResult[] = [];
        if (value.isNull()) {
            if (rawValue != null && rawValue !== '') {
                results.push({message: i18n('field.value.invalid')});
            }
            return results;
        }

        const str = value.getString();
        if (str && !DATETIME_PATTERN.test(str)) {
            results.push({message: i18n('field.value.invalid')});
        }

        return results;
    },

    valueBreaksRequired(value: Value): boolean {
        return value.isNull() || !value.getType().equals(ValueTypes.LOCAL_DATE_TIME);
    },
};
