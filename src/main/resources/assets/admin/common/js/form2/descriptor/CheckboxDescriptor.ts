import type {Value} from '../../data/Value';
import type {ValueType} from '../../data/ValueType';
import {ValueTypes} from '../../data/ValueTypes';
import type {RawInputConfig} from '../../form/Input';
import type {CheckboxConfig} from './InputTypeConfig';
import type {InputTypeDescriptor} from './InputTypeDescriptor';
import type {ValidationResult} from './ValidationResult';

export const CheckboxDescriptor: InputTypeDescriptor<CheckboxConfig> = {
    name: 'Checkbox',

    getValueType(): ValueType {
        return ValueTypes.BOOLEAN;
    },

    readConfig(raw: RawInputConfig): CheckboxConfig {
        const alignmentEntry = raw.alignment?.[0];
        return {
            alignment: alignmentEntry ? (alignmentEntry.value as string) || 'LEFT' : 'LEFT',
        };
    },

    createDefaultValue(raw: unknown): Value {
        return ValueTypes.BOOLEAN.fromJsonValue(raw === 'checked');
    },

    validate(_value: Value, _config: CheckboxConfig): ValidationResult[] {
        return [];
    },

    valueBreaksRequired(value: Value): boolean {
        return value.isNull() || !value.getType().equals(ValueTypes.BOOLEAN);
    },
};
