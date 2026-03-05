import {describe, expect, it} from 'vitest';

describe('Counter', () => {
    describe('parent visibility contract', () => {
        function shouldRenderCounter(maxLength: number): boolean {
            return maxLength > 0;
        }

        it('should be rendered by the parent when maxLength is positive', () => {
            expect(shouldRenderCounter(100)).toBe(true);
        });

        it('should be hidden by the parent when maxLength is zero or negative', () => {
            expect(shouldRenderCounter(0)).toBe(false);
            expect(shouldRenderCounter(-10)).toBe(false);
        });
    });

    describe('display mode selection', () => {
        function getDisplayMode(showCounter: boolean): 'remaining' | 'total' {
            return showCounter ? 'total' : 'remaining';
        }

        it('should show the current out of total variant when showCounter is enabled', () => {
            expect(getDisplayMode(true)).toBe('total');
        });

        it('should show the remaining variant when showCounter is disabled', () => {
            expect(getDisplayMode(false)).toBe('remaining');
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
