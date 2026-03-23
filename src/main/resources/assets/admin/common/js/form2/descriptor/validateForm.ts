import type {PropertySet} from '../../data/PropertySet';
import type {Form} from '../../form/Form';
import {Input} from '../../form/Input';
import {FieldSet} from '../../form/set/fieldset/FieldSet';
import {FormItemSet} from '../../form/set/itemset/FormItemSet';
import {FormOptionSet} from '../../form/set/optionset/FormOptionSet';
import {ObjectHelper} from '../../ObjectHelper';
import type {ValidationError} from '../../ValidationError';
import {InputTypeRegistry} from '../registry/InputTypeRegistry';
import type {
    FieldSetValidationNode,
    FormValidationNode,
    FormValidationResult,
    InputValidationNode,
    SkippedValidationNode,
} from './FormValidationResult';
import type {OccurrenceValidationState} from './OccurrenceManager';
import type {ValidationResult} from './ValidationResult';

/** Maps input name → per-occurrence raw string values for validation. */
export type RawValueMap = Map<string, (string | undefined)[]>;

export type ValidateFormOptions = {
    /** Raw (unparsed) values keyed by input name, used for format validation. */
    rawValues?: RawValueMap;
    /** Server-side validation errors to merge into the result tree. */
    serverErrors?: ValidationError[];
};

function stripLeadingDot(path: string): string {
    return path.startsWith('.') ? path.slice(1) : path;
}

function matchServerErrors(formPath: string, serverErrors: ValidationError[]): ValidationResult[] {
    const stripped = stripLeadingDot(formPath);
    return serverErrors
        .filter(error => error.getPropertyPath().startsWith(stripped))
        .map(error => ({message: error.getMessage(), custom: true}));
}

function validateInput(input: Input, propertySet: PropertySet, options?: ValidateFormOptions): InputValidationNode {
    const name = input.getName();
    const path = input.getPath().toString();
    const typeName = input.getInputType().getName();
    const definition = InputTypeRegistry.getDefinition(typeName);

    if (definition == null) {
        return {type: 'input', path, name, errors: []};
    }

    const descriptor = definition.descriptor;
    const config = descriptor.readConfig(input.getInputTypeConfig() ?? {});
    const occurrences = input.getOccurrences();
    const propertyArray = propertySet.getPropertyArray(name);
    const size = propertyArray?.getSize() ?? 0;
    const rawValues = options?.rawValues?.get(name);

    const occurrenceValidation: OccurrenceValidationState[] = [];
    const errors: ValidationResult[][] = [];

    for (let i = 0; i < Math.max(size, 1); i++) {
        const value =
            propertyArray != null && i < size ? propertyArray.getValue(i) : descriptor.getValueType().newNullValue();
        const rawValue = rawValues?.[i];
        const validationResults = descriptor.validate(value, config, rawValue);
        const breaksRequired = descriptor.valueBreaksRequired(value);
        occurrenceValidation.push({index: i, breaksRequired, validationResults});
        errors.push(validationResults);
    }

    // Append server errors
    const serverErrors = options?.serverErrors;
    if (serverErrors != null && serverErrors.length > 0) {
        const matched = matchServerErrors(path, serverErrors);
        if (matched.length > 0) {
            // Attach server errors to the first occurrence
            errors[0] = [...(errors[0] ?? []), ...matched];
        }
    }

    const totalValid = occurrenceValidation.filter(
        ov => !ov.breaksRequired && ov.validationResults.length === 0,
    ).length;

    let occurrenceError: string | undefined;

    const hasFieldErrors = occurrenceValidation.some(entry => entry.validationResults.length > 0);
    if (!hasFieldErrors) {
        const min = occurrences.getMinimum();
        const max = occurrences.getMaximum();

        if (occurrences.minimumBreached(totalValid)) {
            occurrenceError = min >= 1 && max !== 1 ? `field.occurrence.breaks.min:${min}` : 'field.value.required';
        } else if (occurrences.maximumBreached(totalValid)) {
            occurrenceError = max > 1 ? `field.occurrence.breaks.max.many:${max}` : 'field.occurrence.breaks.max.one';
        }
    }

    return {type: 'input', path, name, errors, occurrenceError};
}

function safeGetPath(item: {getName(): string; getPath(): {toString(): string}}): string {
    const name = item.getName();
    if (name.length === 0) {
        return '';
    }
    return item.getPath().toString();
}

function validateFieldSet(
    fieldSet: FieldSet,
    propertySet: PropertySet,
    options?: ValidateFormOptions,
): FieldSetValidationNode {
    const children = validateFormItems(fieldSet.getFormItems(), propertySet, options);
    const isValid = children.every(child => {
        if (child.type === 'skipped') return true;
        if (child.type === 'input') return child.errors.every(e => e.length === 0) && child.occurrenceError == null;
        if (child.type === 'fieldset') return child.isValid !== false;
        return true;
    });

    return {
        type: 'fieldset',
        path: safeGetPath(fieldSet),
        name: fieldSet.getName(),
        children,
        isValid,
    };
}

function validateFormItems(
    items: import('../../form/FormItem').FormItem[],
    propertySet: PropertySet,
    options?: ValidateFormOptions,
): FormValidationNode[] {
    return items.map(item => {
        if (ObjectHelper.iFrameSafeInstanceOf(item, Input)) {
            return validateInput(item as Input, propertySet, options);
        }

        if (ObjectHelper.iFrameSafeInstanceOf(item, FieldSet)) {
            return validateFieldSet(item as FieldSet, propertySet, options);
        }

        if (
            ObjectHelper.iFrameSafeInstanceOf(item, FormItemSet) ||
            ObjectHelper.iFrameSafeInstanceOf(item, FormOptionSet)
        ) {
            return {
                type: 'skipped',
                path: safeGetPath(item),
                name: item.getName(),
            } satisfies SkippedValidationNode;
        }

        return {
            type: 'skipped',
            path: safeGetPath(item),
            name: item.getName(),
        } satisfies SkippedValidationNode;
    });
}

/**
 * Validate an entire form against its property data.
 *
 * Walks the form schema tree, validates each Input via its registered
 * descriptor, recurses into FieldSets, and skips FormItemSet/FormOptionSet
 * (returned as `SkippedValidationNode` for future phases).
 *
 * Unregistered input types produce a valid node with empty errors.
 */
export function validateForm(
    form: Form,
    propertySet: PropertySet,
    options?: ValidateFormOptions,
): FormValidationResult {
    const children = validateFormItems(form.getFormItems(), propertySet, options);
    const isValid = children.every(child => {
        if (child.type === 'skipped') return true;
        if (child.type === 'input') return child.errors.every(e => e.length === 0) && child.occurrenceError == null;
        if (child.type === 'fieldset') return child.isValid !== false;
        return true;
    });

    return {isValid, children};
}
