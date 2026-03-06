import {describe, expect, it} from 'vitest';
import {Value} from '../../../data/Value';
import {ValueTypes} from '../../../data/ValueTypes';

describe('GeoPointInput', () => {
    describe('value transformation', () => {
        it('should produce empty string for null value', () => {
            const value = ValueTypes.GEO_POINT.newNullValue();

            const raw = value.isNull() ? '' : String(value.getGeoPoint().toString() ?? '');

            expect(value.isNull()).toBe(true);
            expect(raw).toBe('');
        });

        it('should produce string display for valid geo point value', () => {
            const value = ValueTypes.GEO_POINT.newValue('-27.6954167,-48.4830257');

            const raw = value.isNull() ? '' : String(value.getGeoPoint().toString() ?? '');

            expect(value.isNull()).toBe(false);
            expect(raw).toBe('-27.6954167,-48.4830257');
        });

        it('should produce correct Value type on onChange with valid geo point', () => {
            const newValue = ValueTypes.GEO_POINT.newValue('52.3676,4.9041');

            expect(newValue).toBeInstanceOf(Value);
            expect(newValue.getGeoPoint().getLatitude()).toBe(52.3676);
            expect(newValue.getGeoPoint().getLongitude()).toBe(4.9041);
            expect(newValue.getType()).toBe(ValueTypes.GEO_POINT);
        });

        it('should handle boundary values (90,-180)', () => {
            const newValue = ValueTypes.GEO_POINT.newValue('90,-180');

            expect(newValue.getGeoPoint().getLatitude()).toBe(90);
            expect(newValue.getGeoPoint().getLongitude()).toBe(-180);
        });

        it('should handle zero coordinates', () => {
            const newValue = ValueTypes.GEO_POINT.newValue('0,0');

            expect(newValue.getGeoPoint().getLatitude()).toBe(0);
            expect(newValue.getGeoPoint().getLongitude()).toBe(0);
        });
    });

    describe('handleChange logic', () => {
        it('should produce GeoPoint value for valid input', () => {
            const input = '52.3676,4.9041';
            const value = ValueTypes.GEO_POINT.newValue(input);

            expect(value.isNull()).toBe(false);
            expect(value.getGeoPoint().getLatitude()).toBe(52.3676);
            expect(value.getGeoPoint().getLongitude()).toBe(4.9041);
        });

        it('should return null for empty input', () => {
            const nullValue = ValueTypes.GEO_POINT.newNullValue();

            expect(nullValue.isNull()).toBe(true);
        });

        it('should return null for invalid coordinates', () => {
            expect(ValueTypes.GEO_POINT.newValue('91.0,').isNull()).toBe(true);
            expect(ValueTypes.GEO_POINT.newValue(',91.0').isNull()).toBe(true);
            expect(ValueTypes.GEO_POINT.newValue('91.0,180.0').isNull()).toBe(true);
            expect(ValueTypes.GEO_POINT.newValue('90.0,181.0').isNull()).toBe(true);
            expect(ValueTypes.GEO_POINT.newValue('-90.0,180.0').isNull()).toBe(false);
            expect(ValueTypes.GEO_POINT.newValue('90.0,-181.0').isNull()).toBe(true);
            expect(ValueTypes.GEO_POINT.newValue('abc').isNull()).toBe(true);
        });
    });
});
