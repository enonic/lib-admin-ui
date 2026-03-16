import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {ValueTypes} from '../../../data/ValueTypes';
import {InputBuilder} from '../../../form/Input';
import {InputTypeName} from '../../../form/InputTypeName';
import {Occurrences} from '../../../form/Occurrences';
import type {OccurrenceValidationState} from '../../descriptor/OccurrenceManager';
import {
    getOccurrenceErrorMessage,
    getVisibleTagLabel,
    hasTagLabel,
    isTagLabelCropped,
    normalizeTagDraft,
    shouldRemoveLatestTag,
    TagInput,
    type TagInputProps,
} from './TagInput';

const mocks = vi.hoisted(() => ({
    useState: vi.fn((initial: unknown) => [
        typeof initial === 'function' ? (initial as () => unknown)() : initial,
        vi.fn(),
    ]),
    useEffect: vi.fn(),
    useRef: vi.fn((initial: unknown) => ({current: initial})),
    useSensor: vi.fn(() => null),
    useSensors: vi.fn((...sensors: unknown[]) => sensors),
    useSortable: vi.fn(() => ({
        attributes: {},
        listeners: {},
        setNodeRef: vi.fn(),
        transform: null,
        transition: null,
        isDragging: false,
    })),
    useI18n: vi.fn(
        () =>
            (key: string, ...args: unknown[]) =>
                args.length > 0 ? `${key}:${args.join(',')}` : key,
    ),
    dndContext: vi.fn(({children}: {children: unknown}) => children),
    sortableContext: vi.fn(({children}: {children: unknown}) => children),
    input: vi.fn(),
    button: vi.fn(),
    iconButton: vi.fn(),
    tooltip: vi.fn(({children}: {children: unknown}) => children),
    cn: vi.fn((...tokens: Array<string | false | undefined>) => tokens.filter(Boolean).join(' ')),
}));

vi.mock('react', () => ({
    useState: mocks.useState,
    useEffect: mocks.useEffect,
    useRef: mocks.useRef,
}));

vi.mock('@enonic/ui', () => ({
    Input: mocks.input,
    Button: mocks.button,
    IconButton: mocks.iconButton,
    Tooltip: mocks.tooltip,
    cn: mocks.cn,
}));

vi.mock('@dnd-kit/core', () => ({
    DndContext: mocks.dndContext,
    closestCenter: 'closestCenter',
    KeyboardSensor: 'KeyboardSensor',
    PointerSensor: 'PointerSensor',
    useSensor: mocks.useSensor,
    useSensors: mocks.useSensors,
}));

vi.mock('@dnd-kit/sortable', () => ({
    rectSortingStrategy: 'rectSortingStrategy',
    SortableContext: mocks.sortableContext,
    sortableKeyboardCoordinates: 'sortableKeyboardCoordinates',
    useSortable: mocks.useSortable,
}));

vi.mock('../../I18nContext', () => ({
    useI18n: mocks.useI18n,
}));

function makeInput(min: number, max: number) {
    return new InputBuilder()
        .setName('tags')
        .setInputType(new InputTypeName('Tag', false))
        .setLabel('Tags')
        .setOccurrences(Occurrences.minmax(min, max))
        .setHelpText('')
        .setInputTypeConfig({})
        .build();
}

function makeOccurrenceValidation(index: number, message?: string): OccurrenceValidationState {
    return {
        index,
        breaksRequired: false,
        validationResults: message ? [{message}] : [],
    };
}

function makeProps(overrides: Partial<TagInputProps> = {}): TagInputProps {
    const values = overrides.values ?? [];
    const input = overrides.input ?? makeInput(0, 3);

    return {
        values,
        onChange: vi.fn(),
        onAdd: vi.fn(),
        onRemove: vi.fn(),
        onMove: vi.fn(),
        occurrences: overrides.occurrences ?? input.getOccurrences(),
        config: {},
        input,
        enabled: true,
        errors: overrides.errors ?? values.map((_, index) => makeOccurrenceValidation(index)),
        ...overrides,
    };
}

function renderResolvedTree(node: unknown): void {
    if (node == null || typeof node !== 'object') {
        return;
    }

    if (Array.isArray(node)) {
        node.forEach(renderResolvedTree);
        return;
    }

    if (!('type' in node) || !('props' in node)) {
        return;
    }

    const element = node as {type: unknown; props: Record<string, any>};
    if (typeof element.type === 'function') {
        renderResolvedTree(element.type(element.props));
        return;
    }

    renderResolvedTree(element.props.children);
}

