import {describe, expect, it} from 'vitest';
import {Occurrences} from '../../form/Occurrences';
import type {
    FieldSetValidationNode,
    FormValidationResult,
    InputValidationNode,
    SkippedValidationNode,
} from '../descriptor/FormValidationResult';
import type {OccurrenceValidationState} from '../descriptor/OccurrenceManager';
import type {ValidationResult} from '../descriptor/ValidationResult';
import {findByPath, getFirstError, getOccurrenceErrorMessage, type TranslateFn} from './validation';

const t: TranslateFn = (key: string, ...args: unknown[]) => (args.length > 0 ? `${key}:${args.join(',')}` : key);

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

describe('getOccurrenceErrorMessage', () => {
    it('returns undefined when any occurrence has field errors', () => {
        const validation: OccurrenceValidationState[] = [
            {index: 0, breaksRequired: false, validationResults: [{message: 'Invalid'}]},
        ];

        expect(getOccurrenceErrorMessage(Occurrences.minmax(1, 3), validation, t)).toBeUndefined();
    });

    it('returns field.value.required when min >= 1 and max === 1 and minimum breached', () => {
        const validation: OccurrenceValidationState[] = [{index: 0, breaksRequired: true, validationResults: []}];

        expect(getOccurrenceErrorMessage(Occurrences.minmax(1, 1), validation, t)).toBe('field.value.required');
    });

    it('returns field.occurrence.breaks.min when min >= 1 and max !== 1 and minimum breached', () => {
        const validation: OccurrenceValidationState[] = [];

        expect(getOccurrenceErrorMessage(Occurrences.minmax(2, 5), validation, t)).toBe(
            'field.occurrence.breaks.min:2',
        );
    });

    it('returns field.occurrence.breaks.max.one when max === 1 and maximum breached', () => {
        const validation: OccurrenceValidationState[] = [
            {index: 0, breaksRequired: false, validationResults: []},
            {index: 1, breaksRequired: false, validationResults: []},
        ];

        expect(getOccurrenceErrorMessage(Occurrences.minmax(0, 1), validation, t)).toBe(
            'field.occurrence.breaks.max.one',
        );
    });

    it('returns field.occurrence.breaks.max.many when max > 1 and maximum breached', () => {
        const validation: OccurrenceValidationState[] = [
            {index: 0, breaksRequired: false, validationResults: []},
            {index: 1, breaksRequired: false, validationResults: []},
            {index: 2, breaksRequired: false, validationResults: []},
        ];

        expect(getOccurrenceErrorMessage(Occurrences.minmax(0, 2), validation, t)).toBe(
            'field.occurrence.breaks.max.many:2',
        );
    });

    it('returns undefined when counts satisfied', () => {
        const validation: OccurrenceValidationState[] = [
            {index: 0, breaksRequired: false, validationResults: []},
            {index: 1, breaksRequired: false, validationResults: []},
        ];

        expect(getOccurrenceErrorMessage(Occurrences.minmax(1, 3), validation, t)).toBeUndefined();
    });

    it('returns undefined for empty validation array with min=0', () => {
        expect(getOccurrenceErrorMessage(Occurrences.minmax(0, 3), [], t)).toBeUndefined();
    });

    it('returns minimum breach for empty validation array with min=1', () => {
        expect(getOccurrenceErrorMessage(Occurrences.minmax(1, 0), [], t)).toBe('field.occurrence.breaks.min:1');
    });
});

describe('findByPath', () => {
    const inputNode: InputValidationNode = {type: 'input', path: 'myInput', name: 'myInput', errors: []};

    const nestedInput: InputValidationNode = {
        type: 'input',
        path: 'fs.nested',
        name: 'nested',
        errors: [[{message: 'bad'}]],
    };

    const fieldSetNode: FieldSetValidationNode = {
        type: 'fieldset',
        path: 'fs',
        name: 'fs',
        children: [nestedInput],
        isValid: false,
    };

    const skippedNode: SkippedValidationNode = {type: 'skipped', path: 'skippedSet', name: 'skippedSet'};

    const result: FormValidationResult = {
        isValid: false,
        children: [inputNode, fieldSetNode, skippedNode],
    };

    it('finds InputValidationNode at root', () => {
        expect(findByPath(result, 'myInput')).toBe(inputNode);
    });

    it('finds nested Input inside FieldSet', () => {
        expect(findByPath(result, 'fs.nested')).toBe(nestedInput);
    });

    it('returns undefined for non-existent path', () => {
        expect(findByPath(result, 'nonExistent')).toBeUndefined();
    });

    it('finds FieldSet node itself', () => {
        expect(findByPath(result, 'fs')).toBe(fieldSetNode);
    });

    it('handles empty children', () => {
        const empty: FormValidationResult = {isValid: true, children: []};

        expect(findByPath(empty, 'anything')).toBeUndefined();
    });

    it('finds SkippedValidationNode', () => {
        expect(findByPath(result, 'skippedSet')).toBe(skippedNode);
    });
});
