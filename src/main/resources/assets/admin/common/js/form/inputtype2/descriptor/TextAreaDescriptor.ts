import type {Value} from '../../../data/Value';
import type {ValueType} from '../../../data/ValueType';
import {ValueTypes} from '../../../data/ValueTypes';
import {StringHelper} from '../../../util/StringHelper';
import type {TextAreaConfig} from './InputTypeConfig';
import type {InputTypeDescriptor} from './InputTypeDescriptor';
import type {ValidationResult} from './ValidationResult';

export const TextAreaDescriptor: InputTypeDescriptor<TextAreaConfig> = {
    name: 'TextArea',

    getValueType(): ValueType {
        return ValueTypes.STRING;
    },

    readConfig(raw: Record<string, Record<string, unknown>[]>): TextAreaConfig {
        const maxLengthEntry = raw.maxLength?.[0] ?? {};
        const maxLengthVal = maxLengthEntry.value as number;

        const showCounterEntry = raw.showCounter?.[0] ?? {};

        return {
            maxLength: maxLengthVal > 0 ? maxLengthVal : -1,
            showCounter: (showCounterEntry.value as boolean) || false,
        };
    },

    createDefaultValue(raw: unknown): Value {
        if (typeof raw !== 'string') {
            return ValueTypes.STRING.newNullValue();
        }
        return ValueTypes.STRING.newValue(raw);
    },

    validate(value: Value, config: TextAreaConfig): ValidationResult[] {
        const results: ValidationResult[] = [];
        if (value.isNull()) {
            return results;
        }

        const str = value.getString();

        if (config.maxLength > 0 && str.length > config.maxLength) {
            results.push({message: `Value exceeds maximum length of ${config.maxLength}`});
        }

        return results;
    },

    valueBreaksRequired(value: Value): boolean {
        return value.isNull() || !value.getType().equals(ValueTypes.STRING) || StringHelper.isBlank(value.getString());
    },
};
