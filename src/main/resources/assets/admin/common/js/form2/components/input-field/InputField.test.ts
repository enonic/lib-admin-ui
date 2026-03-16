import {beforeEach, describe, expect, it, vi} from 'vitest';
import {PropertyTree} from '../../../data/PropertyTree';
import type {Value} from '../../../data/Value';
import {ValueTypes} from '../../../data/ValueTypes';
import {InputBuilder} from '../../../form/Input';
import {InputTypeName} from '../../../form/InputTypeName';
import {Occurrences} from '../../../form/Occurrences';
import type {InputTypeComponent, SelfManagedInputTypeComponent} from '../../types';
import {InputField, InputFieldResolved} from './InputField';

const mocks = vi.hoisted(() => ({
    getDefinition: vi.fn(),
    useMemo: vi.fn((factory: () => unknown) => factory()),
    useEffect: vi.fn(),
    useCallback: vi.fn((callback: unknown) => callback),
    usePropertyArray: vi.fn(),
    useOccurrenceManager: vi.fn(),
    occurrenceListRoot: vi.fn(() => null),
    unsupportedInput: vi.fn(() => null),
}));

vi.mock('react', () => ({
    useMemo: mocks.useMemo,
    useEffect: mocks.useEffect,
    useCallback: mocks.useCallback,
}));

vi.mock('../../registry/InputTypeRegistry', () => ({
    InputTypeRegistry: {
        getDefinition: mocks.getDefinition,
    },
}));

vi.mock('../../hooks/usePropertyArray', () => ({
    usePropertyArray: mocks.usePropertyArray,
}));

vi.mock('../../hooks/useOccurrenceManager', () => ({
    useOccurrenceManager: mocks.useOccurrenceManager,
}));

vi.mock('../occurrence-list', () => ({
    OccurrenceList: {
        Root: mocks.occurrenceListRoot,
    },
}));

vi.mock('../unsupported-input', () => ({
    UnsupportedInput: mocks.unsupportedInput,
}));

function makeInput(typeName: string) {
    return new InputBuilder()
        .setName('testField')
        .setInputType(new InputTypeName(typeName, false))
        .setLabel('Test')
        .setOccurrences(Occurrences.minmax(0, 1))
        .setHelpText('')
        .setInputTypeConfig({})
        .build();
}

function makeDescriptor() {
    return {
        name: 'TestType',
        getValueType: () => ValueTypes.STRING,
        readConfig: vi.fn(() => ({})),
        createDefaultValue: () => ValueTypes.STRING.newNullValue(),
        validate: () => [],
        valueBreaksRequired: (value: Value) => value.isNull(),
    };
}

function makeManagerState(value = ValueTypes.STRING.newValue('hello')) {
    return {
        ids: ['occurrence-0'],
        values: [value],
        occurrenceValidation: [{index: 0, breaksRequired: false, validationResults: []}],
        totalValid: 1,
        isMinimumBreached: false,
        isMaximumBreached: false,
        isValid: true,
        canAdd: true,
        canRemove: false,
    };
}

function getOnlyChild(element: {props: {children: unknown}}): {type: unknown; props: Record<string, any>} {
    return element.props.children as {type: unknown; props: Record<string, any>};
}

describe('InputField', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.usePropertyArray.mockReturnValue({values: [], size: 0});
        mocks.useOccurrenceManager.mockReturnValue({
            state: makeManagerState(),
            add: vi.fn(() => true),
            remove: vi.fn(() => true),
            move: vi.fn(() => true),
            set: vi.fn(),
            sync: vi.fn(),
        });
    });

    it('renders UnsupportedInput when definition is missing', () => {
        const input = makeInput('Unknown');
        const propertySet = new PropertyTree().getRoot();
        mocks.getDefinition.mockReturnValue(undefined);

        const element = InputField({input, propertySet, enabled: true});
        const child = getOnlyChild(element);

        expect(child.type).toBe(mocks.unsupportedInput);
        expect(child.props.input).toBe(input);
    });

    it('renders a single component directly for single mode', () => {
        const component: InputTypeComponent = () => null;
        const descriptor = makeDescriptor();
        const definition = {mode: 'single' as const, descriptor, component};
        const input = makeInput('Checkbox');
        const propertySet = new PropertyTree().getRoot();
        const state = makeManagerState(ValueTypes.STRING.newValue('single'));
        mocks.useOccurrenceManager.mockReturnValue({
            state,
            add: vi.fn(() => true),
            remove: vi.fn(() => true),
            move: vi.fn(() => true),
            set: vi.fn(),
            sync: vi.fn(),
        });

        const element = InputFieldResolved({input, propertySet, enabled: true, definition});
        const child = getOnlyChild(element);

        expect(child.type).toBe(component);
        expect(child.props.value).toBe(state.values[0]);
        expect(child.props.errors).toEqual([]);
    });

    it('renders OccurrenceList.Root for list mode', () => {
        const component: InputTypeComponent = () => null;
        const descriptor = makeDescriptor();
        const definition = {mode: 'list' as const, descriptor, component};
        const input = makeInput('TextLine');
        const propertySet = new PropertyTree().getRoot();

        const element = InputFieldResolved({input, propertySet, enabled: true, definition});
        const child = getOnlyChild(element);

        expect(child.type).toBe(mocks.occurrenceListRoot);
        expect(child.props.Component).toBe(component);
    });

    it('renders internal components with onMove and disables auto-seeding', () => {
        const component: SelfManagedInputTypeComponent = () => null;
        const descriptor = makeDescriptor();
        const definition = {mode: 'internal' as const, descriptor, component};
        const input = makeInput('PrincipalSelector');
        const propertySet = new PropertyTree().getRoot();
        const move = vi.fn(() => false);
        mocks.useOccurrenceManager.mockReturnValue({
            state: {...makeManagerState(), values: [], occurrenceValidation: []},
            add: vi.fn(() => true),
            remove: vi.fn(() => true),
            move,
            set: vi.fn(),
            sync: vi.fn(),
        });

        const element = InputFieldResolved({input, propertySet, enabled: true, definition});
        const child = getOnlyChild(element);

        expect(child.type).toBe(component);
        expect(mocks.occurrenceListRoot).not.toHaveBeenCalled();
        expect(mocks.useOccurrenceManager).toHaveBeenCalledWith(
            expect.objectContaining({
                autoSeed: false,
            }),
        );

        child.props.onMove(0, 1);
        expect(move).toHaveBeenCalledWith(0, 1);
    });
});
