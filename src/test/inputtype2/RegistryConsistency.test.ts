// These tests verify registry API consistency (every component has a descriptor, etc.)
// using a mocked Store. They do NOT validate cross-bundle state sharing — that requires
// integration testing in CS where lib.js (IIFE) and the Vite bundle coexist on the same page.
import {describe, expect, it, vi} from 'vitest';

vi.mock('@enonic/ui', () => ({Input: () => null}));
vi.mock('../../main/resources/assets/admin/common/js/util/Messages', () => ({
    i18n: (key: string, ...args: unknown[]) => `#${key}#`,
}));
vi.mock('../../main/resources/assets/admin/common/js/store/Store', () => {
    const storeMap = new Map<string, any>();
    return {
        Store: {
            instance: () => ({
                get: (key: string) => storeMap.get(key),
                set: (key: string, value: any) => { storeMap.set(key, value); },
                has: (key: string) => storeMap.has(key),
                delete: (key: string) => storeMap.delete(key),
            }),
        },
    };
});

import {ComponentRegistry} from '../../main/resources/assets/admin/common/js/form/inputtype2/ComponentRegistry';
import {DescriptorRegistry} from '../../main/resources/assets/admin/common/js/form/inputtype/descriptor/DescriptorRegistry';

describe('Registry consistency', () => {

    it('every ComponentRegistry entry has a matching DescriptorRegistry entry', () => {
        const components = ComponentRegistry.getAll();
        for (const [name] of components) {
            expect(DescriptorRegistry.has(name), `ComponentRegistry has "${name}" but DescriptorRegistry does not`).toBe(true);
        }
    });

    it('ComponentRegistry entries are a subset of DescriptorRegistry (generic types only)', () => {
        const components = ComponentRegistry.getAll();
        const descriptors = DescriptorRegistry.getAll();
        // Every component must have a descriptor, but not every descriptor needs a component yet
        expect(components.size).toBeLessThanOrEqual(descriptors.size);
    });
});
