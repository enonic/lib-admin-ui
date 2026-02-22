// These tests verify registry API consistency (every component has a descriptor, etc.)
// using a mocked Store. They do NOT validate cross-bundle state sharing — that requires
// integration testing in CS where lib.js (IIFE) and the Vite bundle coexist on the same page.
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

vi.mock('@enonic/ui', () => ({Input: () => null, TextArea: () => null}));
vi.mock('../../main/resources/assets/admin/common/js/util/Messages', () => ({
    i18n: (key: string, ..._args: unknown[]) => `#${key}#`,
}));
vi.mock('../../main/resources/assets/admin/common/js/store/Store', () => {
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

import {ComponentRegistry} from '../../main/resources/assets/admin/common/js/form/inputtype2/ComponentRegistry';
import {DescriptorRegistry} from '../../main/resources/assets/admin/common/js/form/inputtype2/descriptor/DescriptorRegistry';
import {initBuiltInTypes} from '../../main/resources/assets/admin/common/js/form/inputtype2/initBuiltInTypes';

describe('Registry consistency', () => {
    beforeEach(() => {
        initBuiltInTypes();
    });

    afterEach(() => {
        for (const [name] of ComponentRegistry.getAll()) {
            ComponentRegistry.unregister(name);
        }
        for (const [name] of DescriptorRegistry.getAll()) {
            DescriptorRegistry.unregister(name);
        }
    });

    it('every ComponentRegistry entry has a matching DescriptorRegistry entry', () => {
        const components = ComponentRegistry.getAll();
        expect(components.size).toBeGreaterThan(0);
        for (const [name] of components) {
            expect(
                DescriptorRegistry.has(name),
                `ComponentRegistry has "${name}" but DescriptorRegistry does not`,
            ).toBe(true);
        }
    });

    it('ComponentRegistry entries are a subset of DescriptorRegistry (generic types only)', () => {
        const components = ComponentRegistry.getAll();
        const descriptors = DescriptorRegistry.getAll();
        expect(components.size).toBeGreaterThan(0);
        // Every component must have a descriptor, but not every descriptor needs a component yet
        expect(components.size).toBeLessThanOrEqual(descriptors.size);
    });
});
