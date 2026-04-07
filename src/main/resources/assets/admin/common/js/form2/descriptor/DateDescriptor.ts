import {Value} from '../../data/Value';
import type {ValueType} from '../../data/ValueType';
import {ValueTypes} from '../../data/ValueTypes';
import type {RawInputConfig} from '../../form/Input';
import {RelativeTimeParser} from '../../form/inputtype/time/RelativeTimeParser';
import {LocalDate} from '../../util/LocalDate';
import {i18n} from '../../util/Messages';
import type {DateConfig} from './InputTypeConfig';
import type {InputTypeDescriptor} from './InputTypeDescriptor';
import type {ValidationResult} from './ValidationResult';

export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const RELATIVE_EXPR = /^(?:now|(?:[+-]\d+[a-zA-Z]+\s*)+)$/;

export const DateDescriptor: InputTypeDescriptor<DateConfig> = {
    name: 'Date',

    getValueType(): ValueType {
        return ValueTypes.LOCAL_DATE;
    },

    readConfig(raw: RawInputConfig): DateConfig {
        const rawDefault = raw.default?.[0]?.value;

        let defaultDate: Date | undefined;
        if (typeof rawDefault === 'string' && rawDefault.length > 0) {
            if (DATE_PATTERN.test(rawDefault)) {
                const parsed = new Date(`${rawDefault}T00:00:00`);
                if (!Number.isNaN(parsed.getTime())) {
                    defaultDate = parsed;
                }
            } else if (RELATIVE_EXPR.test(rawDefault)) {
                try {
                    const parsed = RelativeTimeParser.parseToDate(rawDefault);
                    if (!Number.isNaN(parsed.getTime())) {
                        defaultDate = parsed;
                    }
                } catch {
                    defaultDate = undefined;
                }
            }
        }
        return {default: defaultDate};
    },

    createDefaultValue(raw: unknown): Value {
        if (typeof raw !== 'string') {
            return ValueTypes.LOCAL_DATE.newNullValue();
        }

        if (DATE_PATTERN.test(raw)) {
            return ValueTypes.LOCAL_DATE.newValue(raw);
        }

        if (!RELATIVE_EXPR.test(raw)) {
            return ValueTypes.LOCAL_DATE.newNullValue();
        }

        try {
            const value = LocalDate.fromDate(RelativeTimeParser.parseToDate(raw));
            return new Value(value, ValueTypes.LOCAL_DATE);
        } catch {
            return ValueTypes.LOCAL_DATE.newNullValue();
        }
    },

    validate(value: Value, _config: DateConfig, rawValue?: string): ValidationResult[] {
        const results: ValidationResult[] = [];

        if (value.isNull()) {
            if (rawValue != null && rawValue !== '') {
                results.push({message: i18n('field.value.invalid')});
            }
            return results;
        }

        const str = value.getString();
        if (str && !DATE_PATTERN.test(str)) {
            results.push({message: i18n('field.value.invalid')});
        }

        return results;
    },

    valueBreaksRequired(value: Value): boolean {
        return value.isNull() || !value.getType().equals(ValueTypes.LOCAL_DATE);
    },
};
