import {beforeEach, describe, expect, it, vi} from 'vitest';
import type {Value} from '../../../data/Value';
import {ValueTypes} from '../../../data/ValueTypes';
import {InputBuilder} from '../../../form/Input';
import {InputTypeName} from '../../../form/InputTypeName';
import {Occurrences} from '../../../form/Occurrences';
import type {OccurrenceManagerState} from '../../descriptor/OccurrenceManager';
import type {InputTypeComponent} from '../../types';
import {OccurrenceList, type OccurrenceListRootProps} from './OccurrenceList';

const mocks = vi.hoisted(() => ({
    useI18n: vi.fn(
        () =>
            (key: string, ...args: unknown[]) =>
                args.length > 0 ? `${key}:${args.join(',')}` : key,
    ),
    useCallback: vi.fn((callback: unknown) => callback),
    sortableList: vi.fn(() => null),
    inputLabel: vi.fn(() => null),
    fieldError: vi.fn(() => null),
    cn: vi.fn((...tokens: Array<string | false | undefined>) => tokens.filter(Boolean).join(' ')),
    iconButton: vi.fn(() => null),
    button: vi.fn(() => null),
}));

vi.mock('react', () => ({
    useCallback: mocks.useCallback,
}));

vi.mock('@enonic/ui', () => ({
    Button: mocks.button,
    IconButton: mocks.iconButton,
    cn: mocks.cn,
}));

vi.mock('../../I18nContext', () => ({
    useI18n: mocks.useI18n,
}));

vi.mock('../sortable-list', () => ({
    SortableList: mocks.sortableList,
}));

vi.mock('../input-label', () => ({
    InputLabel: mocks.inputLabel,
}));

vi.mock('../field-error', () => ({
    FieldError: mocks.fieldError,
}));

function makeInput(min: number, max: number) {
    return new InputBuilder()
        .setName('testField')
        .setInputType(new InputTypeName('TextLine', false))
        .setLabel('Test')
        .setOccurrences(Occurrences.minmax(min, max))
        .setHelpText('')
        .setInputTypeConfig({})
        .build();
}

function makeState(values: Value[], min: number, max: number): OccurrenceManagerState {
    return {
        ids: values.map((_, i) => `occurrence-${i}`),
        values,
        occurrenceValidation: values.map((_, i) => ({
            index: i,
            breaksRequired: false,
            validationResults: [],
        })),
        totalValid: values.length,
        isMinimumBreached: Occurrences.minmax(min, max).minimumBreached(values.length),
        isMaximumBreached: Occurrences.minmax(min, max).maximumBreached(values.length),
        isValid: true,
        canAdd: !Occurrences.minmax(min, max).maximumReached(values.length),
        canRemove: values.length > min,
    };
}

function makeProps(overrides: Partial<OccurrenceListRootProps> = {}): OccurrenceListRootProps {
    const component: InputTypeComponent = () => null;
    const min = 0;
    const max = 5;
    const values = [ValueTypes.STRING.newValue('a')];

    return {
        Component: component,
        state: makeState(values, min, max),
        onAdd: vi.fn(),
        onRemove: vi.fn(),
        onMove: vi.fn(),
        onChange: vi.fn(),
        config: {},
        input: makeInput(min, max),
        enabled: true,
        ...overrides,
    };
}

type VNode = {type: unknown; props: Record<string, any>};

function findFieldError(tree: unknown): VNode | undefined {
    if (tree == null || typeof tree !== 'object') return undefined;
    if (Array.isArray(tree)) {
        for (const child of tree) {
            const found = findFieldError(child);
            if (found != null) return found;
        }
        return undefined;
    }
    if (!('type' in tree) || !('props' in tree)) return undefined;
    const vnode = tree as VNode;
    if (vnode.type === mocks.fieldError) return vnode;
    return findFieldError(vnode.props.children);
}

function getFieldErrorMessage(tree: unknown): string | undefined {
    return findFieldError(tree)?.props.message;
}

describe('OccurrenceList', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.button.mockImplementation(() => null);
        mocks.iconButton.mockImplementation(() => null);
        mocks.sortableList.mockImplementation(() => null);
        mocks.inputLabel.mockImplementation(() => null);
        mocks.fieldError.mockImplementation(() => null);
    });

    it('renders occurrence error when minimum is breached and no field errors', () => {
        const input = makeInput(2, 5);
        const state: OccurrenceManagerState = {
            ids: ['occurrence-0'],
            values: [ValueTypes.STRING.newValue('a')],
            occurrenceValidation: [{index: 0, breaksRequired: false, validationResults: []}],
            totalValid: 1,
            isMinimumBreached: true,
            isMaximumBreached: false,
            isValid: false,
            canAdd: true,
            canRemove: false,
        };

        const tree = OccurrenceList.Root(makeProps({input, state}));

        expect(getFieldErrorMessage(tree)).toBe('field.occurrence.breaks.min:2');
    });

    it('suppresses occurrence error when field errors exist', () => {
        const input = makeInput(2, 5);
        const state: OccurrenceManagerState = {
            ids: ['occurrence-0'],
            values: [ValueTypes.STRING.newValue('a')],
            occurrenceValidation: [{index: 0, breaksRequired: false, validationResults: [{message: 'Invalid'}]}],
            totalValid: 0,
            isMinimumBreached: true,
            isMaximumBreached: false,
            isValid: false,
            canAdd: true,
            canRemove: false,
        };

        const tree = OccurrenceList.Root(makeProps({input, state}));

        expect(getFieldErrorMessage(tree)).toBeUndefined();
    });

    it('does not render occurrence error when counts satisfied', () => {
        const input = makeInput(1, 5);
        const values = [ValueTypes.STRING.newValue('a'), ValueTypes.STRING.newValue('b')];
        const state = makeState(values, 1, 5);

        const tree = OccurrenceList.Root(makeProps({input, state}));

        expect(getFieldErrorMessage(tree)).toBeUndefined();
    });
});
