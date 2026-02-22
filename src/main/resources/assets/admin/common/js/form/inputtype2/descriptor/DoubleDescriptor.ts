import type {Value} from '../../../data/Value';
import type {ValueType} from '../../../data/ValueType';
import {ValueTypes} from '../../../data/ValueTypes';
import {NumberHelper} from '../../../util/NumberHelper';
import type {NumberConfig} from './InputTypeConfig';
import type {InputTypeDescriptor} from './InputTypeDescriptor';
import type {ValidationResult} from './ValidationResult';

export const DoubleDescriptor: InputTypeDescriptor<NumberConfig> = {
    name: 'Double',

    getValueType(): ValueType {
        return ValueTypes.DOUBLE;
    },

    readConfig(raw: Record<string, Record<string, unknown>[]>): NumberConfig {
        return {
            min: (raw.min?.[0]?.value as number) ?? null,
            max: (raw.max?.[0]?.value as number) ?? null,
        };
    },

    createDefaultValue(raw: unknown): Value {
        if (typeof raw !== 'number') {
            return ValueTypes.DOUBLE.newNullValue();
        }
        return ValueTypes.DOUBLE.fromJsonValue(raw);
    },

    validate(value: Value, config: NumberConfig): ValidationResult[] {
        const results: ValidationResult[] = [];
        if (value.isNull()) {
            return results;
        }

        const num = value.getDouble();

        if (!NumberHelper.isNumber(num)) {
            results.push({message: 'Value is not a valid number'});
            return results;
        }

        if (config.min != null && NumberHelper.isNumber(config.min) && num < config.min) {
            results.push({message: `Value must be at least ${config.min}`});
        } else if (config.max != null && NumberHelper.isNumber(config.max) && num > config.max) {
            results.push({message: `Value must be at most ${config.max}`});
        }

        return results;
    },

    valueBreaksRequired(value: Value): boolean {
        return value.isNull() || !value.getType().equals(ValueTypes.DOUBLE);
    },
};
