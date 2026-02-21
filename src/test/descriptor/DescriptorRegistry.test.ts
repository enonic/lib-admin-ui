import {describe, expect, it, vi} from 'vitest';

vi.mock('../../main/resources/assets/admin/common/js/util/Messages', () => ({
    i18n: (key: string, ...args: unknown[]) => `#${key}#`,
}));

import {DescriptorRegistry} from '../../main/resources/assets/admin/common/js/form/inputtype/descriptor/DescriptorRegistry';
import {ValueTypes} from '../../main/resources/assets/admin/common/js/data/ValueTypes';

const EXPECTED_DESCRIPTORS = [
    'TextLine',
    'TextArea',
    'Double',
    'Long',
    'Checkbox',
    'ComboBox',
    'RadioButton',
    'PrincipalSelector',
    'GeoPoint',
    'Date',
    'DateTime',
    'Time',
    'Instant',
    'DateTimeRange',
];

describe('DescriptorRegistry', () => {

    describe('auto-registration', () => {
        it.each(EXPECTED_DESCRIPTORS)('has %s registered', (name) => {
            expect(DescriptorRegistry.has(name)).toBe(true);
        });

        it('has exactly 14 built-in descriptors', () => {
            expect(DescriptorRegistry.getAll()).toHaveLength(14);
        });
    });

    describe('get', () => {
        it('returns descriptor by name', () => {
            const descriptor = DescriptorRegistry.get('TextLine');
            expect(descriptor).toBeDefined();
            expect(descriptor!.name).toBe('TextLine');
        });

        it('is case-insensitive', () => {
            expect(DescriptorRegistry.get('textline')).toBe(DescriptorRegistry.get('TextLine'));
            expect(DescriptorRegistry.get('TEXTLINE')).toBe(DescriptorRegistry.get('TextLine'));
        });

        it('returns undefined for unknown descriptor', () => {
            expect(DescriptorRegistry.get('NonExistent')).toBeUndefined();
        });
    });

    describe('has', () => {
        it('returns true for registered descriptor', () => {
            expect(DescriptorRegistry.has('TextLine')).toBe(true);
        });

        it('returns false for unregistered descriptor', () => {
            expect(DescriptorRegistry.has('CustomWidget')).toBe(false);
        });

        it('is case-insensitive', () => {
            expect(DescriptorRegistry.has('checkbox')).toBe(true);
        });
    });

    describe('register', () => {
        it('adds a custom descriptor', () => {
            DescriptorRegistry.register({
                name: 'CustomType',
                getValueType: () => ValueTypes.STRING,
                readConfig: () => ({}),
                createDefaultValue: () => ValueTypes.STRING.newNullValue(),
                validate: () => [],
                valueBreaksRequired: (v) => v.isNull(),
            });
            expect(DescriptorRegistry.has('CustomType')).toBe(true);
            expect(DescriptorRegistry.get('customtype')).toBeDefined();
        });
    });

    describe('getAll', () => {
        it('returns all registered descriptors', () => {
            const all = DescriptorRegistry.getAll();
            expect(all.length).toBeGreaterThanOrEqual(14);
        });

        it('every descriptor has a name and getValueType', () => {
            for (const descriptor of DescriptorRegistry.getAll()) {
                expect(descriptor.name).toBeTruthy();
                expect(descriptor.getValueType()).toBeDefined();
            }
        });
    });

    describe('descriptor value types', () => {
        const expectedValueTypes: Record<string, string> = {
            'TextLine': 'String',
            'TextArea': 'String',
            'Double': 'Double',
            'Long': 'Long',
            'Checkbox': 'Boolean',
            'ComboBox': 'String',
            'RadioButton': 'String',
            'PrincipalSelector': 'Reference',
            'GeoPoint': 'GeoPoint',
            'Date': 'LocalDate',
            'DateTime': 'LocalDateTime',
            'Time': 'LocalTime',
            'Instant': 'Instant',
            'DateTimeRange': 'PropertySet',
        };

        it.each(Object.entries(expectedValueTypes))('%s returns ValueType %s', (name, typeName) => {
            const descriptor = DescriptorRegistry.get(name);
            expect(descriptor).toBeDefined();
            expect(descriptor!.getValueType().toString()).toBe(typeName);
        });
    });
});
