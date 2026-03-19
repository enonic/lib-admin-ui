import {beforeEach, describe, expect, it, vi} from 'vitest';
import {PropertyTree} from '../../data/PropertyTree';
import type {Value} from '../../data/Value';
import {ValueTypes} from '../../data/ValueTypes';
import {FormBuilder} from '../../form/Form';
import {InputBuilder} from '../../form/Input';
import {InputTypeName} from '../../form/InputTypeName';
import {Occurrences} from '../../form/Occurrences';
import {FieldSet} from '../../form/set/fieldset/FieldSet';
import {FormItemSet} from '../../form/set/itemset/FormItemSet';
import {FormOptionSet} from '../../form/set/optionset/FormOptionSet';
import {ValidationError} from '../../ValidationError';
import type {InputTypeDefinition} from '../types';
import type {InputTypeDescriptor} from './InputTypeDescriptor';
import {validateForm} from './validateForm';

const mocks = vi.hoisted(() => ({
    getDefinition: vi.fn(),
}));

vi.mock('../registry/InputTypeRegistry', () => ({
    InputTypeRegistry: {
        getDefinition: mocks.getDefinition,
    },
}));

function makeDescriptor(overrides: Partial<InputTypeDescriptor> = {}): InputTypeDescriptor {
    return {
        name: 'TestType',
        getValueType: () => ValueTypes.STRING,
        readConfig: () => ({}),
        createDefaultValue: () => ValueTypes.STRING.newNullValue(),
        validate: () => [],
        valueBreaksRequired: (value: Value) => value.isNull(),
        ...overrides,
    };
}

function makeDefinition(overrides: Partial<InputTypeDescriptor> = {}): InputTypeDefinition {
    return {mode: 'list', descriptor: makeDescriptor(overrides)};
}

function makeInput(name: string, min = 0, max = 1) {
    return new InputBuilder()
        .setName(name)
        .setInputType(new InputTypeName('TestType', false))
        .setLabel(name)
        .setOccurrences(Occurrences.minmax(min, max))
        .setHelpText('')
        .setInputTypeConfig({})
        .build();
}

const noopFactory = {createFormItem: () => null as never};

