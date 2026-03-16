import type {Value} from '../../data/Value';
import type {ValueType} from '../../data/ValueType';
import {ValueTypes} from '../../data/ValueTypes';
import type {RawInputConfig} from '../../form/Input';
import {PrincipalKey} from '../../security/PrincipalKey';
import {PrincipalType} from '../../security/PrincipalType';
import type {PrincipalSelectorConfig} from './InputTypeConfig';
import type {InputTypeDescriptor} from './InputTypeDescriptor';
import type {ValidationResult} from './ValidationResult';

export const PrincipalSelectorDescriptor: InputTypeDescriptor<PrincipalSelectorConfig> = {
    name: 'PrincipalSelector',

    getValueType(): ValueType {
        return ValueTypes.REFERENCE;
    },

    readConfig(raw: RawInputConfig): PrincipalSelectorConfig {
        const principalTypeEntries = raw.principalType || [];
        const skipPrincipalsEntries = raw.skipPrincipals || [];

        const principalTypes: PrincipalType[] = principalTypeEntries
            .map(cfg => {
                const val = typeof cfg === 'object' ? (cfg.value as string) : String(cfg);
                return val ? PrincipalType[val as keyof typeof PrincipalType] : null;
            })
            .filter((val): val is PrincipalType => val != null);

        const skipPrincipals: PrincipalKey[] = skipPrincipalsEntries
            .map(cfg => {
                const val = typeof cfg === 'object' ? (cfg.value as string) : String(cfg);
                return val ? PrincipalKey.fromString(val) : null;
            })
            .filter((val): val is PrincipalKey => val != null);

        return {principalTypes, skipPrincipals};
    },

    createDefaultValue(_raw: unknown): Value {
        return ValueTypes.REFERENCE.newNullValue();
    },

    validate(_value: Value, _config: PrincipalSelectorConfig): ValidationResult[] {
        return [];
    },

    valueBreaksRequired(value: Value): boolean {
        return value.isNull() || !value.getType().equals(ValueTypes.REFERENCE);
    },
};
