import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

vi.mock('../../util/Messages', () => ({
    i18n: (key: string, ..._args: unknown[]) => `#${key}#`,
}));

vi.mock('../../store/Store', () => {
    const storeMap = new Map<string, any>();
    return {
        Store: {
            instance: () => ({
                get: (key: string) => storeMap.get(key),
                set: (key: string, value: any) => {
                    storeMap.set(key, value);
                },
                has: (key: string) => storeMap.has(key),
                delete: (key: string) => storeMap.delete(key),
            }),
        },
    };
});

import {ValueTypes} from '../../data/ValueTypes';
import {DescriptorRegistry} from './DescriptorRegistry';
import {initBuiltInDescriptors} from './initBuiltInDescriptors';

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
    beforeEach(() => {
        initBuiltInDescriptors();
    });

    afterEach(() => {
        for (const [name] of DescriptorRegistry.getAll()) {
            DescriptorRegistry.unregister(name);
        }
    });

    describe('init registration', () => {
        it.each(EXPECTED_DESCRIPTORS)('has %s registered', name => {
            expect(DescriptorRegistry.has(name)).toBe(true);
        });

        it('has exactly 14 built-in descriptors', () => {
            expect(DescriptorRegistry.getAll().size).toBe(14);
        });
    });

    describe('get', () => {
        it('returns descriptor by name', () => {
            const descriptor = DescriptorRegistry.get('TextLine');
            expect(descriptor).toBeDefined();
            expect(descriptor?.name).toBe('TextLine');
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
                valueBreaksRequired: v => v.isNull(),
            });
            expect(DescriptorRegistry.has('CustomType')).toBe(true);
            expect(DescriptorRegistry.get('customtype')).toBeDefined();
        });

        it('skips duplicate and warns without force', () => {
            const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const original = DescriptorRegistry.get('TextLine');
            DescriptorRegistry.register({
                name: 'TextLine',
                getValueType: () => ValueTypes.LONG,
                readConfig: () => ({}),
                createDefaultValue: () => ValueTypes.LONG.newNullValue(),
                validate: () => [],
                valueBreaksRequired: v => v.isNull(),
            });
            expect(DescriptorRegistry.get('TextLine')).toBe(original);
            expect(spy).toHaveBeenCalledOnce();
            spy.mockRestore();
        });

        it('overwrites existing descriptor with force', () => {
            const replacement = {
                name: 'TextLine',
                getValueType: () => ValueTypes.LONG,
                readConfig: () => ({}),
                createDefaultValue: () => ValueTypes.LONG.newNullValue(),
                validate: () => [],
                valueBreaksRequired: (v: any) => v.isNull(),
            };
            DescriptorRegistry.register(replacement, true);
            expect(DescriptorRegistry.get('TextLine')).toBe(replacement);
        });
    });

    describe('getAll', () => {
        it('returns all registered descriptors', () => {
            const all = DescriptorRegistry.getAll();
            expect(all.size).toBe(14);
        });

        it('returns a copy, not the internal map', () => {
            const all = DescriptorRegistry.getAll();
            all.delete('textline');
            expect(DescriptorRegistry.has('TextLine')).toBe(true);
        });

        it('every descriptor has a name and getValueType', () => {
            for (const [, descriptor] of DescriptorRegistry.getAll()) {
                expect(descriptor.name).toBeTruthy();
                expect(descriptor.getValueType()).toBeDefined();
            }
        });
    });

    describe('unregister', () => {
        it('returns true for existing descriptor', () => {
            expect(DescriptorRegistry.has('TextLine')).toBe(true);
            expect(DescriptorRegistry.unregister('TextLine')).toBe(true);
        });

        it('returns false for non-existent descriptor', () => {
            expect(DescriptorRegistry.unregister('NonExistent')).toBe(false);
        });

        it('is case-insensitive', () => {
            expect(DescriptorRegistry.unregister('TEXTLINE')).toBe(true);
        });

        it('after unregister: has() returns false', () => {
            DescriptorRegistry.unregister('TextLine');
            expect(DescriptorRegistry.has('TextLine')).toBe(false);
        });

        it('after unregister: get() returns undefined', () => {
            DescriptorRegistry.unregister('TextLine');
            expect(DescriptorRegistry.get('TextLine')).toBeUndefined();
        });

        it('after unregister: getAll().size decreases', () => {
            const sizeBefore = DescriptorRegistry.getAll().size;
            DescriptorRegistry.unregister('TextLine');
            expect(DescriptorRegistry.getAll().size).toBe(sizeBefore - 1);
        });

        it('can re-register after unregister', () => {
            DescriptorRegistry.unregister('TextLine');
            expect(DescriptorRegistry.has('TextLine')).toBe(false);
            DescriptorRegistry.register({
                name: 'TextLine',
                getValueType: () => ValueTypes.STRING,
                readConfig: () => ({}),
                createDefaultValue: () => ValueTypes.STRING.newNullValue(),
                validate: () => [],
                valueBreaksRequired: v => v.isNull(),
            });
            expect(DescriptorRegistry.has('TextLine')).toBe(true);
        });
    });

    describe('descriptor value types', () => {
        const expectedValueTypes: Record<string, string> = {
            TextLine: 'String',
            TextArea: 'String',
            Double: 'Double',
            Long: 'Long',
            Checkbox: 'Boolean',
            ComboBox: 'String',
            RadioButton: 'String',
            PrincipalSelector: 'Reference',
            GeoPoint: 'GeoPoint',
            Date: 'LocalDate',
            DateTime: 'LocalDateTime',
            Time: 'LocalTime',
            Instant: 'Instant',
            DateTimeRange: 'PropertySet',
        };

        it.each(Object.entries(expectedValueTypes))('%s returns ValueType %s', (name, typeName) => {
            const descriptor = DescriptorRegistry.get(name);
            expect(descriptor).toBeDefined();
            expect(descriptor?.getValueType().toString()).toBe(typeName);
        });
    });
});
