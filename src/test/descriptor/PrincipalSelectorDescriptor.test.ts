import {describe, expect, it} from 'vitest';
import {Value} from '../../main/resources/assets/admin/common/js/data/Value';
import {ValueTypes} from '../../main/resources/assets/admin/common/js/data/ValueTypes';
import {PrincipalSelectorDescriptor} from '../../main/resources/assets/admin/common/js/form/inputtype2/descriptor/PrincipalSelectorDescriptor';
import {PrincipalSelectorConfig} from '../../main/resources/assets/admin/common/js/form/inputtype2/descriptor/InputTypeConfig';
import {PrincipalType} from '../../main/resources/assets/admin/common/js/security/PrincipalType';

describe('PrincipalSelectorDescriptor', () => {

    describe('getValueType', () => {
        it('returns REFERENCE', () => {
            expect(PrincipalSelectorDescriptor.getValueType()).toBe(ValueTypes.REFERENCE);
        });
    });

    describe('readConfig', () => {
        it('parses principal types from config', () => {
            const config = PrincipalSelectorDescriptor.readConfig({
                'principalType': [
                    {'value': 'USER'},
                    {'value': 'GROUP'},
                ],
            });
            expect(config.principalTypes).toHaveLength(2);
            expect(config.principalTypes).toContain(PrincipalType.USER);
            expect(config.principalTypes).toContain(PrincipalType.GROUP);
        });

        it('parses skip principals from config', () => {
            const config = PrincipalSelectorDescriptor.readConfig({
                'skipPrincipals': [
                    {'value': 'role:system.admin'},
                ],
            });
            expect(config.skipPrincipals).toHaveLength(1);
            expect(config.skipPrincipals[0].toString()).toBe('role:system.admin');
        });

        it('handles empty config', () => {
            const config = PrincipalSelectorDescriptor.readConfig({});
            expect(config.principalTypes).toEqual([]);
            expect(config.skipPrincipals).toEqual([]);
        });

        it('filters out invalid principal type values', () => {
            const config = PrincipalSelectorDescriptor.readConfig({
                'principalType': [
                    {'value': 'USER'},
                    {'value': 'INVALID'},
                ],
            });
            expect(config.principalTypes).toHaveLength(1);
            expect(config.principalTypes[0]).toBe(PrincipalType.USER);
        });

        it('parses ROLE type', () => {
            const config = PrincipalSelectorDescriptor.readConfig({
                'principalType': [{'value': 'ROLE'}],
            });
            expect(config.principalTypes).toContain(PrincipalType.ROLE);
        });

        it('handles empty value entries', () => {
            const config = PrincipalSelectorDescriptor.readConfig({
                'principalType': [{'value': ''}],
            });
            expect(config.principalTypes).toEqual([]);
        });
    });

    describe('createDefaultValue', () => {
        it('always returns null REFERENCE value', () => {
            const value = PrincipalSelectorDescriptor.createDefaultValue('anything');
            expect(value).toBeInstanceOf(Value);
            expect(value.isNull()).toBe(true);
        });

        it('returns null for null input', () => {
            const value = PrincipalSelectorDescriptor.createDefaultValue(null);
            expect(value.isNull()).toBe(true);
        });

        it('returns null for undefined input', () => {
            const value = PrincipalSelectorDescriptor.createDefaultValue(undefined);
            expect(value.isNull()).toBe(true);
        });
    });

    describe('validate', () => {
        const config: PrincipalSelectorConfig = {
            principalTypes: [PrincipalType.USER],
            skipPrincipals: [],
        };

        it('always returns empty array for any value', () => {
            const value = ValueTypes.REFERENCE.newValue('some-ref');
            expect(PrincipalSelectorDescriptor.validate(value, config)).toEqual([]);
        });

        it('returns empty for null value', () => {
            const value = ValueTypes.REFERENCE.newNullValue();
            expect(PrincipalSelectorDescriptor.validate(value, config)).toEqual([]);
        });
    });

    describe('valueBreaksRequired', () => {
        it('returns true for null value', () => {
            const value = ValueTypes.REFERENCE.newNullValue();
            expect(PrincipalSelectorDescriptor.valueBreaksRequired(value)).toBe(true);
        });

        it('returns true for wrong ValueType', () => {
            const value = ValueTypes.STRING.newValue('some-ref');
            expect(PrincipalSelectorDescriptor.valueBreaksRequired(value)).toBe(true);
        });

        it('returns false for valid reference value', () => {
            const value = ValueTypes.REFERENCE.newValue('some-ref');
            expect(PrincipalSelectorDescriptor.valueBreaksRequired(value)).toBe(false);
        });
    });

    describe('readConfig → validate integration', () => {
        it('validates always passes regardless of config', () => {
            const config = PrincipalSelectorDescriptor.readConfig({
                'principalType': [{'value': 'USER'}],
            });
            const value = ValueTypes.REFERENCE.newValue('some-ref');
            expect(PrincipalSelectorDescriptor.validate(value, config)).toEqual([]);
        });
    });
});