function renderTagInput(overrides: Partial<TagInputProps> = {}): void {
    renderResolvedTree(TagInput(makeProps(overrides)));
}

function getLastInputProps(): Record<string, any> {
    const call = mocks.input.mock.lastCall;
    if (call == null) {
        throw new Error('Input was not rendered');
    }
    return call[0];
}

function getLastDndContextProps(): Record<string, any> {
    const call = mocks.dndContext.mock.lastCall;
    if (call == null) {
        throw new Error('DndContext was not rendered');
    }
    return call[0];
}

function getFirstIconButtonProps(): Record<string, any> {
    const call = mocks.iconButton.mock.calls[0];
    if (call == null) {
        throw new Error('IconButton was not rendered');
    }
    return call[0];
}

describe('TagInput helpers', () => {
    it('trims whitespace and trailing separators from draft values', () => {
        expect(normalizeTagDraft('  alpha,  ')).toBe('alpha');
        expect(normalizeTagDraft('   ')).toBe('');
    });

    it('removes the latest tag only when delete or backspace is pressed on an empty draft', () => {
        expect(shouldRemoveLatestTag('Backspace', '', true)).toBe(true);
        expect(shouldRemoveLatestTag('Delete', '', true)).toBe(true);
        expect(shouldRemoveLatestTag('Backspace', 'a', true)).toBe(false);
        expect(shouldRemoveLatestTag('Backspace', '', false)).toBe(false);
        expect(shouldRemoveLatestTag('Backspace', '', true, true)).toBe(false);
    });

    it('returns minimum occurrence errors when no valid tags are present', () => {
        const validation: OccurrenceValidationState[] = [];
        const message = getOccurrenceErrorMessage(Occurrences.minmax(1, 3), validation, mocks.useI18n());

        expect(message).toBe('field.occurrence.breaks.min:1');
    });

    it('suppresses occurrence errors when a tag already has a field error', () => {
        const validation: OccurrenceValidationState[] = [
            {index: 0, breaksRequired: false, validationResults: [{message: 'Invalid tag'}]},
        ];

        expect(getOccurrenceErrorMessage(Occurrences.minmax(1, 3), validation, mocks.useI18n())).toBeUndefined();
    });

    it('detects when a tag label should be cropped for the chip', () => {
        expect(isTagLabelCropped('short label')).toBe(false);
        expect(isTagLabelCropped('123456789012345678901')).toBe(true);
    });

    it('detects duplicate labels among existing tags', () => {
        const values = [ValueTypes.STRING.newValue('alpha'), ValueTypes.STRING.newValue('beta')];

        expect(hasTagLabel(values, 'alpha')).toBe(true);
        expect(hasTagLabel(values, 'gamma')).toBe(false);
        expect(hasTagLabel(values, 'alpha', 0)).toBe(false);
    });

    it('returns a cropped visible tag label when the text exceeds the limit', () => {
        expect(getVisibleTagLabel('short label')).toBe('short label');
        expect(getVisibleTagLabel('123456789012345678901')).toBe('12345678901234567890...');
    });
});

