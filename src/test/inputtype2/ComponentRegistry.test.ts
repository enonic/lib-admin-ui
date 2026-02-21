import {afterEach, describe, expect, it, vi} from 'vitest';

vi.mock('@enonic/ui', () => ({
    Input: () => null,
}));

vi.mock('../../main/resources/assets/admin/common/js/util/Messages', () => ({
    i18n: (key: string, ...args: unknown[]) => `#${key}#`,
}));

import {ComponentRegistry} from '../../main/resources/assets/admin/common/js/form/inputtype2/ComponentRegistry';
import {TextLineInput} from '../../main/resources/assets/admin/common/js/form/inputtype2/TextLineInput';
import type {InputTypeComponent} from '../../main/resources/assets/admin/common/js/form/inputtype2/types';

describe('ComponentRegistry', () => {

    afterEach(() => {
        ComponentRegistry._reset();
    });

    describe('auto-registration', () => {
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

        it('overwrites existing component silently', () => {
            const replacement: InputTypeComponent = () => null;
            ComponentRegistry.register('TextLine', replacement);
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
});
