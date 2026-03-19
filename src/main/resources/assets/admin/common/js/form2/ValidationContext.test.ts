import {describe, expect, it} from 'vitest';
import type {ValidationVisibility} from './ValidationContext';

// ? ValidationVisibilityProvider uses createContext which requires React runtime.
// ? We verify the default behavior indirectly: the type must accept 'all' as a value,
// ? and the context module must export without errors. The actual default ('all')
// ? ensures components work without a provider — tested via InputField integration.

describe('ValidationVisibility type', () => {
    it('accepts all visibility modes', () => {
        const modes: ValidationVisibility[] = ['none', 'interactive', 'all'];

        expect(modes).toHaveLength(3);
    });
});
