import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

vi.mock('@enonic/ui', () => ({
    Input: () => null,
}));

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
import {initBuiltInComponents} from '../../main/resources/assets/admin/common/js/form/inputtype2/initBuiltInComponents';
import {TextLineInput} from '../../main/resources/assets/admin/common/js/form/inputtype2/TextLineInput';
import type {InputTypeComponent} from '../../main/resources/assets/admin/common/js/form/inputtype2/types';

describe('ComponentRegistry', () => {
    beforeEach(() => {
        initBuiltInComponents();
    });

    afterEach(() => {
        for (const [name] of ComponentRegistry.getAll()) {
            ComponentRegistry.unregister(name);
        }
    });

    describe('init registration', () => {
        it('has TextLineInput registered as TextLine', () => {
            expect(ComponentRegistry.get('TextLine')).toBe(TextLineInput);
        });

        it('is case-insensitive', () => {
            expect(ComponentRegistry.get('textline')).toBe(TextLineInput);
            expect(ComponentRegistry.get('TEXTLINE')).toBe(TextLineInput);
        });
    });

    describe('has', () => {
        it('returns true for registered component', () => {
            expect(ComponentRegistry.has('TextLine')).toBe(true);
        });

        it('returns false for unregistered component', () => {
            expect(ComponentRegistry.has('NonExistent')).toBe(false);
        });

        it('is case-insensitive', () => {
            expect(ComponentRegistry.has('textline')).toBe(true);
        });
    });

    describe('register', () => {
        it('adds a new component', () => {
            const stub: InputTypeComponent = () => null;
            ComponentRegistry.register('Custom', stub);
            expect(ComponentRegistry.get('Custom')).toBe(stub);
        });

        it('skips duplicate and warns without force', () => {
            const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const replacement: InputTypeComponent = () => null;
            ComponentRegistry.register('TextLine', replacement);
            expect(ComponentRegistry.get('TextLine')).toBe(TextLineInput);
            expect(spy).toHaveBeenCalledOnce();
            spy.mockRestore();
        });

        it('overwrites existing component with force', () => {
            const replacement: InputTypeComponent = () => null;
            ComponentRegistry.register('TextLine', replacement, true);
            expect(ComponentRegistry.get('TextLine')).toBe(replacement);
        });
    });

    describe('getAll', () => {
        it('returns a copy, not the internal map', () => {
            const all = ComponentRegistry.getAll();
            all.delete('textline');
            expect(ComponentRegistry.has('TextLine')).toBe(true);
        });

        it('contains registered components', () => {
            const all = ComponentRegistry.getAll();
            expect(all.has('textline')).toBe(true);
        });
    });

    describe('get', () => {
        it('returns undefined for unknown component', () => {
            expect(ComponentRegistry.get('unknown')).toBeUndefined();
        });
    });

    describe('unregister', () => {
        it('returns true for existing component', () => {
            expect(ComponentRegistry.has('TextLine')).toBe(true);
            expect(ComponentRegistry.unregister('TextLine')).toBe(true);
        });

        it('returns false for non-existent component', () => {
            expect(ComponentRegistry.unregister('NonExistent')).toBe(false);
        });

        it('is case-insensitive', () => {
            expect(ComponentRegistry.unregister('TEXTLINE')).toBe(true);
        });

        it('after unregister: has() returns false and get() returns undefined', () => {
            ComponentRegistry.unregister('TextLine');
            expect(ComponentRegistry.has('TextLine')).toBe(false);
            expect(ComponentRegistry.get('TextLine')).toBeUndefined();
        });
    });
});
