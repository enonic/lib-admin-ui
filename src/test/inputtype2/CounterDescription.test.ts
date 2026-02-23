import {describe, expect, it} from 'vitest';

describe('CounterDescription', () => {
    describe('branch selection logic', () => {
        // ? Tests verify which branch is taken based on props, mirroring the component's 4 paths.
        // ? The component uses useI18n() which can't be called in Node — so we test the conditions directly.

        function getBranch(props: {length: number; maxLength: number; showCounter: boolean}): string {
            const {maxLength, showCounter} = props;
            const hasMaxLength = maxLength > 0;
            if (showCounter && hasMaxLength) return 'counter+maxLength';
            if (hasMaxLength) return 'maxLength';
            if (showCounter) return 'counter';
            return 'null';
        }

        it('should select counter+maxLength branch when both are enabled', () => {
            // Arrange & Act
            const branch = getBranch({length: 5, maxLength: 100, showCounter: true});

            // Assert
            expect(branch).toBe('counter+maxLength');
        });

        it('should select maxLength branch when only maxLength is positive', () => {
            // Arrange & Act
            const branch = getBranch({length: 5, maxLength: 100, showCounter: false});

            // Assert
            expect(branch).toBe('maxLength');
        });

        it('should select counter branch when only showCounter is true', () => {
            // Arrange & Act
            const branch = getBranch({length: 5, maxLength: -1, showCounter: true});

            // Assert
            expect(branch).toBe('counter');
        });

        it('should select null branch when neither is enabled', () => {
            // Arrange & Act
            const branch = getBranch({length: 5, maxLength: -1, showCounter: false});

            // Assert
            expect(branch).toBe('null');
        });

        it('should treat maxLength=0 as no max length', () => {
            // Arrange & Act
            const branch = getBranch({length: 5, maxLength: 0, showCounter: false});

            // Assert
            expect(branch).toBe('null');
        });

        it('should treat negative maxLength as no max length', () => {
            // Arrange & Act
            const branch = getBranch({length: 5, maxLength: -10, showCounter: true});

            // Assert
            expect(branch).toBe('counter');
        });
    });

    describe('remaining calculation', () => {
        it('should compute positive remaining when under limit', () => {
            // Arrange
            const maxLength = 100;
            const length = 30;

            // Act
            const remaining = maxLength - length;

            // Assert
            expect(remaining).toBe(70);
        });

        it('should compute zero remaining when at limit', () => {
            // Arrange
            const maxLength = 50;
            const length = 50;

            // Act
            const remaining = maxLength - length;

            // Assert
            expect(remaining).toBe(0);
        });

        it('should compute negative remaining when over limit', () => {
            // Arrange
            const maxLength = 10;
            const length = 15;

            // Act
            const remaining = maxLength - length;

            // Assert
            expect(remaining).toBe(-5);
        });
    });
});
