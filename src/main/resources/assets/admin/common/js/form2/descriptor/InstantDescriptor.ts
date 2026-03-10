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

        if (INSTANT_PATTERN.test(raw)) {
            return ValueTypes.DATE_TIME.newValue(raw);
        }

        if (OFFSET_PATTERN.test(raw)) {
            // ? Parse offset datetime and convert to UTC
            const value = DateTime.fromDate(new Date(raw));
            return new Value(value, ValueTypes.DATE_TIME);
        }

        if (DATETIME_PATTERN.test(raw)) {
            // ? Append Z to treat as UTC when no timezone specified
            return ValueTypes.DATE_TIME.newValue(`${raw}Z`);
        }

        if (!RELATIVE_EXPR.test(raw)) {
            return ValueTypes.DATE_TIME.newNullValue();
        }

        const value = DateTime.fromDate(RelativeTimeParser.parseToDateTime(raw));
        return new Value(value, ValueTypes.DATE_TIME);
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
