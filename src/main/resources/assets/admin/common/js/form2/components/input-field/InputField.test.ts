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
    useState: vi.fn((initial: unknown) => [
        typeof initial === 'function' ? (initial as () => unknown)() : initial,
        vi.fn(),
    ]),
    usePropertyArray: vi.fn(),
    useOccurrenceManager: vi.fn(),
    useValidationVisibility: vi.fn((): string => 'all'),
    occurrenceListRoot: vi.fn(() => null),
    unsupportedInput: vi.fn(() => null),
}));

vi.mock('react', () => ({
    useMemo: mocks.useMemo,
    useEffect: mocks.useEffect,
    useCallback: mocks.useCallback,
    useState: mocks.useState,
}));

vi.mock('../../I18nContext', () => ({
    useI18n: vi.fn(() => (key: string) => key),
}));

vi.mock('../../ValidationContext', () => ({
    useValidationVisibility: mocks.useValidationVisibility,
}));

vi.mock('../../RawValueContext', () => ({
    useRawValueMap: vi.fn(() => undefined),
}));

vi.mock('../input-label', () => ({
    InputLabel: () => null,
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

vi.mock('../../utils/validation', () => ({
    getOccurrenceErrorMessage: vi.fn(() => undefined),
}));

vi.mock('../field-error', () => ({
    FieldError: () => null,
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

type VNode = {type: unknown; props: Record<string, any>};

function getOnlyChild(element: {props: {children: unknown}}): VNode {
    return element.props.children as VNode;
}

function getChildAt(element: {props: {children: unknown}}, index: number): VNode {
    return (element.props.children as VNode[])[index];
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
        const child = getChildAt(element, 1);

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

    it('memoizes occurrences so useOccurrenceManager receives a stable reference', () => {
        const component: InputTypeComponent = () => null;
        const descriptor = makeDescriptor();
        const definition = {mode: 'single' as const, descriptor, component};
        const input = makeInput('Checkbox');
        const propertySet = new PropertyTree().getRoot();

        // Use a real memoization mock: cache by deps identity
        const cache = new Map<string, unknown>();
        let callIndex = 0;
        mocks.useMemo.mockImplementation((...args: unknown[]) => {
            const factory = args[0] as () => unknown;
            const deps = args[1] as unknown[] | undefined;
            const key = `${callIndex++}:${JSON.stringify(deps?.map(d => (typeof d === 'object' ? 'ref' : d)))}`;
            if (!cache.has(key)) cache.set(key, factory());
            return cache.get(key);
        });

        InputFieldResolved({input, propertySet, enabled: true, definition});
        const firstOccurrences = mocks.useOccurrenceManager.mock.calls[0][0].occurrences;

        // Reset callIndex so the same memo slots are hit on "re-render"
        callIndex = 0;
        mocks.useOccurrenceManager.mockClear();
        InputFieldResolved({input, propertySet, enabled: true, definition});
        const secondOccurrences = mocks.useOccurrenceManager.mock.calls[0][0].occurrences;

        // ? getEffectiveOccurrences creates a new Occurrences for 'single' mode.
        // ? Without useMemo, this would be a different reference on each render,
        // ? causing manager/sync recreation and an infinite effect loop.
        expect(firstOccurrences).toBe(secondOccurrences);
    });

    it('hides all errors when visibility is none', () => {
        const component: InputTypeComponent = () => null;
        const descriptor = makeDescriptor();
        const definition = {mode: 'single' as const, descriptor, component};
        const input = makeInput('TextLine');
        const propertySet = new PropertyTree().getRoot();
        const state = makeManagerState();
        state.occurrenceValidation[0].validationResults = [{message: 'Error'}];
        mocks.useOccurrenceManager.mockReturnValue({
            state,
            add: vi.fn(() => true),
            remove: vi.fn(() => true),
            move: vi.fn(() => true),
            set: vi.fn(),
            sync: vi.fn(),
        });
        mocks.useValidationVisibility.mockReturnValue('none');

        const element = InputFieldResolved({input, propertySet, enabled: true, definition});
        const child = getOnlyChild(element);

        expect(child.props.errors).toEqual([]);
    });

    it('passes through errors when visibility is all', () => {
        const component: InputTypeComponent = () => null;
        const descriptor = makeDescriptor();
        const definition = {mode: 'single' as const, descriptor, component};
        const input = makeInput('TextLine');
        const propertySet = new PropertyTree().getRoot();
        const state = makeManagerState();
        state.occurrenceValidation[0].validationResults = [{message: 'Error'}];
        mocks.useOccurrenceManager.mockReturnValue({
            state,
            add: vi.fn(() => true),
            remove: vi.fn(() => true),
            move: vi.fn(() => true),
            set: vi.fn(),
            sync: vi.fn(),
        });
        mocks.useValidationVisibility.mockReturnValue('all');

        const element = InputFieldResolved({input, propertySet, enabled: true, definition});
        const child = getOnlyChild(element);

        expect(child.props.errors).toEqual([{message: 'Error'}]);
    });

    it('hides errors initially and shows after touch when visibility is interactive', () => {
        const component: InputTypeComponent = () => null;
        const descriptor = makeDescriptor();
        const definition = {mode: 'single' as const, descriptor, component};
        const input = makeInput('TextLine');
        const propertySet = new PropertyTree().getRoot();
        const state = makeManagerState();
        state.occurrenceValidation[0].validationResults = [{message: 'Error'}];
        mocks.useOccurrenceManager.mockReturnValue({
            state,
            add: vi.fn(() => true),
            remove: vi.fn(() => true),
            move: vi.fn(() => true),
            set: vi.fn(),
            sync: vi.fn(),
        });
        mocks.useValidationVisibility.mockReturnValue('interactive');

        // Initially untouched: empty set → errors hidden
        const element = InputFieldResolved({input, propertySet, enabled: true, definition});
        const child = getOnlyChild(element);

        expect(child.props.errors).toEqual([]);

        // After touch: render again with touched set containing index 0
        mocks.useState.mockImplementationOnce(() => [new Set([0]), vi.fn()]);
        const element2 = InputFieldResolved({input, propertySet, enabled: true, definition});
        const child2 = getOnlyChild(element2);

        expect(child2.props.errors).toEqual([{message: 'Error'}]);
    });
});
