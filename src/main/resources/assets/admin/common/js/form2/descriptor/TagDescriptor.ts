import type {Value} from '../../data/Value';
import type {ValueType} from '../../data/ValueType';
import type {RawInputConfig} from '../../form/Input';
import type {TextLineConfig} from './InputTypeConfig';
import type {InputTypeDescriptor} from './InputTypeDescriptor';
import {TextLineDescriptor} from './TextLineDescriptor';
import type {ValidationResult} from './ValidationResult';

export const TagDescriptor: InputTypeDescriptor<TextLineConfig> = {
    name: 'Tag',

    getValueType(): ValueType {
        return TextLineDescriptor.getValueType();
    },

    readConfig(raw: RawInputConfig): TextLineConfig {
        return TextLineDescriptor.readConfig(raw);
    },

    createDefaultValue(raw: unknown): Value {
        return TextLineDescriptor.createDefaultValue(raw);
    },

    validate(value: Value, config: TextLineConfig, rawValue?: string): ValidationResult[] {
        return TextLineDescriptor.validate(value, config, rawValue);
    },

    valueBreaksRequired(value: Value): boolean {
        return TextLineDescriptor.valueBreaksRequired(value);
    },
};
