import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

vi.mock('@enonic/ui', () => ({Input: () => null, TextArea: () => null}));
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

import {initBuiltInTypes} from '../initBuiltInTypes';
import {InputTypeRegistry} from './InputTypeRegistry';

describe('Registry consistency', () => {
    beforeEach(() => {
        initBuiltInTypes();
    });

    afterEach(() => {
        for (const [name] of InputTypeRegistry.getAll()) {
            InputTypeRegistry.unregister(name);
        }
    });

    it('every definition contains a descriptor', () => {
        for (const [name, definition] of InputTypeRegistry.getAll()) {
            expect(definition.descriptor, `Definition "${name}" has no descriptor`).toBeDefined();
        }
    });

    it('getDefinition mirrors getAll entries', () => {
        for (const [name, definition] of InputTypeRegistry.getAll()) {
            expect(InputTypeRegistry.getDefinition(name), `"${name}" lookup mismatch`).toEqual(definition);
        }
    });

    it('internal descriptor-only definitions are allowed', () => {
        for (const [, definition] of InputTypeRegistry.getAll()) {
            if (definition.mode === 'internal' && definition.component == null) {
                expect(definition.descriptor.name).toBeTruthy();
            }
        }
    });

    it('component-bearing definitions are a subset of all definitions', () => {
        const all = InputTypeRegistry.getAll();
        let componentCount = 0;

        for (const [, definition] of all) {
            if (definition.component) componentCount++;
        }

        expect(componentCount).toBeGreaterThan(0);
        expect(componentCount).toBeLessThanOrEqual(all.size);
    });

    it('built-in single mode is only used for single-value input types', () => {
        expect(InputTypeRegistry.getDefinition('Checkbox')?.mode).toBe('single');
        expect(InputTypeRegistry.getDefinition('RadioButton')?.mode).toBe('single');
        expect(InputTypeRegistry.getDefinition('TextLine')?.mode).toBe('list');
    });
});
