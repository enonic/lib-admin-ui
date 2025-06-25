import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {ValueTypes} from '../../data/ValueTypes';
import {GeoPointInput} from '../components/geo-point-input';
import {TagInput} from '../components/tag-input';
import {TextLineInput} from '../components/text-line-input';
import type {InputTypeDescriptor} from '../descriptor/InputTypeDescriptor';
import {initBuiltInTypes} from '../initBuiltInTypes';
import type {InputTypeComponent, InputTypeDefinition, SelfManagedInputTypeComponent} from '../types';
import {InputTypeRegistry} from './InputTypeRegistry';

vi.mock('@enonic/ui', () => ({
    Input: () => null,
}));

vi.mock('../../util/Messages', () => ({
    i18n: (key: string, ..._args: unknown[]) => `#${key}#`,
}));

vi.mock('../../store/Store', () => {
    const storeMap = new Map<string, unknown>();
    return {
        Store: {
            instance: () => ({
                get: (key: string) => storeMap.get(key),
                set: (key: string, value: unknown) => {
                    storeMap.set(key, value);
                },
                has: (key: string) => storeMap.has(key),
                delete: (key: string) => storeMap.delete(key),
            }),
        },
    };
});

function stubDescriptor(name: string): InputTypeDescriptor {
    return {
        name,
        getValueType: () => ValueTypes.STRING,
        readConfig: () => ({}),
        createDefaultValue: () => ValueTypes.STRING.newNullValue(),
        validate: () => [],
        valueBreaksRequired: v => v.isNull(),
    };
}

describe('InputTypeRegistry', () => {
    beforeEach(() => {
        initBuiltInTypes();
    });

    afterEach(() => {
        for (const [name] of InputTypeRegistry.getAll()) {
            InputTypeRegistry.unregister(name);
        }
    });

    describe('registerType', () => {
        it('registers a list definition atomically', () => {
            const descriptor = stubDescriptor('Custom');
            const component: InputTypeComponent = () => null;
            const definition: InputTypeDefinition = {mode: 'list', descriptor, component};

            InputTypeRegistry.registerType(definition);

            expect(InputTypeRegistry.getDefinition('Custom')).toEqual(definition);
            expect(InputTypeRegistry.getDescriptor('Custom')).toBe(descriptor);
        });

        it('registers descriptor-only internal definitions', () => {
            const descriptor = stubDescriptor('SelfManaged');

            InputTypeRegistry.registerType({mode: 'internal', descriptor});

            expect(InputTypeRegistry.getDefinition('SelfManaged')).toEqual({mode: 'internal', descriptor});
        });

        it('warns on duplicate registration without force', () => {
            const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const original = InputTypeRegistry.getDefinition('TextLine');

            InputTypeRegistry.registerType({
                mode: 'list',
                descriptor: stubDescriptor('TextLine'),
                component: () => null,
            });

            expect(InputTypeRegistry.getDefinition('TextLine')).toBe(original);
            expect(spy).toHaveBeenCalledOnce();
            spy.mockRestore();
        });

        it('overwrites an existing definition with force', () => {
            const descriptor = stubDescriptor('TextLine');
            const component: InputTypeComponent = () => null;

            InputTypeRegistry.registerType({mode: 'single', descriptor, component}, true);

            expect(InputTypeRegistry.getDefinition('TextLine')).toEqual({mode: 'single', descriptor, component});
        });

        it('accepts internal components when mode is internal', () => {
            const descriptor = stubDescriptor('Combo');
            const component: SelfManagedInputTypeComponent = () => null;

            InputTypeRegistry.registerType({mode: 'internal', descriptor, component});

            expect(InputTypeRegistry.getDefinition('Combo')).toEqual({mode: 'internal', descriptor, component});
        });
    });

    describe('built-in definitions', () => {
        it('registers expected built-in modes', () => {
            expect(InputTypeRegistry.getDefinition('TextLine')?.mode).toBe('list');
            expect(InputTypeRegistry.getDefinition('Checkbox')?.mode).toBe('single');
            expect(InputTypeRegistry.getDefinition('Tag')?.mode).toBe('internal');
            expect(InputTypeRegistry.getDefinition('ComboBox')?.mode).toBe('internal');
            expect(InputTypeRegistry.getDefinition('PrincipalSelector')?.mode).toBe('internal');
        });

        it('registers TextLine, GeoPoint, and Tag with components', () => {
            expect(InputTypeRegistry.getDefinition('TextLine')?.component).toBe(TextLineInput);
            expect(InputTypeRegistry.getDefinition('GeoPoint')?.component).toBe(GeoPointInput);
            expect(InputTypeRegistry.getDefinition('Tag')?.component).toBe(TagInput);
        });

        it('keeps ComboBox descriptor-only until a React component is added', () => {
            expect(InputTypeRegistry.getDefinition('ComboBox')?.component).toBeUndefined();
        });
    });

    describe('lookup', () => {
        it('resolves definitions regardless of case', () => {
            expect(InputTypeRegistry.getDefinition('textline')).toBe(InputTypeRegistry.getDefinition('TextLine'));
            expect(InputTypeRegistry.getDefinition('TEXTLINE')).toBe(InputTypeRegistry.getDefinition('TextLine'));
        });

        it('returns undefined for unknown definitions', () => {
            expect(InputTypeRegistry.getDefinition('unknown')).toBeUndefined();
            expect(InputTypeRegistry.getDescriptor('unknown')).toBeUndefined();
        });
    });

    describe('getAll', () => {
        it('returns a copy, not the internal map', () => {
            const all = InputTypeRegistry.getAll();

            all.delete('textline');

            expect(InputTypeRegistry.has('TextLine')).toBe(true);
        });

        it('returns definition objects for every registered type', () => {
            for (const [name, definition] of InputTypeRegistry.getAll()) {
                expect(InputTypeRegistry.getDefinition(name)).toEqual(definition);
            }
        });
    });

    describe('unregister', () => {
        it('removes definitions case-insensitively', () => {
            expect(InputTypeRegistry.unregister('TEXTLINE')).toBe(true);
            expect(InputTypeRegistry.getDefinition('TextLine')).toBeUndefined();
            expect(InputTypeRegistry.getDescriptor('TextLine')).toBeUndefined();
        });

        it('returns false for unknown definitions', () => {
            expect(InputTypeRegistry.unregister('NonExistent')).toBe(false);
        });
    });
});
