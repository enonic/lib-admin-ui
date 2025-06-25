import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

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

import {TextLineInput} from '../components/text-line-input';
import {initBuiltInComponents} from '../initBuiltInComponents';
import type {InputTypeComponent} from '../types';
import {ComponentRegistry} from './ComponentRegistry';

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
        it('should have TextLineInput registered as TextLine', () => {
            expect(ComponentRegistry.get('TextLine')).toBe(TextLineInput);
        });

        it('should be case-insensitive', () => {
            expect(ComponentRegistry.get('textline')).toBe(TextLineInput);
            expect(ComponentRegistry.get('TEXTLINE')).toBe(TextLineInput);
        });
    });

    describe('has', () => {
        it('should return true for registered component', () => {
            expect(ComponentRegistry.has('TextLine')).toBe(true);
        });

        it('should return false for unregistered component', () => {
            expect(ComponentRegistry.has('NonExistent')).toBe(false);
        });

        it('should be case-insensitive', () => {
            expect(ComponentRegistry.has('textline')).toBe(true);
        });
    });

    describe('register', () => {
        it('should add a new component', () => {
            // Arrange
            const stub: InputTypeComponent = () => null;

            // Act
            ComponentRegistry.register('Custom', stub);

            // Assert
            expect(ComponentRegistry.get('Custom')).toBe(stub);
        });

        it('should skip duplicate and warn without force', () => {
            // Arrange
            const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const replacement: InputTypeComponent = () => null;

            // Act
            ComponentRegistry.register('TextLine', replacement);

            // Assert
            expect(ComponentRegistry.get('TextLine')).toBe(TextLineInput);
            expect(spy).toHaveBeenCalledOnce();
            spy.mockRestore();
        });

        it('should overwrite existing component with force', () => {
            // Arrange
            const replacement: InputTypeComponent = () => null;

            // Act
            ComponentRegistry.register('TextLine', replacement, true);

            // Assert
            expect(ComponentRegistry.get('TextLine')).toBe(replacement);
        });
    });

    describe('getAll', () => {
        it('should return a copy, not the internal map', () => {
            // Arrange
            const all = ComponentRegistry.getAll();

            // Act
            all.delete('textline');

            // Assert
            expect(ComponentRegistry.has('TextLine')).toBe(true);
        });

        it('should contain registered components', () => {
            // Arrange
            const all = ComponentRegistry.getAll();

            // Assert
            expect(all.has('textline')).toBe(true);
        });
    });

    describe('get', () => {
        it('should return undefined for unknown component', () => {
            expect(ComponentRegistry.get('unknown')).toBeUndefined();
        });
    });

    describe('unregister', () => {
        it('should return true for existing component', () => {
            expect(ComponentRegistry.has('TextLine')).toBe(true);
            expect(ComponentRegistry.unregister('TextLine')).toBe(true);
        });

        it('should return false for non-existent component', () => {
            expect(ComponentRegistry.unregister('NonExistent')).toBe(false);
        });

        it('should be case-insensitive', () => {
            expect(ComponentRegistry.unregister('TEXTLINE')).toBe(true);
        });

        it('should return false for has() and undefined for get() after unregister', () => {
            // Act
            ComponentRegistry.unregister('TextLine');

            // Assert
            expect(ComponentRegistry.has('TextLine')).toBe(false);
            expect(ComponentRegistry.get('TextLine')).toBeUndefined();
        });
    });
});
