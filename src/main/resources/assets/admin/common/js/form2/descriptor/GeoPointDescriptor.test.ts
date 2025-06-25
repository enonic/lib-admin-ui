import {describe, expect, it} from 'vitest';
import {Value} from '../../data/Value';
import {ValueTypes} from '../../data/ValueTypes';
import {GeoPointDescriptor} from './GeoPointDescriptor';
import type {GeoPointConfig} from './InputTypeConfig';

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

        it('ignores unknown config keys', () => {
            const config = GeoPointDescriptor.readConfig({unknown: [{value: 'test'}]});
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
