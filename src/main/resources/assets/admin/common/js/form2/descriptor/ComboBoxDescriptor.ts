import type {Value} from '../../data/Value';
import type {ValueType} from '../../data/ValueType';
import {ValueTypes} from '../../data/ValueTypes';
import type {ComboBoxConfig} from './InputTypeConfig';
import type {InputTypeDescriptor} from './InputTypeDescriptor';
import type {ValidationResult} from './ValidationResult';

export const ComboBoxDescriptor: InputTypeDescriptor<ComboBoxConfig> = {
    name: 'ComboBox',

    getValueType(): ValueType {
        return ValueTypes.STRING;
    },

    readConfig(raw: Record<string, Record<string, unknown>[]>): ComboBoxConfig {
        const optionValues = raw.options || [];

        return {
            options: optionValues.map(entry => ({
                label: entry.value as string,
                value: entry['@value'] as string,
            })),
        };
    },

    createDefaultValue(raw: unknown): Value {
        if (typeof raw !== 'string') {
            return ValueTypes.STRING.newNullValue();
        }
        return ValueTypes.STRING.newValue(raw);
    },

    validate(value: Value, config: ComboBoxConfig): ValidationResult[] {
        const results: ValidationResult[] = [];
        if (value.isNull()) {
            return results;
        }

        const str = value.getString();
        const validValues = config.options.map(o => o.value);

        if (!validValues.includes(str)) {
            results.push({message: 'Value is not one of the allowed options'});
        }

        return results;
    },

    valueBreaksRequired(value: Value): boolean {
        return value.isNull() || !value.getType().equals(ValueTypes.STRING);
    },
};
