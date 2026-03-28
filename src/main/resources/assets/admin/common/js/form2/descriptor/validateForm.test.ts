import {beforeEach, describe, expect, it, vi} from 'vitest';
import {PropertyTree} from '../../data/PropertyTree';
import type {Value} from '../../data/Value';
import {ValueTypes} from '../../data/ValueTypes';
import {FormBuilder} from '../../form/Form';
import {Input, InputBuilder} from '../../form/Input';
import {InputTypeName} from '../../form/InputTypeName';
import {Occurrences} from '../../form/Occurrences';
import {FieldSet} from '../../form/set/fieldset/FieldSet';
import {FormItemSet} from '../../form/set/itemset/FormItemSet';
import {FormOptionSet} from '../../form/set/optionset/FormOptionSet';
import {FormOptionSetOption} from '../../form/set/optionset/FormOptionSetOption';
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

const inputFactory = {
    createFormItem: (json: Record<string, unknown>) => {
        if (json.Input) {
            return Input.fromJson(json.Input as Parameters<typeof Input.fromJson>[0]);
        }
        return null as never;
    },
};

const optionSetFactory = {
    createFormItem: (json: Record<string, unknown>) => {
        if (json.Input) {
            return Input.fromJson(json.Input as Parameters<typeof Input.fromJson>[0]);
        }
        if (json.FormOptionSetOption) {
            return new FormOptionSetOption(
                json.FormOptionSetOption as ConstructorParameters<typeof FormOptionSetOption>[0],
                optionSetFactory,
            );
        }
        return null as never;
    },
};

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

    it('returns ItemSetValidationNode for FormItemSet with 0 occurrences (min=0)', () => {
        const formItemSet = new FormItemSet(
            {name: 'itemSet', label: 'Items', occurrences: {minimum: 0, maximum: 0}, helpText: '', items: []},
            noopFactory,
        );

        const form = new FormBuilder().addFormItem(formItemSet).build();
        const propertySet = new PropertyTree().getRoot();

        const result = validateForm(form, propertySet);

        expect(result.isValid).toBe(true);
        expect(result.children).toHaveLength(1);
        const node = result.children[0];
        expect(node.type).toBe('itemset');
        expect(node.name).toBe('itemSet');
        if (node.type === 'itemset') {
            expect(node.occurrences).toEqual([]);
            expect(node.occurrenceError).toBeUndefined();
        }
    });

    it('returns occurrenceError for FormItemSet with 0 occurrences when min=1', () => {
        const formItemSet = new FormItemSet(
            {name: 'itemSet', label: 'Items', occurrences: {minimum: 1, maximum: 0}, helpText: '', items: []},
            noopFactory,
        );

        const form = new FormBuilder().addFormItem(formItemSet).build();
        const propertySet = new PropertyTree().getRoot();

        const result = validateForm(form, propertySet);

        expect(result.isValid).toBe(false);
        const node = result.children[0];
        expect(node.type).toBe('itemset');
        if (node.type === 'itemset') {
            expect(node.occurrenceError).toBe('set.occurrence.breaks.min:1');
            expect(node.occurrences).toEqual([]);
        }
    });

    it('validates FormItemSet with 1 valid occurrence', () => {
        const formItemSet = new FormItemSet(
            {
                name: 'mySet',
                label: 'My Set',
                occurrences: {minimum: 0, maximum: 0},
                helpText: '',
                items: [
                    {
                        Input: {
                            name: 'title',
                            inputType: 'TestType',
                            label: 'Title',
                            occurrences: {minimum: 0, maximum: 1},
                            config: {},
                            helpText: '',
                        },
                    },
                ],
            },
            inputFactory,
        );

        const form = new FormBuilder().addFormItem(formItemSet).build();
        const tree = new PropertyTree();
        const setData = tree.getRoot().addPropertySet('mySet');
        setData.addProperty('title', ValueTypes.STRING.newValue('Hello'));

        const result = validateForm(form, tree.getRoot());

        expect(result.isValid).toBe(true);
        const node = result.children[0];
        expect(node.type).toBe('itemset');
        if (node.type === 'itemset') {
            expect(node.occurrences).toHaveLength(1);
            expect(node.occurrences[0].isValid).toBe(true);
            expect(node.occurrences[0].children).toHaveLength(1);
            expect(node.occurrences[0].children[0].type).toBe('input');
        }
    });

    it('validates FormItemSet with 1 invalid occurrence (required input, no value)', () => {
        mocks.getDefinition.mockReturnValue(
            makeDefinition({
                valueBreaksRequired: (value: Value) => value.isNull(),
            }),
        );

        const formItemSet = new FormItemSet(
            {
                name: 'mySet',
                label: 'My Set',
                occurrences: {minimum: 0, maximum: 0},
                helpText: '',
                items: [
                    {
                        Input: {
                            name: 'title',
                            inputType: 'TestType',
                            label: 'Title',
                            occurrences: {minimum: 1, maximum: 1},
                            config: {},
                            helpText: '',
                        },
                    },
                ],
            },
            inputFactory,
        );

        const form = new FormBuilder().addFormItem(formItemSet).build();
        const tree = new PropertyTree();
        tree.getRoot().addPropertySet('mySet');

        const result = validateForm(form, tree.getRoot());

        const node = result.children[0];
        expect(node.type).toBe('itemset');
        if (node.type === 'itemset') {
            expect(node.occurrences).toHaveLength(1);
            expect(node.occurrences[0].isValid).toBe(false);
            const inputNode = node.occurrences[0].children[0];
            if (inputNode.type === 'input') {
                expect(inputNode.occurrenceError).toBeDefined();
            }
        }
    });

    it('validates FormItemSet with 2 occurrences, one valid and one invalid', () => {
        const formItemSet = new FormItemSet(
            {
                name: 'mySet',
                label: 'My Set',
                occurrences: {minimum: 0, maximum: 0},
                helpText: '',
                items: [
                    {
                        Input: {
                            name: 'title',
                            inputType: 'TestType',
                            label: 'Title',
                            occurrences: {minimum: 1, maximum: 1},
                            config: {},
                            helpText: '',
                        },
                    },
                ],
            },
            inputFactory,
        );

        const form = new FormBuilder().addFormItem(formItemSet).build();
        const tree = new PropertyTree();
        const validSet = tree.getRoot().addPropertySet('mySet');
        validSet.addProperty('title', ValueTypes.STRING.newValue('Valid'));
        tree.getRoot().addPropertySet('mySet'); // empty — required input missing

        const result = validateForm(form, tree.getRoot());

        const node = result.children[0];
        expect(node.type).toBe('itemset');
        if (node.type === 'itemset') {
            expect(node.occurrences).toHaveLength(2);
            expect(node.occurrences[0].isValid).toBe(true);
            expect(node.occurrences[1].isValid).toBe(false);
        }
    });

    it('handles FormItemSet with null PropertyArray (same as empty)', () => {
        const formItemSet = new FormItemSet(
            {
                name: 'missing',
                label: 'Missing',
                occurrences: {minimum: 0, maximum: 0},
                helpText: '',
                items: [
                    {
                        Input: {
                            name: 'title',
                            inputType: 'TestType',
                            label: 'Title',
                            occurrences: {minimum: 0, maximum: 1},
                            config: {},
                            helpText: '',
                        },
                    },
                ],
            },
            inputFactory,
        );

        const form = new FormBuilder().addFormItem(formItemSet).build();
        const propertySet = new PropertyTree().getRoot();

        const result = validateForm(form, propertySet);

        const node = result.children[0];
        expect(node.type).toBe('itemset');
        if (node.type === 'itemset') {
            expect(node.occurrences).toHaveLength(0);
            expect(node.occurrenceError).toBeUndefined();
        }
    });

    it('FieldSet isValid reflects nested ItemSet validity', () => {
        const formItemSet = new FormItemSet(
            {
                name: 'mySet',
                label: 'My Set',
                occurrences: {minimum: 1, maximum: 0},
                helpText: '',
                items: [],
            },
            noopFactory,
        );

        const fieldSet = new FieldSet({name: 'fs', label: 'FS', items: []}, noopFactory);
        fieldSet.addFormItem(formItemSet);

        const form = new FormBuilder().addFormItem(fieldSet).build();
        const propertySet = new PropertyTree().getRoot();

        const result = validateForm(form, propertySet);

        expect(result.isValid).toBe(false);
        const fsNode = result.children[0];
        expect(fsNode.type).toBe('fieldset');
        if (fsNode.type === 'fieldset') {
            expect(fsNode.isValid).toBe(false);
            expect(fsNode.children).toHaveLength(1);
            expect(fsNode.children[0].type).toBe('itemset');
        }
    });

    it('validates mixed form with Input and ItemSet', () => {
        const input = makeInput('standalone', 0, 1);
        const formItemSet = new FormItemSet(
            {
                name: 'mySet',
                label: 'My Set',
                occurrences: {minimum: 0, maximum: 0},
                helpText: '',
                items: [
                    {
                        Input: {
                            name: 'nested',
                            inputType: 'TestType',
                            label: 'Nested',
                            occurrences: {minimum: 0, maximum: 1},
                            config: {},
                            helpText: '',
                        },
                    },
                ],
            },
            inputFactory,
        );

        const form = new FormBuilder().addFormItem(input).addFormItem(formItemSet).build();
        const tree = new PropertyTree();
        tree.getRoot().addProperty('standalone', ValueTypes.STRING.newValue('val'));
        const setData = tree.getRoot().addPropertySet('mySet');
        setData.addProperty('nested', ValueTypes.STRING.newValue('inner'));

        const result = validateForm(form, tree.getRoot());

        expect(result.isValid).toBe(true);
        expect(result.children).toHaveLength(2);
        expect(result.children[0].type).toBe('input');
        expect(result.children[1].type).toBe('itemset');
        if (result.children[1].type === 'itemset') {
            expect(result.children[1].occurrences).toHaveLength(1);
            expect(result.children[1].occurrences[0].isValid).toBe(true);
        }
    });

    it('returns OptionSetValidationNode for FormOptionSet', () => {
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
        expect(result.children[0].type).toBe('optionset');
        expect(result.children[0].name).toBe('optionSet');
    });

    it('OptionSet with 0 occurrences, min=0 is valid', () => {
        const formOptionSet = new FormOptionSet(
            {
                name: 'myOptions',
                label: 'Options',
                occurrences: {minimum: 0, maximum: 0},
                helpText: '',
                expanded: false,
                multiselection: {minimum: 1, maximum: 1},
                options: [],
            },
            noopFactory,
        );

        const form = new FormBuilder().addFormItem(formOptionSet).build();
        const propertySet = new PropertyTree().getRoot();

        const result = validateForm(form, propertySet);

        expect(result.isValid).toBe(true);
        const node = result.children[0];
        expect(node.type).toBe('optionset');
        if (node.type === 'optionset') {
            expect(node.occurrences).toEqual([]);
            expect(node.occurrenceError).toBeUndefined();
        }
    });

    it('OptionSet with 0 occurrences, min=1 has occurrenceError', () => {
        const formOptionSet = new FormOptionSet(
            {
                name: 'myOptions',
                label: 'Options',
                occurrences: {minimum: 1, maximum: 0},
                helpText: '',
                expanded: false,
                multiselection: {minimum: 1, maximum: 1},
                options: [],
            },
            noopFactory,
        );

        const form = new FormBuilder().addFormItem(formOptionSet).build();
        const propertySet = new PropertyTree().getRoot();

        const result = validateForm(form, propertySet);

        expect(result.isValid).toBe(false);
        const node = result.children[0];
        expect(node.type).toBe('optionset');
        if (node.type === 'optionset') {
            expect(node.occurrenceError).toBe('set.occurrence.breaks.min:1');
            expect(node.occurrences).toEqual([]);
        }
    });

    it('OptionSet with 1 occurrence, no selection, multiselection min=1 has multiselectionError', () => {
        const formOptionSet = new FormOptionSet(
            {
                name: 'myOptions',
                label: 'Options',
                occurrences: {minimum: 0, maximum: 0},
                helpText: '',
                expanded: false,
                multiselection: {minimum: 1, maximum: 1},
                options: [{name: 'optionA', label: 'Option A', defaultOption: false, helpText: ''}],
            },
            optionSetFactory,
        );

        const form = new FormBuilder().addFormItem(formOptionSet).build();
        const tree = new PropertyTree();
        tree.getRoot().addPropertySet('myOptions'); // empty occurrence, no _selected

        const result = validateForm(form, tree.getRoot());

        const node = result.children[0];
        expect(node.type).toBe('optionset');
        if (node.type === 'optionset') {
            expect(node.occurrences).toHaveLength(1);
            expect(node.occurrences[0].multiselectionError).toBe('optionset.multiselection.breaks.min:1');
            expect(node.occurrences[0].isValid).toBe(false);
        }
    });

    it('OptionSet with 1 occurrence, 1 valid selection is valid', () => {
        const formOptionSet = new FormOptionSet(
            {
                name: 'myOptions',
                label: 'Options',
                occurrences: {minimum: 0, maximum: 0},
                helpText: '',
                expanded: false,
                multiselection: {minimum: 1, maximum: 1},
                options: [{name: 'optionA', label: 'Option A', defaultOption: false, helpText: ''}],
            },
            optionSetFactory,
        );

        const form = new FormBuilder().addFormItem(formOptionSet).build();
        const tree = new PropertyTree();
        const occurrenceSet = tree.getRoot().addPropertySet('myOptions');
        occurrenceSet.addProperty('_selected', ValueTypes.STRING.newValue('optionA'));

        const result = validateForm(form, tree.getRoot());

        expect(result.isValid).toBe(true);
        const node = result.children[0];
        expect(node.type).toBe('optionset');
        if (node.type === 'optionset') {
            expect(node.occurrences).toHaveLength(1);
            expect(node.occurrences[0].multiselectionError).toBeUndefined();
            expect(node.occurrences[0].isValid).toBe(true);
        }
    });

    it('OptionSet with 1 occurrence, 1 selection with invalid required child is invalid', () => {
        mocks.getDefinition.mockReturnValue(
            makeDefinition({
                valueBreaksRequired: (value: Value) => value.isNull(),
            }),
        );

        const formOptionSet = new FormOptionSet(
            {
                name: 'myOptions',
                label: 'Options',
                occurrences: {minimum: 0, maximum: 0},
                helpText: '',
                expanded: false,
                multiselection: {minimum: 1, maximum: 1},
                options: [
                    {
                        name: 'optionA',
                        label: 'Option A',
                        defaultOption: false,
                        helpText: '',
                        items: [
                            {
                                Input: {
                                    name: 'title',
                                    inputType: 'TestType',
                                    label: 'Title',
                                    occurrences: {minimum: 1, maximum: 1},
                                    config: {},
                                    helpText: '',
                                },
                            },
                        ],
                    },
                ],
            },
            optionSetFactory,
        );

        const form = new FormBuilder().addFormItem(formOptionSet).build();
        const tree = new PropertyTree();
        const occurrenceSet = tree.getRoot().addPropertySet('myOptions');
        occurrenceSet.addProperty('_selected', ValueTypes.STRING.newValue('optionA'));
        // Add optionA data set but leave title empty (required input missing)
        occurrenceSet.addPropertySet('optionA');

        const result = validateForm(form, tree.getRoot());

        const node = result.children[0];
        expect(node.type).toBe('optionset');
        if (node.type === 'optionset') {
            expect(node.occurrences).toHaveLength(1);
            expect(node.occurrences[0].multiselectionError).toBeUndefined();
            expect(node.occurrences[0].isValid).toBe(false);
            expect(node.occurrences[0].children).toHaveLength(1);
            expect(node.occurrences[0].children[0].type).toBe('input');
        }
    });

    it('OptionSet radio (multiselection min=1, max=1) requires exactly 1 selection', () => {
        const formOptionSet = new FormOptionSet(
            {
                name: 'myOptions',
                label: 'Options',
                occurrences: {minimum: 0, maximum: 0},
                helpText: '',
                expanded: false,
                multiselection: {minimum: 1, maximum: 1},
                options: [
                    {name: 'optionA', label: 'Option A', defaultOption: false, helpText: ''},
                    {name: 'optionB', label: 'Option B', defaultOption: false, helpText: ''},
                ],
            },
            optionSetFactory,
        );

        const form = new FormBuilder().addFormItem(formOptionSet).build();

        // 0 selections — breaches min
        const tree0 = new PropertyTree();
        tree0.getRoot().addPropertySet('myOptions');
        const result0 = validateForm(form, tree0.getRoot());
        const node0 = result0.children[0];
        if (node0.type === 'optionset') {
            expect(node0.occurrences[0].multiselectionError).toBe('optionset.multiselection.breaks.min:1');
        }

        // 1 selection — valid
        const tree1 = new PropertyTree();
        const occ1 = tree1.getRoot().addPropertySet('myOptions');
        occ1.addProperty('_selected', ValueTypes.STRING.newValue('optionA'));
        const result1 = validateForm(form, tree1.getRoot());
        const node1 = result1.children[0];
        if (node1.type === 'optionset') {
            expect(node1.occurrences[0].multiselectionError).toBeUndefined();
        }

        // 2 selections — breaches max
        const tree2 = new PropertyTree();
        const occ2 = tree2.getRoot().addPropertySet('myOptions');
        occ2.addProperty('_selected', ValueTypes.STRING.newValue('optionA'));
        occ2.addProperty('_selected', ValueTypes.STRING.newValue('optionB'));
        const result2 = validateForm(form, tree2.getRoot());
        const node2 = result2.children[0];
        if (node2.type === 'optionset') {
            expect(node2.occurrences[0].multiselectionError).toBe('optionset.multiselection.breaks.max:1');
        }
    });

    it('OptionSet stale _selected name not in schema is filtered out', () => {
        const formOptionSet = new FormOptionSet(
            {
                name: 'myOptions',
                label: 'Options',
                occurrences: {minimum: 0, maximum: 0},
                helpText: '',
                expanded: false,
                multiselection: {minimum: 1, maximum: 1},
                options: [{name: 'optionA', label: 'Option A', defaultOption: false, helpText: ''}],
            },
            optionSetFactory,
        );

        const form = new FormBuilder().addFormItem(formOptionSet).build();
        const tree = new PropertyTree();
        const occurrenceSet = tree.getRoot().addPropertySet('myOptions');
        // _selected contains a name not in the schema options
        occurrenceSet.addProperty('_selected', ValueTypes.STRING.newValue('nonExistent'));

        const result = validateForm(form, tree.getRoot());

        const node = result.children[0];
        expect(node.type).toBe('optionset');
        if (node.type === 'optionset') {
            // "nonExistent" is filtered out, so 0 selected → min breached
            expect(node.occurrences[0].multiselectionError).toBe('optionset.multiselection.breaks.min:1');
        }
    });

    it('OptionSet null _selected array counts as 0 selections', () => {
        const formOptionSet = new FormOptionSet(
            {
                name: 'myOptions',
                label: 'Options',
                occurrences: {minimum: 0, maximum: 0},
                helpText: '',
                expanded: false,
                multiselection: {minimum: 1, maximum: 1},
                options: [{name: 'optionA', label: 'Option A', defaultOption: false, helpText: ''}],
            },
            optionSetFactory,
        );

        const form = new FormBuilder().addFormItem(formOptionSet).build();
        const tree = new PropertyTree();
        // Add occurrence set but no _selected property at all
        tree.getRoot().addPropertySet('myOptions');

        const result = validateForm(form, tree.getRoot());

        const node = result.children[0];
        expect(node.type).toBe('optionset');
        if (node.type === 'optionset') {
            expect(node.occurrences[0].multiselectionError).toBe('optionset.multiselection.breaks.min:1');
        }
    });

    it('OptionSet 2 occurrences with different selection states have independent multiselectionError', () => {
        const formOptionSet = new FormOptionSet(
            {
                name: 'myOptions',
                label: 'Options',
                occurrences: {minimum: 0, maximum: 0},
                helpText: '',
                expanded: false,
                multiselection: {minimum: 1, maximum: 1},
                options: [
                    {name: 'optionA', label: 'Option A', defaultOption: false, helpText: ''},
                    {name: 'optionB', label: 'Option B', defaultOption: false, helpText: ''},
                ],
            },
            optionSetFactory,
        );

        const form = new FormBuilder().addFormItem(formOptionSet).build();
        const tree = new PropertyTree();

        // First occurrence: 1 valid selection
        const occ1 = tree.getRoot().addPropertySet('myOptions');
        occ1.addProperty('_selected', ValueTypes.STRING.newValue('optionA'));

        // Second occurrence: 0 selections (min breached)
        tree.getRoot().addPropertySet('myOptions');

        const result = validateForm(form, tree.getRoot());

        const node = result.children[0];
        expect(node.type).toBe('optionset');
        if (node.type === 'optionset') {
            expect(node.occurrences).toHaveLength(2);
            expect(node.occurrences[0].multiselectionError).toBeUndefined();
            expect(node.occurrences[0].isValid).toBe(true);
            expect(node.occurrences[1].multiselectionError).toBe('optionset.multiselection.breaks.min:1');
            expect(node.occurrences[1].isValid).toBe(false);
        }
    });

    it('validates mixed form with Input, ItemSet, and OptionSet', () => {
        const input = makeInput('standalone', 0, 1);
        const formItemSet = new FormItemSet(
            {
                name: 'mySet',
                label: 'My Set',
                occurrences: {minimum: 0, maximum: 0},
                helpText: '',
                items: [
                    {
                        Input: {
                            name: 'nested',
                            inputType: 'TestType',
                            label: 'Nested',
                            occurrences: {minimum: 0, maximum: 1},
                            config: {},
                            helpText: '',
                        },
                    },
                ],
            },
            inputFactory,
        );
        const formOptionSet = new FormOptionSet(
            {
                name: 'myOptions',
                label: 'Options',
                occurrences: {minimum: 0, maximum: 0},
                helpText: '',
                expanded: false,
                multiselection: {minimum: 1, maximum: 1},
                options: [{name: 'optionA', label: 'Option A', defaultOption: false, helpText: ''}],
            },
            optionSetFactory,
        );

        const form = new FormBuilder().addFormItem(input).addFormItem(formItemSet).addFormItem(formOptionSet).build();
        const tree = new PropertyTree();
        tree.getRoot().addProperty('standalone', ValueTypes.STRING.newValue('val'));
        const setData = tree.getRoot().addPropertySet('mySet');
        setData.addProperty('nested', ValueTypes.STRING.newValue('inner'));
        const optData = tree.getRoot().addPropertySet('myOptions');
        optData.addProperty('_selected', ValueTypes.STRING.newValue('optionA'));

        const result = validateForm(form, tree.getRoot());

        expect(result.isValid).toBe(true);
        expect(result.children).toHaveLength(3);
        expect(result.children[0].type).toBe('input');
        expect(result.children[1].type).toBe('itemset');
        expect(result.children[2].type).toBe('optionset');
        if (result.children[2].type === 'optionset') {
            expect(result.children[2].occurrences).toHaveLength(1);
            expect(result.children[2].occurrences[0].isValid).toBe(true);
        }
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