describe('TagInput', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
            callback(0);
            return 0;
        });
        mocks.input.mockImplementation(() => null);
        mocks.button.mockImplementation(() => null);
        mocks.iconButton.mockImplementation(() => null);
        mocks.tooltip.mockImplementation(({children}: {children: unknown}) => children);
        mocks.useState.mockImplementation((initial: unknown) => [
            typeof initial === 'function' ? (initial as () => unknown)() : initial,
            vi.fn(),
        ]);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('keeps the inline input hidden until the field is activated', () => {
        renderTagInput({values: [], errors: []});

        expect(mocks.input).not.toHaveBeenCalled();
        expect(mocks.button).not.toHaveBeenCalled();
    });

    it('renders the inline input when the field is active and another value can be added', () => {
        mocks.useState.mockImplementationOnce(() => ['', vi.fn()]).mockImplementationOnce(() => [true, vi.fn()]);

        renderTagInput({
            values: [ValueTypes.STRING.newValue('alpha')],
            occurrences: Occurrences.minmax(0, 3),
            errors: [makeOccurrenceValidation(0)],
        });

        expect(mocks.input).toHaveBeenCalledTimes(1);
        expect(mocks.button).not.toHaveBeenCalled();
    });

    it('keeps tag removal available when the current count matches the minimum occurrences', () => {
        const onRemove = vi.fn();

        renderTagInput({
            onRemove,
            values: [ValueTypes.STRING.newValue('alpha')],
            occurrences: Occurrences.minmax(1, 3),
            errors: [makeOccurrenceValidation(0)],
        });

        getFirstIconButtonProps().onClick();

        expect(onRemove).toHaveBeenCalledWith(0);
    });

    it('disables sortable behavior when the field is disabled', () => {
        renderTagInput({
            enabled: false,
            values: [ValueTypes.STRING.newValue('alpha'), ValueTypes.STRING.newValue('beta')],
            occurrences: Occurrences.minmax(0, 3),
        });

        expect(mocks.useSortable).toHaveBeenCalledTimes(2);
        expect(mocks.useSortable).toHaveBeenNthCalledWith(1, expect.objectContaining({disabled: true}));
        expect(mocks.useSortable).toHaveBeenNthCalledWith(2, expect.objectContaining({disabled: true}));
    });

    it('adds a tag on Enter and clears the draft', () => {
        const onAdd = vi.fn();
        const setDraft = vi.fn();
        const focus = vi.fn();
        mocks.useState.mockImplementationOnce(() => ['alpha', setDraft]).mockImplementationOnce(() => [true, vi.fn()]);

        renderTagInput({
            onAdd,
            values: [],
            errors: [],
        });

        const inputProps = getLastInputProps();
        inputProps.onKeyDown({
            key: 'Enter',
            altKey: false,
            ctrlKey: false,
            metaKey: false,
            preventDefault: vi.fn(),
            currentTarget: {focus},
        });

        expect(onAdd).toHaveBeenCalledWith(ValueTypes.STRING.newValue('alpha'));
        expect(setDraft).toHaveBeenCalledWith('');
        expect(focus).toHaveBeenCalledOnce();
    });

    it('commits the current draft on blur after completing the previous tag with Enter', () => {
        const onAdd = vi.fn();
        const focus = vi.fn();
        const inputRef = {current: {focus}};
        const tagRefs = {current: []};
        const skipBlurCommit = {current: false};
        const idsByValue = {current: new WeakMap()};
        const nextId = {current: 0};

        mocks.useState
            .mockImplementationOnce(() => ['alpha', vi.fn()])
            .mockImplementationOnce(() => [true, vi.fn()])
            .mockImplementationOnce(() => ['beta', vi.fn()])
            .mockImplementationOnce(() => [true, vi.fn()]);

        mocks.useRef
            .mockImplementationOnce(() => inputRef)
            .mockImplementationOnce(() => tagRefs)
            .mockImplementationOnce(() => skipBlurCommit)
            .mockImplementationOnce(() => idsByValue)
            .mockImplementationOnce(() => nextId)
            .mockImplementationOnce(() => inputRef)
            .mockImplementationOnce(() => tagRefs)
            .mockImplementationOnce(() => skipBlurCommit)
            .mockImplementationOnce(() => idsByValue)
            .mockImplementationOnce(() => nextId);

        renderTagInput({onAdd, values: [], errors: []});
        getLastInputProps().onKeyDown({
            key: 'Enter',
            altKey: false,
            ctrlKey: false,
            metaKey: false,
            preventDefault: vi.fn(),
            currentTarget: {focus},
        });

        renderTagInput({
            onAdd,
            values: [ValueTypes.STRING.newValue('alpha')],
            occurrences: Occurrences.minmax(0, 3),
            errors: [makeOccurrenceValidation(0)],
        });
        getLastInputProps().onBlur();

        expect(onAdd).toHaveBeenNthCalledWith(1, ValueTypes.STRING.newValue('alpha'));
        expect(onAdd).toHaveBeenNthCalledWith(2, ValueTypes.STRING.newValue('beta'));
    });

    it('removes the latest tag on Backspace when the draft is empty', () => {
        const onRemove = vi.fn();
        mocks.useState.mockImplementationOnce(() => ['', vi.fn()]).mockImplementationOnce(() => [true, vi.fn()]);

        renderTagInput({
            onRemove,
            values: [ValueTypes.STRING.newValue('alpha'), ValueTypes.STRING.newValue('beta')],
            occurrences: Occurrences.minmax(0, 3),
        });

        const inputProps = getLastInputProps();
        inputProps.onKeyDown({
            key: 'Backspace',
            altKey: false,
            ctrlKey: false,
            metaKey: false,
            preventDefault: vi.fn(),
            currentTarget: {focus: vi.fn()},
        });

        expect(onRemove).toHaveBeenCalledWith(1);
    });

    it('hides a blank input when a tag is removed by click', () => {
        const onRemove = vi.fn();
        const setIsInputActive = vi.fn();
        mocks.useState
            .mockImplementationOnce(() => ['', vi.fn()])
            .mockImplementationOnce(() => [true, setIsInputActive]);

        renderTagInput({
            onRemove,
            values: [ValueTypes.STRING.newValue('alpha'), ValueTypes.STRING.newValue('beta')],
            occurrences: Occurrences.minmax(0, 3),
        });

        getFirstIconButtonProps().onClick();

        expect(onRemove).toHaveBeenCalledWith(0);
        expect(setIsInputActive).toHaveBeenCalledWith(false);
    });

    it('commits the current draft before removing a tag by click', () => {
        const onAdd = vi.fn();
        const onRemove = vi.fn();
        const setDraft = vi.fn();
        const setIsInputActive = vi.fn();
        mocks.useState
            .mockImplementationOnce(() => ['gamma', setDraft])
            .mockImplementationOnce(() => [true, setIsInputActive]);

        renderTagInput({
            onAdd,
            onRemove,
            values: [ValueTypes.STRING.newValue('alpha'), ValueTypes.STRING.newValue('beta')],
            occurrences: Occurrences.minmax(0, 4),
        });

        getFirstIconButtonProps().onClick();

        expect(onAdd).toHaveBeenCalledWith(ValueTypes.STRING.newValue('gamma'));
        expect(setDraft).toHaveBeenCalledWith('');
        expect(onRemove).toHaveBeenCalledWith(0);
        expect(setIsInputActive).toHaveBeenCalledWith(false);
    });

    it('does not commit the same draft twice when closing another tag and then blurring', () => {
        const onAdd = vi.fn();
        const onRemove = vi.fn();
        const setDraft = vi.fn();
        const setIsInputActive = vi.fn();
        const inputRef = {current: {focus: vi.fn()}};
        const tagRefs = {current: []};
        const skipBlurCommit = {current: false};
        const idsByValue = {current: new WeakMap()};
        const nextId = {current: 0};

        mocks.useState
            .mockImplementationOnce(() => ['gamma', setDraft])
            .mockImplementationOnce(() => [true, setIsInputActive]);
        mocks.useRef
            .mockImplementationOnce(() => inputRef)
            .mockImplementationOnce(() => tagRefs)
            .mockImplementationOnce(() => skipBlurCommit)
            .mockImplementationOnce(() => idsByValue)
            .mockImplementationOnce(() => nextId);

        renderTagInput({
            onAdd,
            onRemove,
            values: [ValueTypes.STRING.newValue('alpha'), ValueTypes.STRING.newValue('beta')],
            occurrences: Occurrences.minmax(0, 4),
        });

        const iconButtonProps = getFirstIconButtonProps();
        const inputProps = getLastInputProps();

        iconButtonProps.onPointerDown({preventDefault: vi.fn()});
        iconButtonProps.onClick();
        inputProps.onBlur();

        expect(onAdd).toHaveBeenCalledTimes(1);
        expect(onAdd).toHaveBeenCalledWith(ValueTypes.STRING.newValue('gamma'));
        expect(onRemove).toHaveBeenCalledWith(0);
    });

    it('hides the input on the next blur after removing a tag by click', () => {
        const setIsInputActive = vi.fn();
        mocks.useState
            .mockImplementationOnce(() => ['', vi.fn()])
            .mockImplementationOnce(() => [true, setIsInputActive]);

        renderTagInput({
            values: [ValueTypes.STRING.newValue('alpha'), ValueTypes.STRING.newValue('beta')],
            occurrences: Occurrences.minmax(0, 3),
        });

        const iconButtonProps = getFirstIconButtonProps();
        const inputProps = getLastInputProps();

        iconButtonProps.onPointerDown({preventDefault: vi.fn()});
        iconButtonProps.onClick();
        inputProps.onBlur();

        expect(setIsInputActive).toHaveBeenCalledTimes(1);
        expect(setIsInputActive).toHaveBeenCalledWith(false);
    });

    it('reorders tags from drag end', () => {
        const onMove = vi.fn();
        mocks.useState.mockImplementationOnce(() => ['', vi.fn()]).mockImplementationOnce(() => [false, vi.fn()]);

        renderTagInput({
            onMove,
            values: [ValueTypes.STRING.newValue('alpha'), ValueTypes.STRING.newValue('beta')],
            occurrences: Occurrences.minmax(0, 3),
        });

        const dndContextProps = getLastDndContextProps();
        dndContextProps.onDragEnd({
            active: {id: 'tag-0'},
            over: {id: 'tag-1'},
        });

        expect(onMove).toHaveBeenCalledWith(0, 1);
    });
});
