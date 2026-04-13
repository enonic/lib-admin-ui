import {beforeEach, describe, expect, it, vi} from 'vitest';
import {PropertyTree} from '../../../data/PropertyTree';
import type {Value} from '../../../data/Value';
import {ValueTypes} from '../../../data/ValueTypes';
import {InputBuilder} from '../../../form/Input';
import {InputTypeName} from '../../../form/InputTypeName';
import {Occurrences} from '../../../form/Occurrences';
import type {InputTypeConfig, InputTypeDescriptor} from '../../descriptor';
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
    useRawValueMap: vi.fn(() => undefined),
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
    useRawValueMap: mocks.useRawValueMap,
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

function makeInput(typeName: string, max = 1) {
    return new InputBuilder()
        .setName('testField')
        .setInputType(new InputTypeName(typeName, false))
        .setLabel('Test')
        .setOccurrences(Occurrences.minmax(0, max))
        .setHelpText('')
        .setInputTypeConfig({})
        .build();
}

function makeDescriptor(): InputTypeDescriptor<InputTypeConfig> {
    return {
        name: 'TestType',
        getValueType: () => ValueTypes.STRING,
        readConfig: vi.fn(() => ({})),
        createDefaultValue: () => ValueTypes.STRING.newNullValue(),
        validate: (_value: Value, _config: InputTypeConfig, _rawValue?: string) => [],
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
        mocks.useRawValueMap.mockReturnValue(undefined);
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

    it('stores null plus rawValue for invalid TextLine edits', () => {
        const component: InputTypeComponent = () => null;
        const descriptor = makeDescriptor();
        const definition = {mode: 'list' as const, descriptor, component};
        const input = makeInput('TextLine', 2);
        const propertySet = new PropertyTree().getRoot();
        const set = vi.fn();
        const rawValueMap = new Map<string, (string | undefined)[]>();

        descriptor.validate = vi.fn((value: Value, _config: unknown, rawValue?: string) => {
            const text = value.isNull() ? rawValue : value.getString();
            return text === 'abc' ? [{message: 'field.value.invalid'}] : [];
        });

        mocks.useRawValueMap.mockReturnValue(rawValueMap);
        mocks.usePropertyArray.mockReturnValue({values: [ValueTypes.STRING.newNullValue()], size: 1});
        mocks.useOccurrenceManager.mockReturnValue({
            state: {
                ...makeManagerState(ValueTypes.STRING.newNullValue()),
                values: [ValueTypes.STRING.newNullValue()],
                occurrenceValidation: [{index: 0, breaksRequired: false, validationResults: []}],
                totalValid: 0,
            },
            add: vi.fn(() => true),
            remove: vi.fn(() => true),
            move: vi.fn(() => true),
            set,
            sync: vi.fn(),
        });

        const element = InputFieldResolved({input, propertySet, enabled: true, definition});
        const child = getOnlyChild(element);

        child.props.onChange(0, ValueTypes.STRING.newValue('abc'), 'abc');

        expect(set).toHaveBeenCalledOnce();
        expect(set.mock.calls[0][0]).toBe(0);
        expect((set.mock.calls[0][1] as Value).isNull()).toBe(true);
        expect(set.mock.calls[0][2]).toBe('abc');
        expect(rawValueMap.get('testField')).toEqual(['abc']);
        expect(propertySet.getPropertyArray('testField')?.getValue(0)?.isNull()).toBe(true);
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

    it('remaps touched indexes when internal inputs move occurrences', () => {
        const component: SelfManagedInputTypeComponent = () => null;
        const descriptor = makeDescriptor();
        const definition = {mode: 'internal' as const, descriptor, component};
        const input = makeInput('PrincipalSelector', 3);
        const propertySet = new PropertyTree().getRoot();
        const values = [ValueTypes.STRING.newValue('alpha'), ValueTypes.STRING.newValue('beta')];
        const setTouched = vi.fn();
        const move = vi.fn(() => true);

        propertySet.setProperty('testField', 0, values[0]);
        propertySet.setProperty('testField', 1, values[1]);
        mocks.useState.mockImplementationOnce(() => [new Set([1]), setTouched]);
        mocks.usePropertyArray.mockReturnValue({values, size: values.length});
        mocks.useOccurrenceManager.mockReturnValue({
            state: {
                ...makeManagerState(values[0]),
                values,
                occurrenceValidation: [
                    {index: 0, breaksRequired: false, validationResults: []},
                    {index: 1, breaksRequired: false, validationResults: []},
                ],
                canRemove: true,
            },
            add: vi.fn(() => true),
            remove: vi.fn(() => true),
            move,
            set: vi.fn(),
            sync: vi.fn(),
        });

        const element = InputFieldResolved({input, propertySet, enabled: true, definition});
        const child = getChildAt(element, 1);

        child.props.onMove(1, 0);

        expect(move).toHaveBeenCalledWith(1, 0);
        expect(setTouched).toHaveBeenCalledOnce();

        const updateTouched = setTouched.mock.calls[0][0] as (prev: Set<number>) => Set<number>;
        expect(Array.from(updateTouched(new Set([1])))).toEqual([0]);
    });

    it('moves raw values with internal occurrence reordering', () => {
        const component: SelfManagedInputTypeComponent = () => null;
        const descriptor = makeDescriptor();
        const definition = {mode: 'internal' as const, descriptor, component};
        const input = makeInput('PrincipalSelector', 3);
        const propertySet = new PropertyTree().getRoot();
        const values = [ValueTypes.STRING.newValue('alpha'), ValueTypes.STRING.newValue('beta')];
        const rawValueMap = new Map([['testField', ['raw-alpha', 'raw-beta']]]);
        const move = vi.fn(() => true);

        propertySet.setProperty('testField', 0, values[0]);
        propertySet.setProperty('testField', 1, values[1]);
        mocks.useRawValueMap.mockReturnValue(rawValueMap);
        mocks.usePropertyArray.mockReturnValue({values, size: values.length});
        mocks.useOccurrenceManager.mockReturnValue({
            state: {
                ...makeManagerState(values[0]),
                values,
                occurrenceValidation: [
                    {index: 0, breaksRequired: false, validationResults: []},
                    {index: 1, breaksRequired: false, validationResults: []},
                ],
                canRemove: true,
            },
            add: vi.fn(() => true),
            remove: vi.fn(() => true),
            move,
            set: vi.fn(),
            sync: vi.fn(),
        });

        const element = InputFieldResolved({input, propertySet, enabled: true, definition});
        const child = getChildAt(element, 1);

        child.props.onMove(1, 0);

        expect(rawValueMap.get('testField')).toEqual(['raw-beta', 'raw-alpha']);
    });

    it('drops the removed touched index and shifts higher touched indexes left', () => {
        const component: SelfManagedInputTypeComponent = () => null;
        const descriptor = makeDescriptor();
        const definition = {mode: 'internal' as const, descriptor, component};
        const input = makeInput('PrincipalSelector', 4);
        const propertySet = new PropertyTree().getRoot();
        const values = [
            ValueTypes.STRING.newValue('alpha'),
            ValueTypes.STRING.newValue('beta'),
            ValueTypes.STRING.newValue('gamma'),
        ];
        const setTouched = vi.fn();
        const remove = vi.fn(() => true);

        propertySet.setProperty('testField', 0, values[0]);
        propertySet.setProperty('testField', 1, values[1]);
        propertySet.setProperty('testField', 2, values[2]);
        mocks.useState.mockImplementationOnce(() => [new Set([1, 2]), setTouched]);
        mocks.usePropertyArray.mockReturnValue({values, size: values.length});
        mocks.useOccurrenceManager.mockReturnValue({
            state: {
                ...makeManagerState(values[0]),
                values,
                occurrenceValidation: [
                    {index: 0, breaksRequired: false, validationResults: []},
                    {index: 1, breaksRequired: false, validationResults: []},
                    {index: 2, breaksRequired: false, validationResults: []},
                ],
                canRemove: true,
            },
            add: vi.fn(() => true),
            remove,
            move: vi.fn(() => true),
            set: vi.fn(),
            sync: vi.fn(),
        });

        const element = InputFieldResolved({input, propertySet, enabled: true, definition});
        const child = getChildAt(element, 1);

        child.props.onRemove(1);

        expect(remove).toHaveBeenCalledWith(1);
        expect(setTouched).toHaveBeenCalledOnce();

        const updateTouched = setTouched.mock.calls[0][0] as (prev: Set<number>) => Set<number>;
        expect(Array.from(updateTouched(new Set([1, 2])))).toEqual([1]);
    });

    it('removes raw values with internal occurrence deletion', () => {
        const component: SelfManagedInputTypeComponent = () => null;
        const descriptor = makeDescriptor();
        const definition = {mode: 'internal' as const, descriptor, component};
        const input = makeInput('PrincipalSelector', 4);
        const propertySet = new PropertyTree().getRoot();
        const values = [
            ValueTypes.STRING.newValue('alpha'),
            ValueTypes.STRING.newValue('beta'),
            ValueTypes.STRING.newValue('gamma'),
        ];
        const rawValueMap = new Map([['testField', ['raw-alpha', 'raw-beta', 'raw-gamma']]]);
        const remove = vi.fn(() => true);

        propertySet.setProperty('testField', 0, values[0]);
        propertySet.setProperty('testField', 1, values[1]);
        propertySet.setProperty('testField', 2, values[2]);
        mocks.useRawValueMap.mockReturnValue(rawValueMap);
        mocks.usePropertyArray.mockReturnValue({values, size: values.length});
        mocks.useOccurrenceManager.mockReturnValue({
            state: {
                ...makeManagerState(values[0]),
                values,
                occurrenceValidation: [
                    {index: 0, breaksRequired: false, validationResults: []},
                    {index: 1, breaksRequired: false, validationResults: []},
                    {index: 2, breaksRequired: false, validationResults: []},
                ],
                canRemove: true,
            },
            add: vi.fn(() => true),
            remove,
            move: vi.fn(() => true),
            set: vi.fn(),
            sync: vi.fn(),
        });

        const element = InputFieldResolved({input, propertySet, enabled: true, definition});
        const child = getChildAt(element, 1);

        child.props.onRemove(1);

        expect(rawValueMap.get('testField')).toEqual(['raw-alpha', 'raw-gamma']);
    });

    it('preserves earlier empty raw-value slots when deleting an occurrence', () => {
        const component: SelfManagedInputTypeComponent = () => null;
        const descriptor = makeDescriptor();
        const definition = {mode: 'internal' as const, descriptor, component};
        const input = makeInput('PrincipalSelector', 4);
        const propertySet = new PropertyTree().getRoot();
        const values = [
            ValueTypes.STRING.newValue('alpha'),
            ValueTypes.STRING.newValue('beta'),
            ValueTypes.STRING.newValue('gamma'),
        ];
        const rawValues: Array<string | undefined> = [];
        rawValues[2] = 'raw-gamma';
        const rawValueMap = new Map([['testField', rawValues]]);
        const remove = vi.fn(() => true);

        propertySet.setProperty('testField', 0, values[0]);
        propertySet.setProperty('testField', 1, values[1]);
        propertySet.setProperty('testField', 2, values[2]);
        mocks.useRawValueMap.mockReturnValue(rawValueMap);
        mocks.usePropertyArray.mockReturnValue({values, size: values.length});
        mocks.useOccurrenceManager.mockReturnValue({
            state: {
                ...makeManagerState(values[0]),
                values,
                occurrenceValidation: [
                    {index: 0, breaksRequired: false, validationResults: []},
                    {index: 1, breaksRequired: false, validationResults: []},
                    {index: 2, breaksRequired: false, validationResults: []},
                ],
                canRemove: true,
            },
            add: vi.fn(() => true),
            remove,
            move: vi.fn(() => true),
            set: vi.fn(),
            sync: vi.fn(),
        });

        const element = InputFieldResolved({input, propertySet, enabled: true, definition});
        const child = getChildAt(element, 1);

        child.props.onRemove(0);

        const remainingRawValues = rawValueMap.get('testField');
        expect(remainingRawValues).toHaveLength(2);
        expect(remainingRawValues?.[0]).toBeUndefined();
        expect(remainingRawValues?.[1]).toBe('raw-gamma');
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
