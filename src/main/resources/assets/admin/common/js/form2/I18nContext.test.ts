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
            // Arrange
            const t = createTranslate({greeting: 'Hello'});

            // Act
            const result = t('greeting');

            // Assert
            expect(result).toBe('Hello');
        });

        it('should return #key# for unknown key', () => {
            // Arrange
            const t = createTranslate({});

            // Act
            const result = t('missing.key');

            // Assert
            expect(result).toBe('#missing.key#');
        });
    });

    describe('placeholder substitution', () => {
        it('should replace single placeholder', () => {
            // Arrange
            const t = createTranslate({msg: 'Hello {0}'});

            // Act
            const result = t('msg', 'World');

            // Assert
            expect(result).toBe('Hello World');
        });

        it('should replace multiple placeholders', () => {
            // Arrange
            const t = createTranslate({msg: '{0} has {1} items'});

            // Act
            const result = t('msg', 'Cart', 3);

            // Assert
            expect(result).toBe('Cart has 3 items');
        });

        it('should replace repeated placeholder', () => {
            // Arrange
            const t = createTranslate({msg: '{0} and {0}'});

            // Act
            const result = t('msg', 'same');

            // Assert
            expect(result).toBe('same and same');
        });

        it('should replace placeholder with empty string for missing arg', () => {
            // Arrange
            const t = createTranslate({msg: 'Value: {0}, Extra: {1}'});

            // Act
            const result = t('msg', 'first');

            // Assert
            expect(result).toBe('Value: first, Extra:');
        });

        it('should handle numeric args', () => {
            // Arrange
            const t = createTranslate({chars: '{0} characters remaining'});

            // Act
            const result = t('chars', 42);

            // Assert
            expect(result).toBe('42 characters remaining');
        });

        it('should leave message intact when no placeholders exist', () => {
            // Arrange
            const t = createTranslate({plain: 'No placeholders here'});

            // Act
            const result = t('plain', 'unused');

            // Assert
            expect(result).toBe('No placeholders here');
        });
    });

    describe('trimming', () => {
        it('should trim leading and trailing whitespace', () => {
            // Arrange
            const t = createTranslate({msg: '  Hello  '});

            // Act
            const result = t('msg');

            // Assert
            expect(result).toBe('Hello');
        });

        it('should trim after substitution', () => {
            // Arrange
            const t = createTranslate({msg: ' {0} '});

            // Act
            const result = t('msg', 'trimmed');

            // Assert
            expect(result).toBe('trimmed');
        });
    });
});
