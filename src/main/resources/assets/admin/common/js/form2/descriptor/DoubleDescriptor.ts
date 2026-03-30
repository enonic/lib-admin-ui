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

export const DoubleDescriptor: InputTypeDescriptor<NumberConfig> = {
    name: 'Double',

    getValueType(): ValueType {
        return ValueTypes.DOUBLE;
    },

    readConfig(raw: RawInputConfig): NumberConfig {
        return {
            min: (raw.min?.[0]?.value as number) ?? undefined,
            max: (raw.max?.[0]?.value as number) ?? undefined,
        };
    },

    createDefaultValue(raw: unknown): Value {
        if (typeof raw !== 'number') {
            return ValueTypes.DOUBLE.newNullValue();
        }
        return ValueTypes.DOUBLE.fromJsonValue(raw);
    },

    validate(value: Value, config: NumberConfig, rawValue?: string): ValidationResult[] {
        const results: ValidationResult[] = [];
        if (value.isNull()) {
            if (rawValue != null && rawValue !== '') {
                const parsed = Number(rawValue);
                if (NumberHelper.isNumber(parsed)) {
                    return validateNumberRange(parsed, config);
                }
                results.push({message: i18n('field.value.invalid')});
            }
            return results;
        }

        const num = value.getDouble();

        if (!NumberHelper.isNumber(num)) {
            results.push({message: i18n('field.value.invalid')});
            return results;
        }

        return validateNumberRange(num, config);
    },

    valueBreaksRequired(value: Value): boolean {
        return value.isNull() || !value.getType().equals(ValueTypes.DOUBLE);
    },
};
