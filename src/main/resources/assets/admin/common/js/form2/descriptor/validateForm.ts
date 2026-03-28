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
    ItemSetValidationNode,
    OptionSetValidationNode,
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

function isNodeValid(child: FormValidationNode): boolean {
    switch (child.type) {
        case 'skipped':
            return true;
        case 'input':
            return child.errors.every(e => e.length === 0) && child.occurrenceError == null;
        case 'fieldset':
            return child.isValid !== false;
        case 'itemset':
            return child.occurrenceError == null && child.occurrences.every(o => o.isValid !== false);
        case 'optionset':
            return (
                child.occurrenceError == null &&
                child.occurrences.every(o => o.multiselectionError == null && o.isValid !== false)
            );
    }
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
    const isValid = children.every(isNodeValid);

    return {
        type: 'fieldset',
        path: safeGetPath(fieldSet),
        name: fieldSet.getName(),
        children,
        isValid,
    };
}

function validateItemSet(
    itemSet: FormItemSet,
    propertySet: PropertySet,
    options?: ValidateFormOptions,
): ItemSetValidationNode {
    const name = itemSet.getName();
    const path = safeGetPath(itemSet);
    const array = propertySet.getPropertyArray(name);
    const size = array?.getSize() ?? 0;

    // TODO: rawValues are keyed by input name, will collide for nested inputs
    // with the same name. CS must scope rawValues per-occurrence in Phase 4.

    const occurrences: ItemSetValidationNode['occurrences'] = [];

    for (let i = 0; i < size; i++) {
        const occurrenceSet = array?.getSet(i);
        const children = validateFormItems(
            itemSet.getFormItems(),
            occurrenceSet ?? propertySet.getTree().newPropertySet(),
            options,
        );
        occurrences.push({children, isValid: children.every(isNodeValid)});
    }

    const validCount = occurrences.filter(o => o.isValid !== false).length;
    let occurrenceError: string | undefined;

    if (itemSet.getOccurrences().minimumBreached(validCount)) {
        const min = itemSet.getOccurrences().getMinimum();
        occurrenceError = `set.occurrence.breaks.min:${min}`;
    } else if (itemSet.getOccurrences().maximumBreached(validCount)) {
        const max = itemSet.getOccurrences().getMaximum();
        occurrenceError = `set.occurrence.breaks.max:${max}`;
    }

    // TODO: propagate serverErrors into nested set occurrences (Phase 8)

    return {type: 'itemset', path, name, occurrenceError, occurrences};
}

function validateOptionSet(
    optionSet: FormOptionSet,
    propertySet: PropertySet,
    options?: ValidateFormOptions,
): OptionSetValidationNode {
    const name = optionSet.getName();
    const path = safeGetPath(optionSet);
    const array = propertySet.getPropertyArray(name);
    const size = array?.getSize() ?? 0;
    const multiselection = optionSet.getMultiselection();
    const schemaOptionNames = optionSet.getOptions().map(o => o.getName());

    const occurrences: OptionSetValidationNode['occurrences'] = [];

    for (let i = 0; i < size; i++) {
        const occurrenceSet = array?.getSet(i);
        if (occurrenceSet == null) {
            occurrences.push({children: [], multiselectionError: undefined, isValid: true});
            continue;
        }

        // Read _selected array — STRING values of selected option names
        const selectedArray = occurrenceSet.getPropertyArray('_selected');
        const selectedNames =
            selectedArray != null
                ? selectedArray
                      .getProperties()
                      .map(p => p.getValue().getString())
                      .filter((n): n is string => n != null && schemaOptionNames.includes(n))
                : [];

        // Multiselection validation
        let multiselectionError: string | undefined;
        if (multiselection.minimumBreached(selectedNames.length)) {
            multiselectionError = `optionset.multiselection.breaks.min:${multiselection.getMinimum()}`;
        } else if (multiselection.maximumBreached(selectedNames.length)) {
            multiselectionError = `optionset.multiselection.breaks.max:${multiselection.getMaximum()}`;
        }

        // Validate children of selected options
        const allChildren: FormValidationNode[] = [];
        for (const selectedName of selectedNames) {
            const option = optionSet.getOptions().find(o => o.getName() === selectedName);
            if (option == null || option.getFormItems().length === 0) continue;

            const optionDataSet = occurrenceSet.getPropertyArray(selectedName)?.getSet(0);
            const children = validateFormItems(
                option.getFormItems(),
                optionDataSet ?? occurrenceSet.getTree().newPropertySet(),
                options,
            );
            allChildren.push(...children);
        }

        const isValid = multiselectionError == null && allChildren.every(isNodeValid);
        occurrences.push({children: allChildren, multiselectionError, isValid});
    }

    const validCount = occurrences.filter(o => o.isValid !== false).length;
    let occurrenceError: string | undefined;

    if (optionSet.getOccurrences().minimumBreached(validCount)) {
        const min = optionSet.getOccurrences().getMinimum();
        occurrenceError = `set.occurrence.breaks.min:${min}`;
    } else if (optionSet.getOccurrences().maximumBreached(validCount)) {
        const max = optionSet.getOccurrences().getMaximum();
        occurrenceError = `set.occurrence.breaks.max:${max}`;
    }

    return {type: 'optionset', path, name, occurrenceError, occurrences};
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

        if (ObjectHelper.iFrameSafeInstanceOf(item, FormItemSet)) {
            return validateItemSet(item as FormItemSet, propertySet, options);
        }

        if (ObjectHelper.iFrameSafeInstanceOf(item, FormOptionSet)) {
            return validateOptionSet(item as FormOptionSet, propertySet, options);
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
 * descriptor, and recurses into FieldSets, FormItemSets, and FormOptionSets.
 *
 * Unregistered input types produce a valid node with empty errors.
 */
export function validateForm(
    form: Form,
    propertySet: PropertySet,
    options?: ValidateFormOptions,
): FormValidationResult {
    const children = validateFormItems(form.getFormItems(), propertySet, options);
    const isValid = children.every(isNodeValid);

    return {isValid, children};
}
