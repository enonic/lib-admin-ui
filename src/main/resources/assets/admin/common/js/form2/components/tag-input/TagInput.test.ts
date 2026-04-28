import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {ValueTypes} from '../../../data/ValueTypes';
import {InputBuilder} from '../../../form/Input';
import {InputTypeName} from '../../../form/InputTypeName';
import {Occurrences} from '../../../form/Occurrences';
import type {OccurrenceValidationState} from '../../descriptor';
import {getOccurrenceErrorMessage} from '../../utils';
import {
    getPastedTagLabels,
    getVisibleTagLabel,
    hasPastedTagSeparators,
    hasTagLabel,
    isTagLabelCropped,
    normalizeTagDraft,
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
    sortableKeyboardCoordinates: vi.fn(() => ({x: 999, y: 555})),
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
    sortableKeyboardCoordinates: mocks.sortableKeyboardCoordinates,
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

function makeHiddenBlankValidation(
    index: number,
    message?: string,
    options: {custom?: boolean; suppressed?: boolean} = {},
): OccurrenceValidationState {
    const {custom = false, suppressed = false} = options;

    return {
        index,
        breaksRequired: !suppressed,
        validationResults: message ? [{message, ...(custom ? {custom: true} : {})}] : [],
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

function findElementInTree(
    node: unknown,
    predicate: (element: {type: unknown; props: Record<string, any>}) => boolean,
): {type: unknown; props: Record<string, any>} | undefined {
    if (node == null || typeof node !== 'object') {
        return undefined;
    }

    if (Array.isArray(node)) {
        for (const child of node) {
            const match = findElementInTree(child, predicate);
            if (match != null) {
                return match;
            }
        }

        return undefined;
    }

    if (!('type' in node) || !('props' in node)) {
        return undefined;
    }

    const element = node as {type: unknown; props: Record<string, any>};
    if (typeof element.type === 'function') {
        return findElementInTree(element.type(element.props), predicate);
    }

    if (predicate(element)) {
        return element;
    }

    return findElementInTree(element.props.children, predicate);
}

function getTagInputElement(overrides: Partial<TagInputProps> = {}) {
    return TagInput(makeProps(overrides)) as {props: {children: unknown}};
}

function renderTagInput(overrides: Partial<TagInputProps> = {}): void {
    renderResolvedTree(getTagInputElement(overrides));
}

function getFieldWrapperProps(overrides: Partial<TagInputProps> = {}): Record<string, any> {
    const element = getTagInputElement(overrides);
    const children = Array.isArray(element.props.children) ? element.props.children : [element.props.children];
    return children[0].props;
}

function getHelperText(overrides: Partial<TagInputProps> = {}): unknown {
    const element = getTagInputElement(overrides);
    const children = Array.isArray(element.props.children) ? element.props.children : [element.props.children];
    return children[1]?.props.message ?? children[1]?.props.children;
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

function mockWrapperOwnerDocument() {
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();

    mocks.useRef.mockImplementationOnce(() => ({
        current: {
            ownerDocument: {addEventListener, removeEventListener},
        },
    }));

    return {addEventListener, removeEventListener};
}

function runEffectCleanupsOnUnmount(): Array<() => void> {
    const cleanups: Array<() => void> = [];

    mocks.useEffect.mockImplementation((effect: () => undefined | (() => void)) => {
        const cleanup = effect();

        if (typeof cleanup === 'function') {
            cleanups.push(cleanup);
        }
    });

    return cleanups;
}

function renderDraggableTagInput(overrides: Partial<TagInputProps> = {}): void {
    renderTagInput({
        values: [ValueTypes.STRING.newValue('alpha'), ValueTypes.STRING.newValue('beta')],
        occurrences: Occurrences.minmax(0, 3),
        ...overrides,
    });
}

function getKeyboardSensorOptions(): Record<string, any> {
    const call = (mocks.useSensor.mock.calls as unknown as Array<[unknown, Record<string, any>]>).find(
        entry => entry[0] === 'KeyboardSensor',
    );
    if (call == null) {
        throw new Error('KeyboardSensor was not configured');
    }
    return call[1];
}

function getIconButtonProps(ariaLabel: string, index = 0): Record<string, any> {
    const props = mocks.iconButton.mock.calls.map(call => call[0]).filter(entry => entry['aria-label'] === ariaLabel)[
        index
    ];

    if (props == null) {
        throw new Error(`IconButton with aria-label "${ariaLabel}" was not rendered`);
    }

    return props;
}

function getFirstDragButtonProps(): Record<string, any> {
    return getIconButtonProps('field.occurrence.action.reorder');
}

function getFirstRemoveButtonProps(): Record<string, any> {
    return getIconButtonProps('field.occurrence.action.remove');
}

function getFirstTagItemProps(overrides: Partial<TagInputProps> = {}): Record<string, any> {
    const match = findElementInTree(
        getTagInputElement(overrides),
        element =>
            element.type === 'li' &&
            typeof element.props.className === 'string' &&
            element.props.className.includes('bg-surface-neutral'),
    );

    if (match == null) {
        throw new Error('Tag item was not rendered');
    }

    return match.props;
}

describe('TagInput helpers', () => {
    it('trims whitespace and trailing separators from draft values', () => {
        expect(normalizeTagDraft('  alpha,  ')).toBe('alpha');
        expect(normalizeTagDraft('   ')).toBe('');
    });

    it('detects spreadsheet separators and splits pasted cells into labels', () => {
        expect(hasPastedTagSeparators('This\tis\ta\ttest yes\r\nSecond\trow\ttest\there')).toBe(true);
        expect(getPastedTagLabels('This\tis\ta\ttest yes\r\nSecond\trow\ttest\there')).toEqual([
            'This',
            'is',
            'a',
            'test yes',
            'Second',
            'row',
            'test',
            'here',
        ]);
        expect(hasPastedTagSeparators('foo, bars')).toBe(true);
        expect(getPastedTagLabels('foo, bars')).toEqual(['foo', 'bars']);
        expect(hasPastedTagSeparators('single value only')).toBe(false);
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
        expect(hasTagLabel([ValueTypes.STRING.newValue('')], '')).toBe(false);
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
        mocks.useEffect.mockImplementation(() => undefined);
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

    it('keeps the writable input mounted as the tab target even before activation', () => {
        renderTagInput({values: [], errors: []});

        expect(mocks.input).toHaveBeenCalledTimes(1);
        expect(mocks.button).not.toHaveBeenCalled();
    });

    it('keeps the tag wrapper out of the tab order', () => {
        const wrapperProps = getFieldWrapperProps({
            values: [ValueTypes.STRING.newValue('alpha')],
            occurrences: Occurrences.minmax(0, 3),
            errors: [makeOccurrenceValidation(0)],
        });

        expect(wrapperProps.tabIndex).toBeUndefined();
    });

    it('keeps the writable input rendered when another value can still be added', () => {
        mocks.useState.mockImplementationOnce(() => ['', vi.fn()]).mockImplementationOnce(() => [true, vi.fn()]);

        renderTagInput({
            values: [ValueTypes.STRING.newValue('alpha')],
            occurrences: Occurrences.minmax(0, 3),
            errors: [makeOccurrenceValidation(0)],
        });

        expect(mocks.input).toHaveBeenCalledTimes(1);
        expect(mocks.button).not.toHaveBeenCalled();
    });

    it('does not render empty tags', () => {
        renderTagInput({
            values: [ValueTypes.STRING.newValue('')],
            occurrences: Occurrences.minmax(0, 3),
            errors: [makeOccurrenceValidation(0)],
        });

        expect(mocks.iconButton).not.toHaveBeenCalled();
        expect(() =>
            getFirstTagItemProps({
                values: [ValueTypes.STRING.newValue('')],
                occurrences: Occurrences.minmax(0, 3),
                errors: [makeOccurrenceValidation(0)],
            }),
        ).toThrow('Tag item was not rendered');
    });

    it('keeps the input available when only hidden empty tags would otherwise reach max occurrences', () => {
        renderTagInput({
            values: [ValueTypes.STRING.newValue(''), ValueTypes.STRING.newValue('alpha')],
            occurrences: Occurrences.minmax(0, 2),
            errors: [makeOccurrenceValidation(0), makeOccurrenceValidation(1)],
        });

        expect(mocks.input).toHaveBeenCalledTimes(1);
    });

    it('marks the wrapper invalid when hidden empty tags keep the value below minimum occurrences', () => {
        expect(
            getFieldWrapperProps({
                values: [ValueTypes.STRING.newValue('')],
                occurrences: Occurrences.minmax(1, 3),
                errors: [makeHiddenBlankValidation(0)],
            }).className,
        ).toContain('border-error');
    });

    it('ignores validation errors from hidden empty tags when deriving helper text', () => {
        expect(
            getHelperText({
                values: [ValueTypes.STRING.newValue('')],
                occurrences: Occurrences.minmax(0, 3),
                errors: [makeHiddenBlankValidation(0, 'Invalid empty tag')],
            }),
        ).toBeUndefined();
    });

    it('keeps custom errors from hidden empty tags in helper text', () => {
        expect(
            getHelperText({
                values: [ValueTypes.STRING.newValue('')],
                occurrences: Occurrences.minmax(1, 3),
                errors: [makeHiddenBlankValidation(0, 'Hidden server error', {custom: true})],
            }),
        ).toBe('Hidden server error');
    });

    it('keeps interactive-suppressed hidden blanks from surfacing error styling on the wrapper', () => {
        expect(
            getFieldWrapperProps({
                values: [ValueTypes.STRING.newValue('')],
                occurrences: Occurrences.minmax(1, 3),
                errors: [makeHiddenBlankValidation(0, undefined, {suppressed: true})],
            }).className,
        ).not.toContain('border-error');
    });

    it('keeps remove buttons out of the tab order before focus enters the component', () => {
        renderTagInput({
            values: [ValueTypes.STRING.newValue('alpha')],
            occurrences: Occurrences.minmax(0, 3),
            errors: [makeOccurrenceValidation(0)],
        });

        expect(getFirstRemoveButtonProps().tabIndex).toBe(-1);
    });

    it('keeps drag buttons out of the tab order before focus enters the component', () => {
        renderTagInput({
            values: [ValueTypes.STRING.newValue('alpha'), ValueTypes.STRING.newValue('beta')],
            occurrences: Occurrences.minmax(0, 3),
            errors: [makeOccurrenceValidation(0), makeOccurrenceValidation(1)],
        });

        expect(getFirstDragButtonProps().tabIndex).toBe(-1);
        expect(getFirstDragButtonProps()['aria-label']).toBe('field.occurrence.action.reorder');
    });

    it('keeps remove buttons out of the tab order even when focus is within the component', () => {
        renderTagInput({
            values: [ValueTypes.STRING.newValue('alpha')],
            occurrences: Occurrences.minmax(0, 3),
            errors: [makeOccurrenceValidation(0)],
        });

        expect(getFirstRemoveButtonProps().tabIndex).toBe(-1);
    });

    it('keeps drag buttons out of the tab order even when focus is within the component', () => {
        renderTagInput({
            values: [ValueTypes.STRING.newValue('alpha'), ValueTypes.STRING.newValue('beta')],
            occurrences: Occurrences.minmax(0, 3),
            errors: [makeOccurrenceValidation(0), makeOccurrenceValidation(1)],
        });

        expect(getFirstDragButtonProps().tabIndex).toBe(-1);
    });

    it('makes the last drag handle the tab entry point when max tags hide the inline input', () => {
        renderTagInput({
            values: [ValueTypes.STRING.newValue('alpha'), ValueTypes.STRING.newValue('beta')],
            occurrences: Occurrences.minmax(0, 2),
            errors: [makeOccurrenceValidation(0), makeOccurrenceValidation(1)],
        });

        expect(getIconButtonProps('field.occurrence.action.reorder', 0).tabIndex).toBe(-1);
        expect(getIconButtonProps('field.occurrence.action.reorder', 1).tabIndex).toBe(0);
        expect(getIconButtonProps('field.occurrence.action.remove', 0).tabIndex).toBe(-1);
        expect(getIconButtonProps('field.occurrence.action.remove', 1).tabIndex).toBe(-1);
    });

    it('makes the last remove button the tab entry point when max tags hide the inline input and dragging is unavailable', () => {
        renderTagInput({
            values: [ValueTypes.STRING.newValue('alpha')],
            occurrences: Occurrences.minmax(0, 1),
            errors: [makeOccurrenceValidation(0)],
        });

        expect(getFirstRemoveButtonProps().tabIndex).toBe(0);
    });

    it('keeps tag items themselves out of the tab order when focus is within the component', () => {
        const tagItemProps = getFirstTagItemProps({
            values: [ValueTypes.STRING.newValue('alpha'), ValueTypes.STRING.newValue('beta')],
            occurrences: Occurrences.minmax(0, 3),
            errors: [makeOccurrenceValidation(0), makeOccurrenceValidation(1)],
        });

        expect(tagItemProps.tabIndex).toBeUndefined();
        expect(tagItemProps.onKeyDown).toBeUndefined();
    });

    it('keeps tag removal available when the current count matches the minimum occurrences', () => {
        const onRemove = vi.fn();

        renderTagInput({
            onRemove,
            values: [ValueTypes.STRING.newValue('alpha')],
            occurrences: Occurrences.minmax(1, 3),
            errors: [makeOccurrenceValidation(0)],
        });

        getFirstRemoveButtonProps().onClick();

        expect(onRemove).toHaveBeenCalledWith(0);
    });

    it('marks the wrapper invalid when the number of tags drops below the limit', () => {
        expect(
            getFieldWrapperProps({
                values: [ValueTypes.STRING.newValue('alpha')],
                occurrences: Occurrences.minmax(2, 3),
                errors: [makeOccurrenceValidation(0)],
            }).className,
        ).toContain('border-error');
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

    it('disables dnd-kit auto-scroll for tag dragging', () => {
        renderTagInput({
            values: [ValueTypes.STRING.newValue('alpha'), ValueTypes.STRING.newValue('beta')],
            occurrences: Occurrences.minmax(0, 3),
        });

        expect(getLastDndContextProps().autoScroll).toBe(false);
    });

    it('cancels an active drag when scrolling starts', () => {
        const {addEventListener, removeEventListener} = mockWrapperOwnerDocument();
        const setDragContextKey = vi.fn();

        mocks.useState
            .mockImplementationOnce(() => ['', vi.fn()])
            .mockImplementationOnce(() => [false, vi.fn()])
            .mockImplementationOnce(() => [false, vi.fn()])
            .mockImplementationOnce(() => [0, setDragContextKey]);

        renderDraggableTagInput();

        const dndContextProps = getLastDndContextProps();
        dndContextProps.onDragStart({});

        const scrollHandler = addEventListener.mock.calls[0]?.[1];
        expect(addEventListener).toHaveBeenCalledWith('scroll', scrollHandler, true);

        scrollHandler();

        expect(setDragContextKey).toHaveBeenCalledOnce();
        expect(removeEventListener).toHaveBeenCalledWith('scroll', scrollHandler, true);
    });

    it('removes the active drag scroll listener on unmount', () => {
        const {addEventListener, removeEventListener} = mockWrapperOwnerDocument();
        const effectCleanups = runEffectCleanupsOnUnmount();

        renderDraggableTagInput();

        const dndContextProps = getLastDndContextProps();
        dndContextProps.onDragStart({});

        const scrollHandler = addEventListener.mock.calls[0]?.[1];
        effectCleanups.forEach(cleanup => {
            cleanup();
        });

        expect(removeEventListener).toHaveBeenCalledWith('scroll', scrollHandler, true);
    });

    it('moves keyboard drag left and right by logical neighbor order', () => {
        renderTagInput({
            values: [
                ValueTypes.STRING.newValue('alpha'),
                ValueTypes.STRING.newValue('beta'),
                ValueTypes.STRING.newValue('gamma'),
                ValueTypes.STRING.newValue('delta'),
            ],
            occurrences: Occurrences.minmax(0, 4),
        });

        const coordinateGetter = getKeyboardSensorOptions().coordinateGetter;
        const items = ['tag-0', 'tag-1', 'tag-2', 'tag-3'];
        const rects = new Map([
            ['tag-0', {left: 0, top: 0, width: 60, height: 20}],
            ['tag-1', {left: 70, top: 0, width: 60, height: 20}],
            ['tag-2', {left: 0, top: 30, width: 60, height: 20}],
            ['tag-3', {left: 70, top: 30, width: 60, height: 20}],
        ]);
        const entries = new Map(
            items.map((id, index) => [
                id,
                {
                    id,
                    disabled: false,
                    node: {current: {}},
                    data: {current: {sortable: {containerId: 'tags', items, index}}},
                },
            ]),
        );
        const droppableContainers = {
            get: (id: string) => entries.get(id),
            getEnabled: () => Array.from(entries.values()),
        };

        expect(
            coordinateGetter({code: 'ArrowLeft', preventDefault: vi.fn()} as unknown as KeyboardEvent, {
                active: entries.get('tag-2'),
                currentCoordinates: {x: 0, y: 0},
                context: {
                    active: entries.get('tag-2'),
                    collisionRect: rects.get('tag-2'),
                    droppableRects: rects,
                    droppableContainers,
                    over: {id: 'tag-2'},
                },
            }),
        ).toEqual({x: 70, y: 0});

        expect(
            coordinateGetter({code: 'ArrowRight', preventDefault: vi.fn()} as unknown as KeyboardEvent, {
                active: entries.get('tag-2'),
                currentCoordinates: {x: 0, y: 0},
                context: {
                    active: entries.get('tag-2'),
                    collisionRect: rects.get('tag-2'),
                    droppableRects: rects,
                    droppableContainers,
                    over: {id: 'tag-2'},
                },
            }),
        ).toEqual({x: 70, y: 30});
    });

    it('ignores up and down keyboard drag movement', () => {
        renderTagInput({
            values: [
                ValueTypes.STRING.newValue('alpha'),
                ValueTypes.STRING.newValue('beta'),
                ValueTypes.STRING.newValue('gamma'),
                ValueTypes.STRING.newValue('delta'),
                ValueTypes.STRING.newValue('epsilon'),
                ValueTypes.STRING.newValue('zeta'),
            ],
            occurrences: Occurrences.minmax(0, 6),
        });

        const coordinateGetter = getKeyboardSensorOptions().coordinateGetter;
        const items = ['tag-0', 'tag-1', 'tag-2', 'tag-3', 'tag-4', 'tag-5'];
        const rects = new Map([
            ['tag-0', {left: 0, top: 0, width: 60, height: 20}],
            ['tag-1', {left: 70, top: 0, width: 60, height: 20}],
            ['tag-2', {left: 0, top: 30, width: 60, height: 20}],
            ['tag-3', {left: 70, top: 30, width: 60, height: 20}],
            ['tag-4', {left: 0, top: 60, width: 60, height: 20}],
            ['tag-5', {left: 70, top: 60, width: 60, height: 20}],
        ]);
        const entries = new Map(
            items.map((id, index) => [
                id,
                {
                    id,
                    disabled: false,
                    node: {current: {}},
                    data: {current: {sortable: {containerId: 'tags', items, index}}},
                },
            ]),
        );
        const droppableContainers = {
            get: (id: string) => entries.get(id),
            getEnabled: () => Array.from(entries.values()),
        };

        expect(
            coordinateGetter({code: 'ArrowUp', preventDefault: vi.fn()} as unknown as KeyboardEvent, {
                active: entries.get('tag-2'),
                currentCoordinates: {x: 0, y: 0},
                context: {
                    active: entries.get('tag-2'),
                    collisionRect: rects.get('tag-2'),
                    droppableRects: rects,
                    droppableContainers,
                    over: {id: 'tag-2'},
                },
            }),
        ).toBeUndefined();

        expect(
            coordinateGetter({code: 'ArrowDown', preventDefault: vi.fn()} as unknown as KeyboardEvent, {
                active: entries.get('tag-4'),
                currentCoordinates: {x: 0, y: 0},
                context: {
                    active: entries.get('tag-4'),
                    collisionRect: rects.get('tag-4'),
                    droppableRects: rects,
                    droppableContainers,
                    over: {id: 'tag-4'},
                },
            }),
        ).toBeUndefined();
    });

    it('delegates non-arrow keyboard drag movement to sortable keyboard coordinates', () => {
        renderTagInput({
            values: [ValueTypes.STRING.newValue('alpha'), ValueTypes.STRING.newValue('beta')],
            occurrences: Occurrences.minmax(0, 3),
        });

        const coordinateGetter = getKeyboardSensorOptions().coordinateGetter;
        const fallback = coordinateGetter({code: 'Enter', preventDefault: vi.fn()} as unknown as KeyboardEvent, {
            active: undefined,
            currentCoordinates: {x: 0, y: 0},
            context: {},
        });

        expect(fallback).toEqual({x: 999, y: 555});
        expect(mocks.sortableKeyboardCoordinates).toHaveBeenCalledOnce();
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

    it('creates one tag per pasted spreadsheet cell', () => {
        const onAdd = vi.fn();
        const preventDefault = vi.fn();

        renderTagInput({
            onAdd,
            values: [],
            occurrences: Occurrences.minmax(0, 10),
            errors: [],
        });

        getLastInputProps().onPaste({
            preventDefault,
            clipboardData: {
                getData: (type: string) =>
                    type === 'text/plain' ? 'This\tis\ta\ttest yes\r\nSecond\trow\ttest\there' : '',
            },
            currentTarget: {focus: vi.fn()},
        });

        expect(preventDefault).toHaveBeenCalledOnce();
        expect(onAdd).toHaveBeenCalledTimes(8);
        expect(onAdd).toHaveBeenNthCalledWith(1, ValueTypes.STRING.newValue('This'));
        expect(onAdd).toHaveBeenNthCalledWith(2, ValueTypes.STRING.newValue('is'));
        expect(onAdd).toHaveBeenNthCalledWith(3, ValueTypes.STRING.newValue('a'));
        expect(onAdd).toHaveBeenNthCalledWith(4, ValueTypes.STRING.newValue('test yes'));
        expect(onAdd).toHaveBeenNthCalledWith(5, ValueTypes.STRING.newValue('Second'));
        expect(onAdd).toHaveBeenNthCalledWith(6, ValueTypes.STRING.newValue('row'));
        expect(onAdd).toHaveBeenNthCalledWith(7, ValueTypes.STRING.newValue('test'));
        expect(onAdd).toHaveBeenNthCalledWith(8, ValueTypes.STRING.newValue('here'));
    });

    it('creates one tag per comma-separated pasted value', () => {
        const onAdd = vi.fn();
        const preventDefault = vi.fn();

        renderTagInput({
            onAdd,
            values: [],
            occurrences: Occurrences.minmax(0, 10),
            errors: [],
        });

        getLastInputProps().onPaste({
            preventDefault,
            clipboardData: {
                getData: (type: string) => (type === 'text/plain' ? 'foo, bars' : ''),
            },
            currentTarget: {focus: vi.fn()},
        });

        expect(preventDefault).toHaveBeenCalledOnce();
        expect(onAdd).toHaveBeenCalledTimes(2);
        expect(onAdd).toHaveBeenNthCalledWith(1, ValueTypes.STRING.newValue('foo'));
        expect(onAdd).toHaveBeenNthCalledWith(2, ValueTypes.STRING.newValue('bars'));
    });

    it('prepends the current draft before pasted spreadsheet cells', () => {
        const onAdd = vi.fn();
        const preventDefault = vi.fn();
        const setDraft = vi.fn();
        mocks.useState.mockImplementationOnce(() => ['beta', setDraft]);

        renderTagInput({
            onAdd,
            values: [ValueTypes.STRING.newValue('alpha')],
            occurrences: Occurrences.minmax(0, 2),
            errors: [makeOccurrenceValidation(0)],
        });

        getLastInputProps().onPaste({
            preventDefault,
            clipboardData: {
                getData: (type: string) => (type === 'text/plain' ? 'gamma\tdelta' : ''),
            },
            currentTarget: {focus: vi.fn()},
        });

        expect(preventDefault).toHaveBeenCalledOnce();
        expect(onAdd).toHaveBeenCalledOnce();
        expect(onAdd).toHaveBeenCalledWith(ValueTypes.STRING.newValue('beta'));
        expect(setDraft).toHaveBeenCalledWith('');
    });

    it('clears the draft when the same label is included in the pasted spreadsheet cells', () => {
        const onAdd = vi.fn();
        const preventDefault = vi.fn();
        const setDraft = vi.fn();
        mocks.useState.mockImplementationOnce(() => ['beta', setDraft]);

        renderTagInput({
            onAdd,
            values: [ValueTypes.STRING.newValue('alpha')],
            occurrences: Occurrences.minmax(0, 4),
            errors: [makeOccurrenceValidation(0)],
        });

        getLastInputProps().onPaste({
            preventDefault,
            clipboardData: {
                getData: (type: string) => (type === 'text/plain' ? 'beta\tgamma' : ''),
            },
            currentTarget: {focus: vi.fn()},
        });

        expect(preventDefault).toHaveBeenCalledOnce();
        expect(onAdd).toHaveBeenNthCalledWith(1, ValueTypes.STRING.newValue('beta'));
        expect(onAdd).toHaveBeenNthCalledWith(2, ValueTypes.STRING.newValue('gamma'));
        expect(setDraft).toHaveBeenCalledWith('');
    });

    it('fills hidden slots first and skips duplicate pasted spreadsheet cells', () => {
        const onAdd = vi.fn();
        const onChange = vi.fn();
        const onMove = vi.fn();
        const preventDefault = vi.fn();

        renderTagInput({
            onAdd,
            onChange,
            onMove,
            values: [ValueTypes.STRING.newValue(''), ValueTypes.STRING.newValue('alpha')],
            errors: [makeHiddenBlankValidation(0), makeOccurrenceValidation(1)],
            occurrences: Occurrences.minmax(0, 3),
        });

        getLastInputProps().onPaste({
            preventDefault,
            clipboardData: {
                getData: (type: string) => (type === 'text/plain' ? 'alpha\tbeta\r\nbeta\tgamma' : ''),
            },
            currentTarget: {focus: vi.fn()},
        });

        expect(preventDefault).toHaveBeenCalledOnce();
        expect(onMove).toHaveBeenCalledWith(1, 0);
        expect(onChange).toHaveBeenCalledWith(1, ValueTypes.STRING.newValue('beta'), 'beta');
        expect(onAdd).toHaveBeenCalledOnce();
        expect(onAdd).toHaveBeenCalledWith(ValueTypes.STRING.newValue('gamma'));
    });

    it('keeps native single-value paste behavior', () => {
        const onAdd = vi.fn();
        const preventDefault = vi.fn();

        renderTagInput({
            onAdd,
            values: [],
            occurrences: Occurrences.minmax(0, 3),
            errors: [],
        });

        getLastInputProps().onPaste({
            preventDefault,
            clipboardData: {
                getData: (type: string) => (type === 'text/plain' ? 'single value only' : ''),
            },
            currentTarget: {focus: vi.fn()},
        });

        expect(preventDefault).not.toHaveBeenCalled();
        expect(onAdd).not.toHaveBeenCalled();
    });

    it('compacts hidden tag slots before writing a new tag so the new tag appends after visible tags', () => {
        const onAdd = vi.fn();
        const onChange = vi.fn();
        const onMove = vi.fn();
        const setDraft = vi.fn();
        const focus = vi.fn();
        mocks.useState.mockImplementationOnce(() => ['gamma', setDraft]).mockImplementationOnce(() => [true, vi.fn()]);

        renderTagInput({
            onAdd,
            onChange,
            onMove,
            values: [
                ValueTypes.STRING.newValue('alpha'),
                ValueTypes.STRING.newValue(''),
                ValueTypes.STRING.newValue('beta'),
            ],
            errors: [makeOccurrenceValidation(0), makeHiddenBlankValidation(1), makeOccurrenceValidation(2)],
            occurrences: Occurrences.minmax(0, 4),
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

        expect(onMove).toHaveBeenCalledWith(2, 1);
        expect(onChange).toHaveBeenCalledWith(2, ValueTypes.STRING.newValue('gamma'), 'gamma');
        expect(onAdd).not.toHaveBeenCalled();
        expect(setDraft).toHaveBeenCalledWith('');
        expect(focus).toHaveBeenCalledOnce();
    });

    it('commits the current draft on blur after completing the previous tag with Enter', () => {
        const onAdd = vi.fn();
        const focus = vi.fn();
        const wrapperRef = {current: null};
        const inputRef = {current: {focus}};
        const tagRefs = {current: []};
        const removeTagRefs = {current: []};
        const draftRef = {current: ''};
        const skipBlurCommit = {current: false};
        const idsByValue = {current: new WeakMap()};
        const nextId = {current: 0};

        mocks.useState
            .mockImplementationOnce(() => ['alpha', vi.fn()])
            .mockImplementationOnce(() => [true, vi.fn()])
            .mockImplementationOnce(() => [false, vi.fn()])
            .mockImplementationOnce(() => [0, vi.fn()])
            .mockImplementationOnce(() => ['beta', vi.fn()])
            .mockImplementationOnce(() => [true, vi.fn()])
            .mockImplementationOnce(() => [false, vi.fn()])
            .mockImplementationOnce(() => [0, vi.fn()]);

        const scrollListenerCleanupRef = {current: null};
        const isDraggingRef = {current: false};
        mocks.useRef
            .mockImplementationOnce(() => wrapperRef)
            .mockImplementationOnce(() => inputRef)
            .mockImplementationOnce(() => tagRefs)
            .mockImplementationOnce(() => removeTagRefs)
            .mockImplementationOnce(() => draftRef)
            .mockImplementationOnce(() => skipBlurCommit)
            .mockImplementationOnce(() => idsByValue)
            .mockImplementationOnce(() => nextId)
            .mockImplementationOnce(() => scrollListenerCleanupRef)
            .mockImplementationOnce(() => isDraggingRef)
            .mockImplementationOnce(() => wrapperRef)
            .mockImplementationOnce(() => inputRef)
            .mockImplementationOnce(() => tagRefs)
            .mockImplementationOnce(() => removeTagRefs)
            .mockImplementationOnce(() => draftRef)
            .mockImplementationOnce(() => skipBlurCommit)
            .mockImplementationOnce(() => idsByValue)
            .mockImplementationOnce(() => nextId)
            .mockImplementationOnce(() => scrollListenerCleanupRef)
            .mockImplementationOnce(() => isDraggingRef);

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
        getLastInputProps().onBlur({currentTarget: {value: 'beta'}});

        expect(onAdd).toHaveBeenNthCalledWith(1, ValueTypes.STRING.newValue('alpha'));
        expect(onAdd).toHaveBeenNthCalledWith(2, ValueTypes.STRING.newValue('beta'));
    });

    it('commits the latest typed draft on the first blur even before state rerenders', () => {
        const onAdd = vi.fn();
        const setDraft = vi.fn();
        const setIsInputActive = vi.fn();
        mocks.useState
            .mockImplementationOnce(() => ['', setDraft])
            .mockImplementationOnce(() => [true, setIsInputActive]);

        renderTagInput({
            onAdd,
            values: [],
            errors: [],
        });

        const inputProps = getLastInputProps();
        inputProps.onChange({currentTarget: {value: 'alpha'}});
        inputProps.onBlur({currentTarget: {value: 'alpha'}});

        expect(setDraft).toHaveBeenCalledWith('alpha');
        expect(onAdd).toHaveBeenCalledWith(ValueTypes.STRING.newValue('alpha'));
        expect(setDraft).toHaveBeenLastCalledWith('');
        expect(setIsInputActive).toHaveBeenCalledWith(false);
    });

    it('keeps duplicate draft text and marks the input invalid instead of clearing it', () => {
        const onAdd = vi.fn();
        const setDraft = vi.fn();
        const focus = vi.fn();
        mocks.useState.mockImplementationOnce(() => ['alpha', setDraft]).mockImplementationOnce(() => [true, vi.fn()]);

        renderTagInput({
            onAdd,
            values: [ValueTypes.STRING.newValue('alpha')],
            occurrences: Occurrences.minmax(0, 3),
            errors: [makeOccurrenceValidation(0)],
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

        expect(inputProps['aria-invalid']).toBe(true);
        expect(inputProps.className).toContain('[&>div[data-state]]:border-error!');
        expect(onAdd).not.toHaveBeenCalled();
        expect(setDraft).not.toHaveBeenCalled();
        expect(focus).not.toHaveBeenCalled();
    });

    it('commits the draft and moves focus to the previous visible tag on Escape', () => {
        const onAdd = vi.fn();
        const focusNewTag = vi.fn();
        const blur = vi.fn();
        const focusPreviousTag = vi.fn();
        const wrapperRef = {current: null};
        const inputRef = {current: null};
        const tagRefs = {current: [{focus: vi.fn()}, {focus: focusPreviousTag}, {focus: focusNewTag}]};
        const removeTagRefs = {current: []};
        const draftRef = {current: 'gamma'};
        const skipBlurCommit = {current: false};
        const idsByValue = {current: new WeakMap()};
        const nextId = {current: 0};
        const scrollListenerCleanupRef = {current: null};
        const isDraggingRef = {current: false};
        const setIsInputActive = vi.fn();

        mocks.useState
            .mockImplementationOnce(() => ['gamma', vi.fn()])
            .mockImplementationOnce(() => [true, setIsInputActive]);
        mocks.useRef
            .mockImplementationOnce(() => wrapperRef)
            .mockImplementationOnce(() => inputRef)
            .mockImplementationOnce(() => tagRefs)
            .mockImplementationOnce(() => removeTagRefs)
            .mockImplementationOnce(() => draftRef)
            .mockImplementationOnce(() => skipBlurCommit)
            .mockImplementationOnce(() => idsByValue)
            .mockImplementationOnce(() => nextId)
            .mockImplementationOnce(() => scrollListenerCleanupRef)
            .mockImplementationOnce(() => isDraggingRef);

        renderTagInput({
            onAdd,
            values: [ValueTypes.STRING.newValue('alpha'), ValueTypes.STRING.newValue('beta')],
            occurrences: Occurrences.minmax(0, 3),
        });

        const preventDefault = vi.fn();
        const inputProps = getLastInputProps();
        inputProps.onKeyDown({
            key: 'Escape',
            altKey: false,
            ctrlKey: false,
            metaKey: false,
            preventDefault,
            currentTarget: {blur, value: 'gamma'},
        });
        inputProps.onBlur({currentTarget: {value: 'gamma'}});

        expect(preventDefault).toHaveBeenCalledOnce();
        expect(onAdd).toHaveBeenCalledOnce();
        expect(onAdd).toHaveBeenCalledWith(ValueTypes.STRING.newValue('gamma'));
        expect(blur).toHaveBeenCalledOnce();
        expect(focusPreviousTag).toHaveBeenCalledOnce();
        expect(focusNewTag).not.toHaveBeenCalled();
        expect(setIsInputActive).toHaveBeenCalledWith(false);
    });

    it('closes an empty draft input and moves focus to the previous tag on Backspace', () => {
        const onRemove = vi.fn();
        const blur = vi.fn();
        const focusPreviousTag = vi.fn();
        const setIsInputActive = vi.fn();
        const wrapperRef = {current: null};
        const inputRef = {current: null};
        const tagRefs = {current: [{focus: vi.fn()}, {focus: vi.fn()}]};
        const removeTagRefs = {current: [{focus: vi.fn()}, {focus: focusPreviousTag}]};
        const draftRef = {current: ''};
        const skipBlurCommit = {current: false};
        const idsByValue = {current: new WeakMap()};
        const nextId = {current: 0};
        const scrollListenerCleanupRef = {current: null};
        const isDraggingRef = {current: false};

        mocks.useState
            .mockImplementationOnce(() => ['', vi.fn()])
            .mockImplementationOnce(() => [true, setIsInputActive]);
        mocks.useRef
            .mockImplementationOnce(() => wrapperRef)
            .mockImplementationOnce(() => inputRef)
            .mockImplementationOnce(() => tagRefs)
            .mockImplementationOnce(() => removeTagRefs)
            .mockImplementationOnce(() => draftRef)
            .mockImplementationOnce(() => skipBlurCommit)
            .mockImplementationOnce(() => idsByValue)
            .mockImplementationOnce(() => nextId)
            .mockImplementationOnce(() => scrollListenerCleanupRef)
            .mockImplementationOnce(() => isDraggingRef);

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
            currentTarget: {blur, selectionStart: 0, selectionEnd: 0},
        });

        expect(onRemove).not.toHaveBeenCalled();
        expect(blur).toHaveBeenCalledOnce();
        expect(focusPreviousTag).toHaveBeenCalledOnce();
        expect(setIsInputActive).toHaveBeenCalledWith(false);
    });

    it('commits the draft and moves focus to the previous tag on Backspace at cursor position zero', () => {
        const onAdd = vi.fn();
        const blur = vi.fn();
        const focusPreviousTag = vi.fn();
        const setIsInputActive = vi.fn();
        const wrapperRef = {current: null};
        const inputRef = {current: null};
        const tagRefs = {current: [{focus: vi.fn()}, {focus: vi.fn()}]};
        const removeTagRefs = {current: [{focus: vi.fn()}, {focus: focusPreviousTag}]};
        const draftRef = {current: 'gamma'};
        const skipBlurCommit = {current: false};
        const idsByValue = {current: new WeakMap()};
        const nextId = {current: 0};
        const scrollListenerCleanupRef = {current: null};
        const isDraggingRef = {current: false};

        mocks.useState
            .mockImplementationOnce(() => ['gamma', vi.fn()])
            .mockImplementationOnce(() => [true, setIsInputActive]);
        mocks.useRef
            .mockImplementationOnce(() => wrapperRef)
            .mockImplementationOnce(() => inputRef)
            .mockImplementationOnce(() => tagRefs)
            .mockImplementationOnce(() => removeTagRefs)
            .mockImplementationOnce(() => draftRef)
            .mockImplementationOnce(() => skipBlurCommit)
            .mockImplementationOnce(() => idsByValue)
            .mockImplementationOnce(() => nextId)
            .mockImplementationOnce(() => scrollListenerCleanupRef)
            .mockImplementationOnce(() => isDraggingRef);

        renderTagInput({
            onAdd,
            values: [ValueTypes.STRING.newValue('alpha'), ValueTypes.STRING.newValue('beta')],
            occurrences: Occurrences.minmax(0, 4),
        });

        const inputProps = getLastInputProps();
        inputProps.onKeyDown({
            key: 'Backspace',
            altKey: false,
            ctrlKey: false,
            metaKey: false,
            preventDefault: vi.fn(),
            currentTarget: {blur, value: 'gamma', selectionStart: 0, selectionEnd: 0},
        });

        expect(onAdd).toHaveBeenCalledWith(ValueTypes.STRING.newValue('gamma'));
        expect(blur).toHaveBeenCalledOnce();
        expect(focusPreviousTag).toHaveBeenCalledOnce();
        expect(setIsInputActive).toHaveBeenCalledWith(false);
    });

    it('commits the draft and moves focus to the previous tag on ArrowLeft at cursor position zero', () => {
        const onAdd = vi.fn();
        const focusPreviousTag = vi.fn();
        const setIsInputActive = vi.fn();
        const wrapperRef = {current: null};
        const inputRef = {current: null};
        const tagRefs = {current: [{focus: vi.fn()}]};
        const removeTagRefs = {current: [{focus: focusPreviousTag}]};
        const draftRef = {current: 'beta'};
        const skipBlurCommit = {current: false};
        const idsByValue = {current: new WeakMap()};
        const nextId = {current: 0};
        const scrollListenerCleanupRef = {current: null};
        const isDraggingRef = {current: false};

        mocks.useState
            .mockImplementationOnce(() => ['beta', vi.fn()])
            .mockImplementationOnce(() => [true, setIsInputActive]);
        mocks.useRef
            .mockImplementationOnce(() => wrapperRef)
            .mockImplementationOnce(() => inputRef)
            .mockImplementationOnce(() => tagRefs)
            .mockImplementationOnce(() => removeTagRefs)
            .mockImplementationOnce(() => draftRef)
            .mockImplementationOnce(() => skipBlurCommit)
            .mockImplementationOnce(() => idsByValue)
            .mockImplementationOnce(() => nextId)
            .mockImplementationOnce(() => scrollListenerCleanupRef)
            .mockImplementationOnce(() => isDraggingRef);

        renderTagInput({
            onAdd,
            values: [ValueTypes.STRING.newValue('alpha')],
            occurrences: Occurrences.minmax(0, 3),
        });

        const inputProps = getLastInputProps();
        const blur = vi.fn();
        inputProps.onKeyDown({
            key: 'ArrowLeft',
            altKey: false,
            ctrlKey: false,
            metaKey: false,
            preventDefault: vi.fn(),
            currentTarget: {blur, value: 'beta', selectionStart: 0, selectionEnd: 0},
        });

        expect(onAdd).toHaveBeenCalledWith(ValueTypes.STRING.newValue('beta'));
        expect(blur).toHaveBeenCalledOnce();
        expect(focusPreviousTag).toHaveBeenCalledOnce();
        expect(setIsInputActive).toHaveBeenCalledWith(false);
    });

    it('removes the focused tag when the remove button handles a keyboard activation', () => {
        const onRemove = vi.fn();

        renderTagInput({
            onRemove,
            values: [ValueTypes.STRING.newValue('alpha'), ValueTypes.STRING.newValue('beta')],
            occurrences: Occurrences.minmax(0, 3),
        });

        const preventDefault = vi.fn();
        const stopPropagation = vi.fn();
        getFirstRemoveButtonProps().onKeyDown({
            key: 'Enter',
            altKey: false,
            ctrlKey: false,
            metaKey: false,
            preventDefault,
            stopPropagation,
        });

        expect(preventDefault).toHaveBeenCalledOnce();
        expect(stopPropagation).toHaveBeenCalledOnce();
        expect(onRemove).toHaveBeenCalledWith(0);
    });

    it('focuses the input after removing a tag with Space on the remove button', () => {
        const onRemove = vi.fn();
        const focus = vi.fn();
        const setIsInputActive = vi.fn();
        const wrapperRef = {current: null};
        const inputRef = {current: {focus}};
        const tagRefs = {current: []};
        const removeTagRefs = {current: []};
        const draftRef = {current: ''};
        const skipBlurCommit = {current: false};
        const idsByValue = {current: new WeakMap()};
        const nextId = {current: 0};

        mocks.useState
            .mockImplementationOnce(() => ['', vi.fn()])
            .mockImplementationOnce(() => [false, setIsInputActive]);
        mocks.useRef
            .mockImplementationOnce(() => wrapperRef)
            .mockImplementationOnce(() => inputRef)
            .mockImplementationOnce(() => tagRefs)
            .mockImplementationOnce(() => removeTagRefs)
            .mockImplementationOnce(() => draftRef)
            .mockImplementationOnce(() => skipBlurCommit)
            .mockImplementationOnce(() => idsByValue)
            .mockImplementationOnce(() => nextId);

        renderTagInput({
            onRemove,
            values: [ValueTypes.STRING.newValue('alpha'), ValueTypes.STRING.newValue('beta')],
            occurrences: Occurrences.minmax(0, 3),
        });

        getFirstRemoveButtonProps().onKeyDown({
            key: ' ',
            altKey: false,
            ctrlKey: false,
            metaKey: false,
            preventDefault: vi.fn(),
            stopPropagation: vi.fn(),
        });

        expect(onRemove).toHaveBeenCalledWith(0);
        expect(setIsInputActive).toHaveBeenCalledWith(true);
        expect(focus).toHaveBeenCalledOnce();
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

        getFirstRemoveButtonProps().onClick();

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

        getFirstRemoveButtonProps().onClick();

        expect(onAdd).toHaveBeenCalledWith(ValueTypes.STRING.newValue('gamma'));
        expect(setDraft).toHaveBeenCalledWith('');
        expect(onRemove).toHaveBeenCalledWith(0);
        expect(setIsInputActive).toHaveBeenCalledWith(false);
    });

    it('removes the original tag after committing a draft into a hidden slot by click', () => {
        const onAdd = vi.fn();
        const onChange = vi.fn();
        const onMove = vi.fn();
        const onRemove = vi.fn();
        const setDraft = vi.fn();
        const setIsInputActive = vi.fn();
        mocks.useState
            .mockImplementationOnce(() => ['gamma', setDraft])
            .mockImplementationOnce(() => [true, setIsInputActive]);

        renderTagInput({
            onAdd,
            onChange,
            onMove,
            onRemove,
            values: [
                ValueTypes.STRING.newValue('alpha'),
                ValueTypes.STRING.newValue(''),
                ValueTypes.STRING.newValue('beta'),
            ],
            errors: [makeOccurrenceValidation(0), makeHiddenBlankValidation(1), makeOccurrenceValidation(2)],
            occurrences: Occurrences.minmax(0, 4),
        });

        getIconButtonProps('field.occurrence.action.remove', 1).onClick();

        expect(onMove).toHaveBeenCalledWith(2, 1);
        expect(onChange).toHaveBeenCalledWith(2, ValueTypes.STRING.newValue('gamma'), 'gamma');
        expect(onAdd).not.toHaveBeenCalled();
        expect(onRemove).toHaveBeenCalledWith(1);
        expect(setDraft).toHaveBeenCalledWith('');
        expect(setIsInputActive).toHaveBeenCalledWith(false);
    });

    it('does not commit the same draft twice when closing another tag and then blurring', () => {
        const onAdd = vi.fn();
        const onRemove = vi.fn();
        const setDraft = vi.fn();
        const setIsInputActive = vi.fn();
        const wrapperRef = {current: null};
        const inputRef = {current: {focus: vi.fn()}};
        const tagRefs = {current: []};
        const removeTagRefs = {current: []};
        const draftRef = {current: ''};
        const skipBlurCommit = {current: false};
        const idsByValue = {current: new WeakMap()};
        const nextId = {current: 0};

        mocks.useState
            .mockImplementationOnce(() => ['gamma', setDraft])
            .mockImplementationOnce(() => [true, setIsInputActive])
            .mockImplementationOnce(() => [false, vi.fn()]);
        mocks.useRef
            .mockImplementationOnce(() => wrapperRef)
            .mockImplementationOnce(() => inputRef)
            .mockImplementationOnce(() => tagRefs)
            .mockImplementationOnce(() => removeTagRefs)
            .mockImplementationOnce(() => draftRef)
            .mockImplementationOnce(() => skipBlurCommit)
            .mockImplementationOnce(() => idsByValue)
            .mockImplementationOnce(() => nextId);

        renderTagInput({
            onAdd,
            onRemove,
            values: [ValueTypes.STRING.newValue('alpha'), ValueTypes.STRING.newValue('beta')],
            occurrences: Occurrences.minmax(0, 4),
        });

        const iconButtonProps = getFirstRemoveButtonProps();
        const inputProps = getLastInputProps();

        iconButtonProps.onPointerDown({preventDefault: vi.fn()});
        iconButtonProps.onClick();
        inputProps.onBlur({currentTarget: {value: 'gamma'}});

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

        const iconButtonProps = getFirstRemoveButtonProps();
        const inputProps = getLastInputProps();

        iconButtonProps.onPointerDown({preventDefault: vi.fn()});
        iconButtonProps.onClick();
        inputProps.onBlur({currentTarget: {value: ''}});

        expect(setIsInputActive).toHaveBeenCalledTimes(1);
        expect(setIsInputActive).toHaveBeenCalledWith(false);
    });

    it('keeps keyboard drag on the drag button while remove button keys stay separate', () => {
        const sortableKeyDown = vi.fn();
        const onRemove = vi.fn();
        mocks.useSortable.mockImplementation(() => ({
            attributes: {tabIndex: 0},
            listeners: {onKeyDown: sortableKeyDown},
            setNodeRef: vi.fn(),
            transform: null,
            transition: null,
            isDragging: false,
        }));

        renderTagInput({
            onRemove,
            values: [ValueTypes.STRING.newValue('alpha'), ValueTypes.STRING.newValue('beta')],
            occurrences: Occurrences.minmax(0, 3),
        });

        getFirstDragButtonProps().onKeyDown({
            key: 'Enter',
            altKey: false,
            ctrlKey: false,
            metaKey: false,
            preventDefault: vi.fn(),
        });

        const preventDefault = vi.fn();
        const stopPropagation = vi.fn();
        getFirstRemoveButtonProps().onKeyDown({
            key: 'Enter',
            altKey: false,
            ctrlKey: false,
            metaKey: false,
            preventDefault,
            stopPropagation,
        });

        expect(sortableKeyDown).toHaveBeenCalledTimes(1);
        expect(preventDefault).toHaveBeenCalledOnce();
        expect(stopPropagation).toHaveBeenCalledOnce();
        expect(onRemove).toHaveBeenCalledWith(0);
    });

    it('blurs the focused drag button on Escape', () => {
        const blur = vi.fn();

        renderTagInput({
            values: [ValueTypes.STRING.newValue('alpha'), ValueTypes.STRING.newValue('beta')],
            occurrences: Occurrences.minmax(0, 3),
        });

        const preventDefault = vi.fn();
        getFirstDragButtonProps().onKeyDown({
            key: 'Escape',
            altKey: false,
            ctrlKey: false,
            metaKey: false,
            preventDefault,
            currentTarget: {blur},
        });

        expect(preventDefault).toHaveBeenCalledOnce();
        expect(blur).toHaveBeenCalledOnce();
    });

    it('uses ordinary handle navigation when aria-pressed is the string false', () => {
        const sortableKeyDown = vi.fn();
        mocks.useSortable.mockImplementation(() => ({
            attributes: {tabIndex: 0, 'aria-pressed': 'false'},
            listeners: {onKeyDown: sortableKeyDown},
            setNodeRef: vi.fn(),
            transform: null,
            transition: null,
            isDragging: false,
        }));

        renderTagInput({
            values: [ValueTypes.STRING.newValue('alpha'), ValueTypes.STRING.newValue('beta')],
            occurrences: Occurrences.minmax(0, 3),
        });

        const preventDefault = vi.fn();
        getFirstDragButtonProps().onKeyDown({
            key: 'ArrowDown',
            altKey: false,
            ctrlKey: false,
            metaKey: false,
            preventDefault,
        });

        expect(preventDefault).toHaveBeenCalledOnce();
        expect(sortableKeyDown).not.toHaveBeenCalled();
    });

    it('prevents native arrow scrolling on the drag handle during keydown capture', () => {
        renderTagInput({
            values: [ValueTypes.STRING.newValue('alpha'), ValueTypes.STRING.newValue('beta')],
            occurrences: Occurrences.minmax(0, 3),
        });

        const preventDefault = vi.fn();
        getFirstDragButtonProps().onKeyDownCapture({
            key: 'ArrowDown',
            altKey: false,
            ctrlKey: false,
            metaKey: false,
            preventDefault,
        });

        expect(preventDefault).toHaveBeenCalledOnce();
    });

    it('uses ordinary handle navigation when aria-pressed is undefined', () => {
        const sortableKeyDown = vi.fn();
        mocks.useSortable.mockImplementation(() => ({
            attributes: {tabIndex: 0},
            listeners: {onKeyDown: sortableKeyDown},
            setNodeRef: vi.fn(),
            transform: null,
            transition: null,
            isDragging: false,
        }));

        renderTagInput({
            values: [ValueTypes.STRING.newValue('alpha'), ValueTypes.STRING.newValue('beta')],
            occurrences: Occurrences.minmax(0, 3),
        });

        const preventDefault = vi.fn();
        getFirstDragButtonProps().onKeyDown({
            key: 'ArrowUp',
            altKey: false,
            ctrlKey: false,
            metaKey: false,
            preventDefault,
        });

        expect(preventDefault).toHaveBeenCalledOnce();
        expect(sortableKeyDown).not.toHaveBeenCalled();
    });

    it('moves focus from drag button to remove button on ArrowRight', () => {
        const focus = vi.fn();
        const wrapperRef = {current: null};
        const inputRef = {current: null};
        const tagRefs = {current: []};
        const removeTagRefs = {current: []};
        const draftRef = {current: ''};
        const skipBlurCommit = {current: false};
        const idsByValue = {current: new WeakMap()};
        const nextId = {current: 0};
        const scrollListenerCleanupRef = {current: null};
        const isDraggingRef = {current: false};
        const dragButtonRef = {current: null};
        const removeButtonRef = {current: {focus}};

        mocks.useRef
            .mockImplementationOnce(() => wrapperRef)
            .mockImplementationOnce(() => inputRef)
            .mockImplementationOnce(() => tagRefs)
            .mockImplementationOnce(() => removeTagRefs)
            .mockImplementationOnce(() => draftRef)
            .mockImplementationOnce(() => skipBlurCommit)
            .mockImplementationOnce(() => idsByValue)
            .mockImplementationOnce(() => nextId)
            .mockImplementationOnce(() => scrollListenerCleanupRef)
            .mockImplementationOnce(() => isDraggingRef)
            .mockImplementationOnce(() => dragButtonRef)
            .mockImplementationOnce(() => removeButtonRef);

        renderTagInput({
            values: [ValueTypes.STRING.newValue('alpha'), ValueTypes.STRING.newValue('beta')],
            occurrences: Occurrences.minmax(0, 3),
            errors: [makeOccurrenceValidation(0), makeOccurrenceValidation(1)],
        });

        const preventDefault = vi.fn();
        getFirstDragButtonProps().onKeyDown({
            key: 'ArrowRight',
            shiftKey: false,
            altKey: false,
            ctrlKey: false,
            metaKey: false,
            preventDefault,
        });

        expect(preventDefault).toHaveBeenCalledOnce();
        expect(focus).toHaveBeenCalledOnce();
    });

    it('moves focus from remove button to drag button on ArrowLeft', () => {
        const focus = vi.fn();
        const wrapperRef = {current: null};
        const inputRef = {current: null};
        const tagRefs = {current: []};
        const removeTagRefs = {current: []};
        const draftRef = {current: ''};
        const skipBlurCommit = {current: false};
        const idsByValue = {current: new WeakMap()};
        const nextId = {current: 0};
        const scrollListenerCleanupRef = {current: null};
        const isDraggingRef = {current: false};
        const dragButtonRef = {current: {focus}};
        const removeButtonRef = {current: null};

        mocks.useRef
            .mockImplementationOnce(() => wrapperRef)
            .mockImplementationOnce(() => inputRef)
            .mockImplementationOnce(() => tagRefs)
            .mockImplementationOnce(() => removeTagRefs)
            .mockImplementationOnce(() => draftRef)
            .mockImplementationOnce(() => skipBlurCommit)
            .mockImplementationOnce(() => idsByValue)
            .mockImplementationOnce(() => nextId)
            .mockImplementationOnce(() => scrollListenerCleanupRef)
            .mockImplementationOnce(() => isDraggingRef)
            .mockImplementationOnce(() => dragButtonRef)
            .mockImplementationOnce(() => removeButtonRef);

        renderTagInput({
            values: [ValueTypes.STRING.newValue('alpha'), ValueTypes.STRING.newValue('beta')],
            occurrences: Occurrences.minmax(0, 3),
            errors: [makeOccurrenceValidation(0), makeOccurrenceValidation(1)],
        });

        const preventDefault = vi.fn();
        getFirstRemoveButtonProps().onKeyDown({
            key: 'ArrowLeft',
            altKey: false,
            ctrlKey: false,
            metaKey: false,
            preventDefault,
        });

        expect(preventDefault).toHaveBeenCalledOnce();
        expect(focus).toHaveBeenCalledOnce();
    });

    it('navigates to the next tag on ArrowRight from remove button', () => {
        const focusNextTag = vi.fn();
        const wrapperRef = {current: null};
        const inputRef = {current: null};
        const tagRefs = {current: [null, {focus: focusNextTag}]};
        const removeTagRefs = {current: []};
        const draftRef = {current: ''};
        const skipBlurCommit = {current: false};
        const idsByValue = {current: new WeakMap()};
        const nextId = {current: 0};
        const scrollListenerCleanupRef = {current: null};
        const isDraggingRef = {current: false};

        mocks.useRef
            .mockImplementationOnce(() => wrapperRef)
            .mockImplementationOnce(() => inputRef)
            .mockImplementationOnce(() => tagRefs)
            .mockImplementationOnce(() => removeTagRefs)
            .mockImplementationOnce(() => draftRef)
            .mockImplementationOnce(() => skipBlurCommit)
            .mockImplementationOnce(() => idsByValue)
            .mockImplementationOnce(() => nextId)
            .mockImplementationOnce(() => scrollListenerCleanupRef)
            .mockImplementationOnce(() => isDraggingRef);

        renderTagInput({
            values: [ValueTypes.STRING.newValue('alpha'), ValueTypes.STRING.newValue('beta')],
            occurrences: Occurrences.minmax(0, 3),
            errors: [makeOccurrenceValidation(0), makeOccurrenceValidation(1)],
        });

        const preventDefault = vi.fn();
        getFirstRemoveButtonProps().onKeyDown({
            key: 'ArrowRight',
            altKey: false,
            ctrlKey: false,
            metaKey: false,
            preventDefault,
        });

        expect(preventDefault).toHaveBeenCalledOnce();
        expect(focusNextTag).toHaveBeenCalledOnce();
    });

    it('reorders immediately with left and right arrow keys during keyboard drag', () => {
        const sortableKeyDown = vi.fn();
        const onMove = vi.fn();
        mocks.useSortable.mockImplementation(() => ({
            attributes: {tabIndex: 0, 'aria-pressed': 'true'},
            listeners: {onKeyDown: sortableKeyDown},
            setNodeRef: vi.fn(),
            transform: null,
            transition: null,
            isDragging: false,
        }));

        renderTagInput({
            onMove,
            values: [ValueTypes.STRING.newValue('alpha'), ValueTypes.STRING.newValue('beta')],
            occurrences: Occurrences.minmax(0, 3),
        });

        const preventDefault = vi.fn();
        const event = {
            key: 'ArrowRight',
            altKey: false,
            ctrlKey: false,
            metaKey: false,
            preventDefault,
        };

        getFirstDragButtonProps().onKeyDown(event);

        expect(preventDefault).toHaveBeenCalledOnce();
        expect(onMove).toHaveBeenCalledWith(0, 1);
        expect(sortableKeyDown).not.toHaveBeenCalled();
    });

    it('ignores up and down arrow keys during keyboard drag', () => {
        const sortableKeyDown = vi.fn();
        const onMove = vi.fn();
        mocks.useSortable.mockImplementation(() => ({
            attributes: {tabIndex: 0, 'aria-pressed': 'true'},
            listeners: {onKeyDown: sortableKeyDown},
            setNodeRef: vi.fn(),
            transform: null,
            transition: null,
            isDragging: false,
        }));

        renderTagInput({
            onMove,
            values: [ValueTypes.STRING.newValue('alpha'), ValueTypes.STRING.newValue('beta')],
            occurrences: Occurrences.minmax(0, 3),
        });

        const preventDefault = vi.fn();
        getFirstDragButtonProps().onKeyDown({
            key: 'ArrowDown',
            altKey: false,
            ctrlKey: false,
            metaKey: false,
            preventDefault,
        });

        expect(preventDefault).toHaveBeenCalledOnce();
        expect(onMove).not.toHaveBeenCalled();
        expect(sortableKeyDown).not.toHaveBeenCalled();
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
