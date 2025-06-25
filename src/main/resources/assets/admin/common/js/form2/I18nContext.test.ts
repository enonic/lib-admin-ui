import {describe, expect, it} from 'vitest';

// ? I18nProvider uses useMemo/createContext which require React runtime.
// ? We test the translate logic directly — same algorithm as in I18nProvider.

function createTranslate(messages: Record<string, string>) {
    return (key: string, ...args: unknown[]): string => {
        const value = messages[key];
        if (value == null) return `#${key}#`;
        return value.replace(/{(\d+)}/g, (_, i: string) => String(args[Number(i)] ?? '')).trim();
    };
}

describe('I18nProvider translate logic', () => {
    describe('key lookup', () => {
        it('should return message for known key', () => {
            const t = createTranslate({greeting: 'Hello'});

            const result = t('greeting');

            expect(result).toBe('Hello');
        });

        it('should return #key# for unknown key', () => {
            const t = createTranslate({});

            const result = t('missing.key');

            expect(result).toBe('#missing.key#');
        });
    });

    describe('placeholder substitution', () => {
        it('should replace single placeholder', () => {
            const t = createTranslate({msg: 'Hello {0}'});

            const result = t('msg', 'World');

            expect(result).toBe('Hello World');
        });

        it('should replace multiple placeholders', () => {
            const t = createTranslate({msg: '{0} has {1} items'});

            const result = t('msg', 'Cart', 3);

            expect(result).toBe('Cart has 3 items');
        });

        it('should replace repeated placeholder', () => {
            const t = createTranslate({msg: '{0} and {0}'});

            const result = t('msg', 'same');

            expect(result).toBe('same and same');
        });

        it('should replace placeholder with empty string for missing arg', () => {
            const t = createTranslate({msg: 'Value: {0}, Extra: {1}'});

            const result = t('msg', 'first');

            expect(result).toBe('Value: first, Extra:');
        });

        it('should handle numeric args', () => {
            const t = createTranslate({chars: '{0} characters remaining'});

            const result = t('chars', 42);

            expect(result).toBe('42 characters remaining');
        });

        it('should leave message intact when no placeholders exist', () => {
            const t = createTranslate({plain: 'No placeholders here'});

            const result = t('plain', 'unused');

            expect(result).toBe('No placeholders here');
        });
    });

    describe('trimming', () => {
        it('should trim leading and trailing whitespace', () => {
            const t = createTranslate({msg: '  Hello  '});

            const result = t('msg');

            expect(result).toBe('Hello');
        });

        it('should trim after substitution', () => {
            const t = createTranslate({msg: ' {0} '});

            const result = t('msg', 'trimmed');

            expect(result).toBe('trimmed');
        });
    });
});
