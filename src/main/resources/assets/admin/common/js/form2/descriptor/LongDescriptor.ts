import type {Value} from '../../data/Value';
import type {ValueType} from '../../data/ValueType';
import {ValueTypes} from '../../data/ValueTypes';
import type {RawInputConfig} from '../../form/Input';
import {i18n} from '../../util/Messages';
import {NumberHelper} from '../../util/NumberHelper';
import type {NumberConfig} from './InputTypeConfig';
import type {InputTypeDescriptor} from './InputTypeDescriptor';
import type {ValidationResult} from './ValidationResult';

function validateNumberRange(num: number, config: NumberConfig): ValidationResult[] {
    if (config.min != null && NumberHelper.isNumber(config.min) && num < config.min) {
        return [{message: i18n('field.value.breaks.min', config.min)}];
    }
    if (config.max != null && NumberHelper.isNumber(config.max) && num > config.max) {
        return [{message: i18n('field.value.breaks.max', config.max)}];
    }
    return [];
}

export const LongDescriptor: InputTypeDescriptor<NumberConfig> = {
    name: 'Long',

    getValueType(): ValueType {
        return ValueTypes.LONG;
    },

    readConfig(raw: RawInputConfig): NumberConfig {
        return {
            min: (raw.min?.[0]?.value as number) ?? undefined,
            max: (raw.max?.[0]?.value as number) ?? undefined,
        };
    },

    createDefaultValue(raw: unknown): Value {
        if (typeof raw !== 'number') {
            return ValueTypes.LONG.newNullValue();
        }
        return ValueTypes.LONG.fromJsonValue(raw);
    },

    validate(value: Value, config: NumberConfig, rawValue?: string): ValidationResult[] {
        const results: ValidationResult[] = [];
        if (value.isNull()) {
            if (rawValue != null && rawValue !== '') {
                // Re-parse to distinguish format errors from range violations
                const parsed = Number(rawValue);
                if (NumberHelper.isWholeNumber(parsed)) {
                    return validateNumberRange(parsed, config);
                }
                results.push({message: i18n('field.value.invalid')});
            }
            return results;
        }

        const num = value.getLong();

        if (!NumberHelper.isWholeNumber(num)) {
            results.push({message: i18n('field.value.invalid')});
            return results;
        }

        return validateNumberRange(num, config);
    },

    valueBreaksRequired(value: Value): boolean {
        return value.isNull() || !value.getType().equals(ValueTypes.LONG);
    },
};
