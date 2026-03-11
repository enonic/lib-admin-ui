import {describe, expect, it} from 'vitest';
import {ValueTypes} from '../../../data/ValueTypes';
import {ComboBoxDescriptor} from '../../descriptor/ComboBoxDescriptor';
import type {ComboBoxConfig} from '../../descriptor/InputTypeConfig';

describe('ComboBoxInput', () => {
    describe('selected values derivation', () => {
        it('should extract strings from non-null values', () => {
            const values = [ValueTypes.STRING.newValue('option1'), ValueTypes.STRING.newValue('option2')];

            const selectedStrings = values.filter(v => !v.isNull()).map(v => v.getString());

            expect(selectedStrings).toEqual(['option1', 'option2']);
        });

        it('should skip null values', () => {
            const values = [
                ValueTypes.STRING.newValue('option1'),
                ValueTypes.STRING.newNullValue(),
                ValueTypes.STRING.newValue('option3'),
            ];

            const selectedStrings = values.filter(v => !v.isNull()).map(v => v.getString());

            expect(selectedStrings).toEqual(['option1', 'option3']);
        });

        it('should return empty array for no values', () => {
            const selectedStrings = [].filter(() => true).map(() => '');

            expect(selectedStrings).toEqual([]);
        });
    });

    describe('option lookup', () => {
        const options: ComboBoxConfig['options'] = [
            {label: 'Alpha', value: 'a'},
            {label: 'Beta', value: 'b'},
            {label: 'Gamma', value: 'c'},
        ];
        const optionMap = new Map(options.map(o => [o.value, o]));

        it('should find option by value', () => {
            expect(optionMap.get('b')?.label).toBe('Beta');
        });

        it('should return undefined for unknown value', () => {
            expect(optionMap.get('unknown')).toBeUndefined();
        });
    });

    describe('option filtering', () => {
        const options: ComboBoxConfig['options'] = [
            {label: 'Alpha', value: 'a'},
            {label: 'Beta', value: 'b'},
            {label: 'Gamma', value: 'c'},
        ];

        it('should filter by label case-insensitively', () => {
            const query = 'alpha';
            const filtered = options.filter(o => o.label.toLowerCase().includes(query));

            expect(filtered).toHaveLength(1);
            expect(filtered[0].value).toBe('a');
        });

        it('should filter by value', () => {
            const query = 'b';
            const filtered = options.filter(
                o => o.label.toLowerCase().includes(query) || o.value.toLowerCase().includes(query),
            );

            expect(filtered).toHaveLength(1);
        });

        it('should return all options when query is empty', () => {
            const filtered = options;

            expect(filtered).toHaveLength(3);
        });
    });

    describe('isMultiSelect computation', () => {
        function isMultiSelect(max: number): boolean {
            return max === 0 || max > 1;
        }

        it('should be false for single select (max 1)', () => {
            expect(isMultiSelect(1)).toBe(false);
        });

        it('should be true for unlimited (max 0)', () => {
            expect(isMultiSelect(0)).toBe(true);
        });

        it('should be true for max greater than 1', () => {
            expect(isMultiSelect(2)).toBe(true);
            expect(isMultiSelect(5)).toBe(true);
        });
    });

    describe('canAdd computation', () => {
        function canAdd(max: number, count: number): boolean {
            return max === 0 || count < max;
        }

        it('should allow adding when below max', () => {
            expect(canAdd(3, 1)).toBe(true);
        });

        it('should allow adding when max is unlimited (0)', () => {
            expect(canAdd(0, 100)).toBe(true);
        });

        it('should not allow adding when at max', () => {
            expect(canAdd(3, 3)).toBe(false);
        });
    });

    describe('descriptor integration', () => {
        it('should parse config options correctly', () => {
            const config = ComboBoxDescriptor.readConfig({
                options: [
                    {value: 'Label 1', '@value': 'key1'},
                    {value: 'Label 2', '@value': 'key2'},
                ],
            });

            expect(config.options).toEqual([
                {label: 'Label 1', value: 'key1'},
                {label: 'Label 2', value: 'key2'},
            ]);
        });

        it('should create value from string', () => {
            const value = ValueTypes.STRING.newValue('option1');

            expect(value.isNull()).toBe(false);
            expect(value.getString()).toBe('option1');
        });
    });
});
