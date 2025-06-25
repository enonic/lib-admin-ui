import type {Value} from '../../data/Value';
import type {ValueType} from '../../data/ValueType';
import {ValueTypes} from '../../data/ValueTypes';
import type {RawInputConfig} from '../../form/Input';
import type {Alignment, CheckboxConfig} from './InputTypeConfig';
import type {InputTypeDescriptor} from './InputTypeDescriptor';
import type {ValidationResult} from './ValidationResult';

export const CheckboxDescriptor: InputTypeDescriptor<CheckboxConfig> = {
    name: 'Checkbox',

    getValueType(): ValueType {
        return ValueTypes.BOOLEAN;
    },

    readConfig(raw: RawInputConfig): CheckboxConfig {
        const rawValue = raw.alignment?.[0]?.value;
        const normalized = typeof rawValue === 'string' ? rawValue.toUpperCase() : '';
        const VALID: Alignment[] = ['LEFT', 'RIGHT', 'TOP', 'BOTTOM'];
        const alignment = VALID.includes(normalized as Alignment) ? (normalized as Alignment) : 'LEFT';
        return {alignment};
    },

    createDefaultValue(raw: unknown): Value {
        return ValueTypes.BOOLEAN.fromJsonValue(raw === 'checked');
    },

    validate(_value: Value, _config: CheckboxConfig): ValidationResult[] {
        return [];
    },

    valueBreaksRequired(value: Value): boolean {
        return value.isNull() || !value.getType().equals(ValueTypes.BOOLEAN) || value.getBoolean() !== true;
    },
};
