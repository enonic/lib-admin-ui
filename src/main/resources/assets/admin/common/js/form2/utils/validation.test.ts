import {describe, expect, it} from 'vitest';
import type {ValidationResult} from '../descriptor/ValidationResult';
import {getFirstError} from './validation';

describe('getFirstError', () => {
    it('should return undefined for empty array', () => {
        const result = getFirstError([]);

        expect(result).toBeUndefined();
    });

    it('should return first message for single error', () => {
        const errors: ValidationResult[] = [{message: 'Not a whole number'}];

        const result = getFirstError(errors);

        expect(result).toBe('Not a whole number');
    });

    it('should return first message for multiple errors', () => {
        const errors: ValidationResult[] = [{message: 'First error'}, {message: 'Second error'}];

        const result = getFirstError(errors);

        expect(result).toBe('First error');
    });
});