describe('validateForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.getDefinition.mockReturnValue(makeDefinition());
    });

    it('returns valid for empty form', () => {
        const form = new FormBuilder().build();
        const propertySet = new PropertyTree().getRoot();

        const result = validateForm(form, propertySet);

        expect(result.isValid).toBe(true);
        expect(result.children).toEqual([]);
    });

    it('returns valid for single valid Input', () => {
        const input = makeInput('title', 0, 1);
        const form = new FormBuilder().addFormItem(input).build();
        const tree = new PropertyTree();
        tree.getRoot().addProperty('title', ValueTypes.STRING.newValue('hello'));

        const result = validateForm(form, tree.getRoot());

        expect(result.isValid).toBe(true);
        expect(result.children).toHaveLength(1);
        expect(result.children[0].type).toBe('input');
    });

    it('returns invalid for Input with validation errors', () => {
        mocks.getDefinition.mockReturnValue(makeDefinition({validate: () => [{message: 'Invalid value'}]}));

        const input = makeInput('email', 0, 1);
        const form = new FormBuilder().addFormItem(input).build();
        const tree = new PropertyTree();
        tree.getRoot().addProperty('email', ValueTypes.STRING.newValue('bad'));

        const result = validateForm(form, tree.getRoot());

        expect(result.isValid).toBe(false);
        const node = result.children[0];
        expect(node.type).toBe('input');
        if (node.type === 'input') {
            expect(node.errors[0]).toEqual([{message: 'Invalid value'}]);
        }
    });

    it('detects minimum breach for required Input with no value', () => {
        const input = makeInput('required', 1, 1);
        const form = new FormBuilder().addFormItem(input).build();
        const propertySet = new PropertyTree().getRoot();

        const result = validateForm(form, propertySet);

        const node = result.children[0];
        expect(node.type).toBe('input');
        if (node.type === 'input') {
            expect(node.occurrenceError).toBeDefined();
        }
    });

    it('detects multiple occurrences below min', () => {
        const input = makeInput('tags', 3, 5);
        const form = new FormBuilder().addFormItem(input).build();
        const tree = new PropertyTree();
        tree.getRoot().addProperty('tags', ValueTypes.STRING.newValue('one'));
        tree.getRoot().addProperty('tags', ValueTypes.STRING.newValue('two'));

        const result = validateForm(form, tree.getRoot());

        const node = result.children[0];
        expect(node.type).toBe('input');
        if (node.type === 'input') {
            expect(node.occurrenceError).toContain('field.occurrence.breaks.min');
        }
    });

    it('validates FieldSet with mixed valid/invalid children', () => {
        const invalidDef = makeDefinition({validate: () => [{message: 'Bad'}]});
        const validDef = makeDefinition();
        // First call returns valid for 'good', second returns invalid for 'bad'
        mocks.getDefinition.mockReturnValueOnce(validDef).mockReturnValueOnce(invalidDef);

        const goodInput = makeInput('good', 0, 1);
        const badInput = makeInput('bad', 0, 1);

        const fieldSet = new FieldSet({name: 'fs', label: 'FS', items: []}, noopFactory);
        fieldSet.addFormItem(goodInput);
        fieldSet.addFormItem(badInput);

        const form = new FormBuilder().addFormItem(fieldSet).build();
        const tree = new PropertyTree();
        tree.getRoot().addProperty('good', ValueTypes.STRING.newValue('ok'));
        tree.getRoot().addProperty('bad', ValueTypes.STRING.newValue('nope'));

        const result = validateForm(form, tree.getRoot());

        expect(result.isValid).toBe(false);
        const fsNode = result.children[0];
        expect(fsNode.type).toBe('fieldset');
        if (fsNode.type === 'fieldset') {
            expect(fsNode.isValid).toBe(false);
            expect(fsNode.children).toHaveLength(2);
        }
    });

    it('returns SkippedValidationNode for FormItemSet', () => {
        const formItemSet = new FormItemSet(
            {name: 'itemSet', label: 'Items', occurrences: {minimum: 0, maximum: 0}, helpText: '', items: []},
            noopFactory,
        );

        const form = new FormBuilder().addFormItem(formItemSet).build();
        const propertySet = new PropertyTree().getRoot();

        const result = validateForm(form, propertySet);

        expect(result.children).toHaveLength(1);
        expect(result.children[0].type).toBe('skipped');
        expect(result.children[0].name).toBe('itemSet');
    });

    it('returns SkippedValidationNode for FormOptionSet', () => {
        const formOptionSet = new FormOptionSet(
            {
                name: 'optionSet',
                label: 'Options',
                occurrences: {minimum: 0, maximum: 0},
                helpText: '',
                expanded: false,
                multiselection: {minimum: 0, maximum: 1},
                options: [],
            },
            noopFactory,
        );

        const form = new FormBuilder().addFormItem(formOptionSet).build();
        const propertySet = new PropertyTree().getRoot();

        const result = validateForm(form, propertySet);

        expect(result.children).toHaveLength(1);
        expect(result.children[0].type).toBe('skipped');
        expect(result.children[0].name).toBe('optionSet');
    });

    it('attaches server errors matched by path with custom flag', () => {
        const input = makeInput('myField', 0, 1);
        const form = new FormBuilder().addFormItem(input).build();
        const tree = new PropertyTree();
        tree.getRoot().addProperty('myField', ValueTypes.STRING.newValue('val'));

        const serverError = ValidationError.create().setPropertyPath('myField').setMessage('Server says no').build();

        const result = validateForm(form, tree.getRoot(), {serverErrors: [serverError]});

        const node = result.children[0];
        if (node.type === 'input') {
            const allErrors = node.errors.flat();
            expect(allErrors).toContainEqual({message: 'Server says no', custom: true});
        }
    });

    it('does not attach server errors that do not match path', () => {
        const input = makeInput('myField', 0, 1);
        const form = new FormBuilder().addFormItem(input).build();
        const tree = new PropertyTree();
        tree.getRoot().addProperty('myField', ValueTypes.STRING.newValue('val'));

        const serverError = ValidationError.create().setPropertyPath('otherField').setMessage('Wrong field').build();

        const result = validateForm(form, tree.getRoot(), {serverErrors: [serverError]});

        const node = result.children[0];
        if (node.type === 'input') {
            const allErrors = node.errors.flat();
            expect(allErrors).not.toContainEqual(expect.objectContaining({custom: true}));
        }
    });

    it('passes rawValue to descriptor.validate via RawValueMap', () => {
        const validate = vi.fn(() => []);
        mocks.getDefinition.mockReturnValue(makeDefinition({validate}));

        const input = makeInput('raw', 0, 1);
        const form = new FormBuilder().addFormItem(input).build();
        const tree = new PropertyTree();
        tree.getRoot().addProperty('raw', ValueTypes.STRING.newValue('typed'));

        const rawValues = new Map([['raw', ['raw-text']]]);
        validateForm(form, tree.getRoot(), {rawValues});

        expect(validate).toHaveBeenCalledWith(expect.anything(), expect.anything(), 'raw-text');
    });

    it('returns valid node for unregistered input type', () => {
        mocks.getDefinition.mockReturnValue(undefined);

        const input = makeInput('unknown', 0, 1);
        const form = new FormBuilder().addFormItem(input).build();
        const propertySet = new PropertyTree().getRoot();

        const result = validateForm(form, propertySet);

        expect(result.isValid).toBe(true);
        const node = result.children[0];
        expect(node.type).toBe('input');
        if (node.type === 'input') {
            expect(node.errors).toEqual([]);
        }
    });
});
