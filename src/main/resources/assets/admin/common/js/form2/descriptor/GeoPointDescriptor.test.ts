import {describe, expect, it, vi} from 'vitest';
import {Value} from '../../data/Value';
import {ValueTypes} from '../../data/ValueTypes';
import {GeoPointDescriptor} from './GeoPointDescriptor';
import type {GeoPointConfig} from './InputTypeConfig';

vi.mock('../../util/Messages', () => ({
    i18n: (key: string, ...args: unknown[]) => {
        if (args.length > 0) return `#${key}#[${args.join(',')}]`;
        return `#${key}#`;
    },
}));

describe('GeoPointDescriptor', () => {
    describe('getValueType', () => {
        it('returns GEO_POINT', () => {
            expect(GeoPointDescriptor.getValueType()).toBe(ValueTypes.GEO_POINT);
        });
    });

    describe('readConfig', () => {
        it('returns empty config object', () => {
            const config = GeoPointDescriptor.readConfig({});
            expect(config).toEqual({});
        });
    });

    describe('createDefaultValue', () => {
        it('creates GEO_POINT value from valid geo string', () => {
            const value = GeoPointDescriptor.createDefaultValue('59.9,10.7');
            expect(value).toBeInstanceOf(Value);
            expect(value.isNull()).toBe(false);
            expect(value.getType()).toBe(ValueTypes.GEO_POINT);
        });

        it('returns null Value for invalid geo point string input', () => {
            const value = GeoPointDescriptor.createDefaultValue('59.9,');
            expect(value.isNull()).toBe(true);
        });

        it('returns null Value for number input', () => {
            const value = GeoPointDescriptor.createDefaultValue(42);
            expect(value.isNull()).toBe(true);
        });

        it('returns null Value for null input', () => {
            const value = GeoPointDescriptor.createDefaultValue(null);
            expect(value.isNull()).toBe(true);
        });

        it('returns null Value for undefined input', () => {
            const value = GeoPointDescriptor.createDefaultValue(undefined);
            expect(value.isNull()).toBe(true);
        });
    });

    describe('validate', () => {
        const config: GeoPointConfig = {};

        it('returns empty for null value', () => {
            const value = ValueTypes.GEO_POINT.newNullValue();
            expect(GeoPointDescriptor.validate(value, config)).toEqual([]);
        });

        it('returns empty for valid geo point', () => {
            const value = ValueTypes.GEO_POINT.newValue('59.9,10.7');
            expect(GeoPointDescriptor.validate(value, config)).toEqual([]);
        });

        it('returns error for geo point with invalid latitude', () => {
            const rawValue = '-91.0,10.7';
            const value = ValueTypes.GEO_POINT.newValue(rawValue);
            const results = GeoPointDescriptor.validate(value, config, rawValue);

            expect(value.isNull()).toBe(true);
            expect(results).toHaveLength(1);
            expect(results[0].message).toBe('#field.value.invalid#');
        });

        it('returns error for geo point with invalid longitude', () => {
            const rawValue = '59.9,181.0';
            const value = ValueTypes.GEO_POINT.newValue(rawValue);
            const results = GeoPointDescriptor.validate(value, config, rawValue);

            expect(value.isNull()).toBe(true);
            expect(results).toHaveLength(1);
            expect(results[0].message).toBe('#field.value.invalid#');
        });

        it('returns error for geo point with invalid latitude and longitude', () => {
            const rawValue = '-91.0,181.0';
            const value = ValueTypes.GEO_POINT.newValue(rawValue);
            const results = GeoPointDescriptor.validate(value, config, rawValue);

            expect(value.isNull()).toBe(true);
            expect(results).toHaveLength(1);
            expect(results[0].message).toBe('#field.value.invalid#');
        });

        it('returns error for geo point with invalid value', () => {
            const rawValue = '-91.0,';
            const value = ValueTypes.GEO_POINT.newValue(rawValue);
            const results = GeoPointDescriptor.validate(value, config, rawValue);

            expect(value.isNull()).toBe(true);
            expect(results).toHaveLength(1);
            expect(results[0].message).toBe('#field.value.invalid#');
        });
    });

    describe('valueBreaksRequired', () => {
        it('returns true for null value', () => {
            const value = ValueTypes.GEO_POINT.newNullValue();
            expect(GeoPointDescriptor.valueBreaksRequired(value)).toBe(true);
        });

        it('returns true for wrong ValueType', () => {
            const value = ValueTypes.STRING.newValue('59.9,10.7');
            expect(GeoPointDescriptor.valueBreaksRequired(value)).toBe(true);
        });

        it('returns false for valid geo point value', () => {
            const value = ValueTypes.GEO_POINT.newValue('59.9,10.7');
            expect(GeoPointDescriptor.valueBreaksRequired(value)).toBe(false);
        });
    });

    describe('readConfig → validate integration', () => {
        it('accepts valid geo point with empty config', () => {
            const config = GeoPointDescriptor.readConfig({});
            const value = ValueTypes.GEO_POINT.newValue('59.9,10.7');
            expect(GeoPointDescriptor.validate(value, config)).toEqual([]);
        });

        it('accepts null value with empty config', () => {
            const config = GeoPointDescriptor.readConfig({});
            const value = ValueTypes.GEO_POINT.newNullValue();
            expect(GeoPointDescriptor.validate(value, config)).toEqual([]);
        });
    });
});
