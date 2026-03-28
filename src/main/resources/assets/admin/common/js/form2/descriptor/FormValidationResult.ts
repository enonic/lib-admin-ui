import type {ValidationResult} from './ValidationResult';

/** Validation result for a single Input, with per-occurrence error arrays. */
export type InputValidationNode = {
    readonly type: 'input';
    readonly path: string;
    readonly name: string;
    /** Per-occurrence validation errors (outer index = occurrence). */
    readonly errors: ValidationResult[][];
    /** Occurrence-level error message (min/max breach), absent when valid. */
    readonly occurrenceError?: string;
};

/** Validation result for a FieldSet — a visual grouping of form items. */
export type FieldSetValidationNode = {
    readonly type: 'fieldset';
    readonly path: string;
    readonly name: string;
    readonly children: FormValidationNode[];
    readonly isValid?: boolean;
};

/** Validation result for a FormItemSet, with per-occurrence children and validity. */
export type ItemSetValidationNode = {
    readonly type: 'itemset';
    readonly path: string;
    readonly name: string;
    readonly occurrenceError?: string;
    readonly occurrences: {
        readonly children: FormValidationNode[];
        readonly isValid?: boolean;
    }[];
};

/** Validation result for a FormOptionSet, with per-occurrence selection and children validation. */
export type OptionSetValidationNode = {
    readonly type: 'optionset';
    readonly path: string;
    readonly name: string;
    readonly occurrenceError?: string;
    readonly occurrences: {
        readonly children: FormValidationNode[];
        readonly multiselectionError?: string;
        readonly isValid?: boolean;
    }[];
};

/** Placeholder for unrecognized form item types. */
export type SkippedValidationNode = {
    readonly type: 'skipped';
    readonly path: string;
    readonly name: string;
};

/** Discriminated union of all validation node types. */
export type FormValidationNode =
    | InputValidationNode
    | FieldSetValidationNode
    | ItemSetValidationNode
    | OptionSetValidationNode
    | SkippedValidationNode;

/** Top-level result returned by `validateForm()`. */
export type FormValidationResult = {
    readonly isValid: boolean;
    readonly children: FormValidationNode[];
};
