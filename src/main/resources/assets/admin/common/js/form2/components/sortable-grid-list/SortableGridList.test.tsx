import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import type {SortableGridListProps} from './SortableGridList';
import {SortableGridList} from './SortableGridList';

type Item = {
    id: string;
    label: string;
};

type VNode = {
    type: unknown;
    props: Record<string, unknown>;
    ref?: ((node: RowNode | null) => void) | null;
};

type ListNode = {
    contains: ReturnType<typeof vi.fn<(target: unknown) => boolean>>;
};

type SortableMockResult = {
    attributes: Record<string, unknown>;
    listeners: Record<string, unknown>;
    setNodeRef: ReturnType<typeof vi.fn>;
    transform: null;
    transition: null;
    isDragging: boolean;
};

type RowNode = {
    contains: ReturnType<typeof vi.fn>;
    focus: ReturnType<typeof vi.fn<() => void>>;
    querySelectorAll: ReturnType<typeof vi.fn>;
};

type FocusTargetNode = {
    contains: ReturnType<typeof vi.fn>;
    focus: ReturnType<typeof vi.fn<() => void>>;
    getAttribute: ReturnType<typeof vi.fn>;
    setAttribute: ReturnType<typeof vi.fn>;
    removeAttribute: ReturnType<typeof vi.fn>;
    closest: ReturnType<typeof vi.fn>;
    tabIndex: number;
    tagName: string;
    type?: string;
    disabled?: boolean;
    isContentEditable?: boolean;
};

const ITEMS: Item[] = [
    {id: 'apple', label: 'Apple'},
    {id: 'banana', label: 'Banana'},
    {id: 'cherry', label: 'Cherry'},
];

const mocks = vi.hoisted(() => ({
    useMemo: vi.fn((factory: () => unknown) => factory()),
    useCallback: vi.fn((callback: unknown) => callback),
    useEffect: vi.fn(),
    useLayoutEffect: vi.fn(),
    useRef: vi.fn((initial: unknown) => ({current: initial})),
    useState: vi.fn(),
    useSensor: vi.fn((sensor: unknown, options: unknown) => ({sensor, options})),
    useSensors: vi.fn((...sensors: unknown[]) => sensors),
    useSortable: vi.fn(),
    dndContext: vi.fn(({children}: {children: unknown}) => children),
    sortableContext: vi.fn(({children}: {children: unknown}) => children),
    cn: vi.fn((...tokens: Array<string | false | undefined>) => tokens.filter(Boolean).join(' ')),
    gripVertical: vi.fn(() => null),
}));

vi.mock('react', () => ({
    useMemo: mocks.useMemo,
    useCallback: mocks.useCallback,
    useEffect: mocks.useEffect,
    useLayoutEffect: mocks.useLayoutEffect,
    useRef: mocks.useRef,
    useState: mocks.useState,
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
    SortableContext: mocks.sortableContext,
    sortableKeyboardCoordinates: vi.fn(),
    useSortable: mocks.useSortable,
    verticalListSortingStrategy: 'verticalListSortingStrategy',
}));

vi.mock('@enonic/ui', () => ({
    cn: mocks.cn,
}));

vi.mock('lucide-react', () => ({
    GripVertical: mocks.gripVertical,
}));

let focusedIndexState = 0;
let focusedIndexSetter: ReturnType<typeof vi.fn>;
let focusedTargetIndexState = 0;
let focusedTargetIndexSetter: ReturnType<typeof vi.fn>;
let focusedItemIdState: string | null;
let focusedItemIdSetter: ReturnType<typeof vi.fn>;
let hasFocusWithinRef: {current: boolean};
let pendingBlurClearVersionRef: {current: number};
let rowRefsRef: {current: Array<RowNode | null>};
let sortableEntries: Map<string, SortableMockResult>;
let animationFrameCallbacks: FrameRequestCallback[];

function ensureSortableEntry(id: string): SortableMockResult {
    let entry = sortableEntries.get(id);

    if (entry == null) {
        entry = {
            attributes: {
                role: 'button',
                tabIndex: 0,
            },
            listeners: {
                onKeyDown: vi.fn(),
            },
            setNodeRef: vi.fn(),
            transform: null,
            transition: null,
            isDragging: false,
        };
        sortableEntries.set(id, entry);
    }

    return entry;
}

function configureSortableEntry(
    id: string,
    overrides: Partial<SortableMockResult> & {
        attributes?: Record<string, unknown>;
        listeners?: Record<string, unknown>;
    } = {},
): SortableMockResult {
    const entry = ensureSortableEntry(id);

    if (overrides.attributes != null) {
        entry.attributes = {...entry.attributes, ...overrides.attributes};
    }

    if (overrides.listeners != null) {
        entry.listeners = {...entry.listeners, ...overrides.listeners};
    }

    if (overrides.setNodeRef != null) {
        entry.setNodeRef = overrides.setNodeRef;
    }

    if (overrides.transform !== undefined) {
        entry.transform = overrides.transform;
    }

    if (overrides.transition !== undefined) {
        entry.transition = overrides.transition;
    }

    if (overrides.isDragging !== undefined) {
        entry.isDragging = overrides.isDragging;
    }

    return entry;
}

function findAllElementsInTree(node: unknown, predicate: (element: VNode) => boolean): VNode[] {
    if (node == null || typeof node !== 'object') {
        return [];
    }

    if (Array.isArray(node)) {
        return node.flatMap(child => findAllElementsInTree(child, predicate));
    }

    if (!('type' in node) || !('props' in node)) {
        return [];
    }

    const element = node as VNode;
    if (typeof element.type === 'function') {
        return findAllElementsInTree(element.type(element.props), predicate);
    }

    const matches = predicate(element) ? [element] : [];
    return [...matches, ...findAllElementsInTree(element.props.children, predicate)];
}

function makeProps(overrides: Partial<SortableGridListProps<Item>> = {}): SortableGridListProps<Item> {
    return {
        items: ITEMS,
        keyExtractor: item => item.id,
        onMove: vi.fn(),
        enabled: true,
        dragLabel: 'Drag to reorder',
        renderItem: ({item}) => item.label,
        ...overrides,
    };
}

function renderList(overrides: Partial<SortableGridListProps<Item>> = {}): {list: VNode; rows: VNode[]} {
    const tree = SortableGridList(makeProps(overrides));
    const list = findAllElementsInTree(
        tree,
        element => element.type === 'div' && element.props['data-component'] === 'SortableGridList',
    )[0];
    const rows = findAllElementsInTree(
        tree,
        element =>
            element.type === 'div' &&
            typeof element.ref === 'function' &&
            typeof element.props.onKeyDown === 'function' &&
            typeof element.props.onFocus === 'function' &&
            typeof element.props.onBlur === 'function',
    );

    if (list == null) {
        throw new Error('SortableGridList root was not rendered');
    }

    return {list, rows};
}

function getRowElements(overrides: Partial<SortableGridListProps<Item>> = {}): VNode[] {
    return renderList(overrides).rows;
}

function getDndContextProps(): Record<string, unknown> {
    const call = mocks.dndContext.mock.lastCall;

    if (call == null) {
        throw new Error('DndContext was not rendered');
    }

    return call[0];
}

function createFocusTarget({
    tagName = 'BUTTON',
    type,
    tabIndex = 0,
    role,
    isContentEditable = false,
}: {
    tagName?: string;
    type?: string;
    tabIndex?: number;
    role?: string;
    isContentEditable?: boolean;
} = {}): FocusTargetNode {
    const attributes = new Map<string, string>();
    if (role != null) {
        attributes.set('role', role);
    }

    const target: FocusTargetNode = {
        contains: vi.fn(node => node === target),
        focus: vi.fn(),
        getAttribute: vi.fn((name: string) => attributes.get(name) ?? null),
        setAttribute: vi.fn((name: string, value: string) => {
            attributes.set(name, value);
            if (name === 'tabindex') {
                target.tabIndex = Number(value);
            }
        }),
        removeAttribute: vi.fn((name: string) => {
            attributes.delete(name);
        }),
        closest: vi.fn(() => null),
        tabIndex,
        tagName,
        type,
        disabled: false,
        isContentEditable,
    };

    return target;
}

function mountRows(rows: VNode[], descendantsByRow: FocusTargetNode[][] = []): RowNode[] {
    return rows.map((row, index) => {
        const descendants = descendantsByRow[index] ?? [];
        const node: RowNode = {
            contains: vi.fn(target => target === node || descendants.includes(target as FocusTargetNode)),
            focus: vi.fn(() => {
                (row.props.onFocus as ((event: unknown) => void) | undefined)?.({
                    currentTarget: node,
                    target: node,
                });
            }),
            querySelectorAll: vi.fn(() => descendants),
        };

        descendants.forEach(descendant => {
            descendant.focus.mockImplementation(() => {
                (row.props.onFocus as ((event: unknown) => void) | undefined)?.({
                    currentTarget: node,
                    target: descendant,
                });
            });
        });

        row.ref?.(node);
        return node;
    });
}

function createKeyEvent(
    key: string,
    currentTarget: unknown,
    target: unknown = currentTarget,
    options: {shiftKey?: boolean} = {},
) {
    return {
        key,
        currentTarget,
        target,
        shiftKey: options.shiftKey ?? false,
        preventDefault: vi.fn(),
    };
}

function flushAnimationFrames(): void {
    const queuedCallbacks = [...animationFrameCallbacks];
    animationFrameCallbacks.length = 0;
    queuedCallbacks.forEach(callback => {
        callback(0);
    });
}

async function flushMicrotasks(): Promise<void> {
    await Promise.resolve();
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
    const next = [...items];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    return next;
}

describe('SortableGridList', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        focusedIndexState = 0;
        focusedTargetIndexState = 0;
        focusedIndexSetter = vi.fn((value: number | ((current: number) => number)) => {
            focusedIndexState = typeof value === 'function' ? value(focusedIndexState) : value;
        });
        focusedTargetIndexSetter = vi.fn((value: number | ((current: number) => number)) => {
            focusedTargetIndexState = typeof value === 'function' ? value(focusedTargetIndexState) : value;
        });
        focusedItemIdState = ITEMS[0]?.id ?? null;
        focusedItemIdSetter = vi.fn((value: string | null | ((current: string | null) => string | null)) => {
            focusedItemIdState = typeof value === 'function' ? value(focusedItemIdState) : value;
        });
        hasFocusWithinRef = {current: false};
        pendingBlurClearVersionRef = {current: 0};
        rowRefsRef = {current: []};
        sortableEntries = new Map();
        animationFrameCallbacks = [];
        let numericStateCallCount = 0;

        vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
            animationFrameCallbacks.push(callback);
            return animationFrameCallbacks.length;
        });

        mocks.useMemo.mockImplementation((factory: () => unknown) => factory());
        mocks.useCallback.mockImplementation((callback: unknown) => callback);
        mocks.useEffect.mockImplementation((effect: () => unknown) => {
            effect();
        });
        mocks.useLayoutEffect.mockImplementation((effect: () => unknown) => {
            effect();
        });
        mocks.useRef.mockImplementation((initial: unknown) => {
            if (Array.isArray(initial)) {
                return rowRefsRef;
            }

            if (initial === false) {
                return hasFocusWithinRef;
            }

            if (initial === 0) {
                return pendingBlurClearVersionRef;
            }

            return {current: initial};
        });
        mocks.useState.mockImplementation((initial: unknown) => {
            const resolved = typeof initial === 'function' ? (initial as () => unknown)() : initial;
            if (typeof resolved === 'number') {
                numericStateCallCount += 1;
                return numericStateCallCount % 2 === 1
                    ? [focusedIndexState, focusedIndexSetter]
                    : [focusedTargetIndexState, focusedTargetIndexSetter];
            }

            if (resolved == null || (typeof resolved === 'string' && ITEMS.some(item => item.id === resolved))) {
                return [focusedItemIdState, focusedItemIdSetter];
            }

            return [resolved, vi.fn()];
        });
        mocks.useSortable.mockImplementation(({id}: {id: string}) => ensureSortableEntry(String(id)));
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('keeps Space delegated to dnd-kit so pickup and drop stay unchanged', () => {
        const firstRowKeyDown = vi.fn();
        configureSortableEntry('apple', {listeners: {onKeyDown: firstRowKeyDown}});

        const rows = getRowElements();
        const nodes = mountRows(rows);

        const event = createKeyEvent(' ', nodes[0]);
        (rows[0].props.onKeyDown as ((event: unknown) => void) | undefined)?.(event);

        expect(firstRowKeyDown).toHaveBeenCalledWith(event);
        expect(focusedIndexSetter).not.toHaveBeenCalled();
    });

    it('defaults to one row tabIndex=0 initially', () => {
        const rows = getRowElements();

        expect(rows.map(row => row.props.tabIndex)).toEqual([0, -1, -1]);
    });

    it('keeps single-item lists out of the tab order in the default mode', () => {
        const rows = getRowElements({items: ITEMS.slice(0, 1)});

        expect(rows[0]?.props.tabIndex).toBeUndefined();
    });

    it('keeps row descendants out of the Tab order', () => {
        const rows = getRowElements();
        const firstButton = createFocusTarget();
        const secondButton = createFocusTarget();
        mountRows(rows, [[firstButton, secondButton], [], []]);

        expect(firstButton.tabIndex).toBe(-1);
        expect(secondButton.tabIndex).toBe(-1);
    });

    it('keeps single-item row descendants in the Tab order', () => {
        const rows = getRowElements({items: ITEMS.slice(0, 1)});
        const firstButton = createFocusTarget();
        const secondButton = createFocusTarget();
        mountRows(rows, [[firstButton, secondButton]]);

        expect(firstButton.tabIndex).toBe(0);
        expect(secondButton.tabIndex).toBe(0);
    });

    it('keeps immovable rows in the row roving model when the list has multiple items', () => {
        focusedIndexState = 1;

        const rows = getRowElements({
            isItemMovable: item => item.id !== 'banana',
        });
        const middleButton = createFocusTarget();
        mountRows(rows, [[], [middleButton], []]);

        expect(rows.map(row => row.props.tabIndex)).toEqual([-1, 0, -1]);
        expect(middleButton.tabIndex).toBe(-1);
    });

    it('disables dragging for rows where isItemMovable returns false', () => {
        getRowElements({
            isItemMovable: item => item.id !== 'banana',
        });

        const sortableConfigs = mocks.useSortable.mock.calls
            .slice(-ITEMS.length)
            .map(([config]) => config as {disabled: boolean});

        expect(sortableConfigs.map(config => config.disabled)).toEqual([false, true, false]);
    });

    it('omits draggable semantics for rows where isItemMovable returns false', () => {
        focusedIndexState = 1;

        const rows = getRowElements({
            isItemMovable: item => item.id !== 'banana',
        });

        expect(rows[1]?.props.role).toBeUndefined();
        expect(rows[1]?.props['aria-disabled']).toBeUndefined();
        expect(rows[1]?.props['aria-roledescription']).toBeUndefined();
        expect(rows[1]?.props['aria-describedby']).toBeUndefined();
        expect(rows[1]?.props.tabIndex).toBe(0);
        expect(rows[0]?.props.role).toBe('button');
        expect(rows[2]?.props.role).toBe('button');
    });

    it('syncs late-mounted descendants into the row roving model on focus', () => {
        const rows = getRowElements();
        const nodes = mountRows(rows);
        const lateButton = createFocusTarget();

        nodes[0].querySelectorAll.mockImplementation(() => [lateButton]);

        (rows[0].props.onFocus as ((event: unknown) => void) | undefined)?.({
            currentTarget: nodes[0],
            target: nodes[0],
        });

        expect(lateButton.tabIndex).toBe(-1);
        expect(lateButton.setAttribute).toHaveBeenCalledWith(
            'data-sortable-list-navigation-target-tabindex',
            '__implicit__',
        );
        expect(lateButton.setAttribute).toHaveBeenCalledWith('data-sortable-list-effective-tabindex', '0');
    });

    it('treats composite descendants as a single row target', () => {
        const rows = getRowElements();
        const compositeRoot = createFocusTarget({tagName: 'DIV'});
        const compositeInnerButton = createFocusTarget();

        (compositeRoot.setAttribute as unknown as (name: string, value: string) => void)(
            'data-sortable-list-composite-target',
            'true',
        );
        compositeInnerButton.closest.mockImplementation((selector: string) => {
            if (selector === '[data-sortable-list-composite-target="true"]') {
                return compositeRoot;
            }

            return null;
        });
        const nodes = mountRows(rows, [[compositeRoot, compositeInnerButton], [], []]);

        const event = createKeyEvent('ArrowRight', nodes[0]);
        (rows[0].props.onKeyDown as ((event: unknown) => void) | undefined)?.(event);

        expect(event.preventDefault).toHaveBeenCalledOnce();
        expect(compositeRoot.focus).toHaveBeenCalledOnce();
        expect(compositeInnerButton.focus).not.toHaveBeenCalled();
        expect(focusedTargetIndexSetter).toHaveBeenCalledWith(1);
    });

    it('moves focus to the next row on ArrowDown before keyboard drag starts', () => {
        const firstRowKeyDown = vi.fn();
        configureSortableEntry('apple', {listeners: {onKeyDown: firstRowKeyDown}});

        const rows = getRowElements();
        const nodes = mountRows(rows);

        const event = createKeyEvent('ArrowDown', nodes[0]);
        (rows[0].props.onKeyDown as ((event: unknown) => void) | undefined)?.(event);

        expect(event.preventDefault).toHaveBeenCalledOnce();
        expect(focusedIndexSetter).toHaveBeenCalledWith(1);
        expect(firstRowKeyDown).not.toHaveBeenCalled();

        flushAnimationFrames();

        expect(nodes[1].focus).toHaveBeenCalledOnce();

        const rerenderedRows = getRowElements();
        expect(rerenderedRows.map(row => row.props.tabIndex)).toEqual([-1, 0, -1]);
    });

    it('moves focus to the previous row on ArrowUp before keyboard drag starts', () => {
        focusedIndexState = 1;

        const secondRowKeyDown = vi.fn();
        configureSortableEntry('banana', {listeners: {onKeyDown: secondRowKeyDown}});

        const rows = getRowElements();
        const nodes = mountRows(rows);

        const event = createKeyEvent('ArrowUp', nodes[1]);
        (rows[1].props.onKeyDown as ((event: unknown) => void) | undefined)?.(event);

        expect(event.preventDefault).toHaveBeenCalledOnce();
        expect(focusedIndexSetter).toHaveBeenCalledWith(0);
        expect(secondRowKeyDown).not.toHaveBeenCalled();

        flushAnimationFrames();

        expect(nodes[0].focus).toHaveBeenCalledOnce();

        const rerenderedRows = getRowElements();
        expect(rerenderedRows.map(row => row.props.tabIndex)).toEqual([0, -1, -1]);
    });

    it('moves focus to the first focusable descendant on ArrowRight', () => {
        const rows = getRowElements();
        const firstButton = createFocusTarget();
        const nodes = mountRows(rows, [[firstButton], [], []]);

        const event = createKeyEvent('ArrowRight', nodes[0]);
        (rows[0].props.onKeyDown as ((event: unknown) => void) | undefined)?.(event);

        expect(event.preventDefault).toHaveBeenCalledOnce();
        expect(firstButton.focus).toHaveBeenCalledOnce();
        expect(focusedTargetIndexSetter).toHaveBeenCalledWith(1);
    });

    it('moves focus between focusable descendants on ArrowLeft and ArrowRight', () => {
        const rows = getRowElements();
        const firstButton = createFocusTarget();
        const secondButton = createFocusTarget();
        const nodes = mountRows(rows, [[firstButton, secondButton], [], []]);

        const event = createKeyEvent('ArrowLeft', nodes[0], secondButton);
        (rows[0].props.onKeyDown as ((event: unknown) => void) | undefined)?.(event);

        expect(event.preventDefault).toHaveBeenCalledOnce();
        expect(firstButton.focus).toHaveBeenCalledOnce();
        expect(secondButton.focus).not.toHaveBeenCalled();
        expect(focusedTargetIndexSetter).toHaveBeenCalledWith(1);
    });

    it('moves focus to the matching descendant in the next row on ArrowDown', () => {
        const rows = getRowElements();
        const firstRowPrimaryButton = createFocusTarget();
        const firstRowSecondaryButton = createFocusTarget();
        const secondRowPrimaryButton = createFocusTarget();
        const secondRowSecondaryButton = createFocusTarget();
        mountRows(rows, [
            [firstRowPrimaryButton, firstRowSecondaryButton],
            [secondRowPrimaryButton, secondRowSecondaryButton],
            [],
        ]);

        const event = createKeyEvent('ArrowDown', rowRefsRef.current[0], firstRowSecondaryButton);
        (rows[0].props.onKeyDown as ((event: unknown) => void) | undefined)?.(event);

        expect(event.preventDefault).toHaveBeenCalledOnce();
        expect(focusedIndexSetter).toHaveBeenCalledWith(1);
        expect(focusedTargetIndexSetter).toHaveBeenCalledWith(2);

        flushAnimationFrames();

        expect(secondRowSecondaryButton.focus).toHaveBeenCalledOnce();
    });

    it('moves focus to the next internal target on Tab before leaving the list', () => {
        const rows = getRowElements();
        const input = createFocusTarget({tagName: 'INPUT', type: 'text'});
        const button = createFocusTarget();
        mountRows(rows, [[input, button], [], []]);

        const event = createKeyEvent('Tab', rowRefsRef.current[0], input);
        (rows[0].props.onKeyDown as ((event: unknown) => void) | undefined)?.(event);

        expect(event.preventDefault).toHaveBeenCalledOnce();

        flushAnimationFrames();

        expect(button.focus).toHaveBeenCalledOnce();
        expect(focusedIndexSetter).toHaveBeenCalledWith(0);
        expect(focusedTargetIndexSetter).toHaveBeenCalledWith(2);
    });

    it('moves focus to the next row on Tab from the last internal target', () => {
        const rows = getRowElements();
        const input = createFocusTarget({tagName: 'INPUT', type: 'text'});
        const secondRowButton = createFocusTarget();
        mountRows(rows, [[input], [secondRowButton], []]);

        const event = createKeyEvent('Tab', rowRefsRef.current[0], input);
        (rows[0].props.onKeyDown as ((event: unknown) => void) | undefined)?.(event);

        expect(event.preventDefault).toHaveBeenCalledOnce();
        expect(secondRowButton.focus).not.toHaveBeenCalled();

        flushAnimationFrames();

        expect(rowRefsRef.current[1]?.focus).toHaveBeenCalledOnce();
        expect(focusedIndexSetter).toHaveBeenCalledWith(1);
        expect(focusedTargetIndexSetter).toHaveBeenCalledWith(0);
    });

    it('moves focus backward inside the list on Shift+Tab', () => {
        const rows = getRowElements();
        const input = createFocusTarget({tagName: 'INPUT', type: 'text'});
        const button = createFocusTarget();
        mountRows(rows, [[input, button], [], []]);

        const event = createKeyEvent('Tab', rowRefsRef.current[0], button, {shiftKey: true});
        (rows[0].props.onKeyDown as ((event: unknown) => void) | undefined)?.(event);

        expect(event.preventDefault).toHaveBeenCalledOnce();

        flushAnimationFrames();

        expect(input.focus).toHaveBeenCalledOnce();
        expect(focusedIndexSetter).toHaveBeenCalledWith(0);
        expect(focusedTargetIndexSetter).toHaveBeenCalledWith(1);
    });

    it('allows Tab to leave the list from the final internal target', () => {
        const rows = getRowElements();
        const input = createFocusTarget({tagName: 'INPUT', type: 'text'});
        mountRows(rows, [[], [], [input]]);

        const event = createKeyEvent('Tab', rowRefsRef.current[2], input);
        (rows[2].props.onKeyDown as ((event: unknown) => void) | undefined)?.(event);

        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(focusedIndexSetter).not.toHaveBeenCalled();
        expect(focusedTargetIndexSetter).not.toHaveBeenCalled();
    });

    it('does not hijack arrow keys on editable descendants', () => {
        const firstRowKeyDown = vi.fn();
        configureSortableEntry('apple', {listeners: {onKeyDown: firstRowKeyDown}});

        const rows = getRowElements();
        const input = createFocusTarget({tagName: 'INPUT', type: 'text'});
        const nodes = mountRows(rows, [[input], [], []]);

        const event = createKeyEvent('ArrowRight', nodes[0], input);
        (rows[0].props.onKeyDown as ((event: unknown) => void) | undefined)?.(event);

        expect(firstRowKeyDown).not.toHaveBeenCalled();
        expect(focusedIndexSetter).not.toHaveBeenCalled();
        expect(focusedTargetIndexSetter).not.toHaveBeenCalled();
        expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('does not hijack ArrowUp and ArrowDown while keyboard dragging is active', () => {
        const firstRowKeyDown = vi.fn();
        configureSortableEntry('apple', {
            attributes: {'aria-pressed': 'true'},
            listeners: {onKeyDown: firstRowKeyDown},
        });

        const rows = getRowElements();
        const nodes = mountRows(rows);

        const event = createKeyEvent('ArrowDown', nodes[0]);
        (rows[0].props.onKeyDown as ((event: unknown) => void) | undefined)?.(event);

        expect(firstRowKeyDown).toHaveBeenCalledWith(event);
        expect(focusedIndexSetter).not.toHaveBeenCalled();
        expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('does not hijack ArrowRight while keyboard dragging is active', () => {
        const firstRowKeyDown = vi.fn();
        configureSortableEntry('apple', {
            attributes: {'aria-pressed': 'true'},
            listeners: {onKeyDown: firstRowKeyDown},
        });

        const rows = getRowElements();
        const nodes = mountRows(rows);

        const event = createKeyEvent('ArrowRight', nodes[0]);
        (rows[0].props.onKeyDown as ((event: unknown) => void) | undefined)?.(event);

        expect(firstRowKeyDown).toHaveBeenCalledWith(event);
        expect(focusedIndexSetter).not.toHaveBeenCalled();
        expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('does not move the roving tab stop after reorder when the list has never been focused', () => {
        focusedItemIdState = null;

        const onMove = vi.fn();
        const initialRows = getRowElements({onMove});
        const initialNodes = mountRows(initialRows);

        (getDndContextProps().onDragEnd as ((event: unknown) => void) | undefined)?.({
            active: {id: 'apple'},
            over: {id: 'cherry'},
        });

        expect(onMove).toHaveBeenCalledWith(0, 2);
        expect(focusedIndexSetter).not.toHaveBeenCalled();
        expect(focusedItemIdSetter).not.toHaveBeenCalled();

        const reorderedRows = getRowElements({items: moveItem(ITEMS, 0, 2), onMove});
        const reorderedNodes = mountRows(reorderedRows);

        flushAnimationFrames();

        expect(initialNodes[0]?.focus).not.toHaveBeenCalled();
        expect(reorderedNodes[0]?.focus).not.toHaveBeenCalled();
        expect(reorderedNodes[2]?.focus).not.toHaveBeenCalled();
        expect(reorderedRows.map(row => row.props.tabIndex)).toEqual([0, -1, -1]);
    });

    it('does not restore focus when an unfocused row is removed', () => {
        focusedItemIdState = null;

        const initialRows = getRowElements();
        const firstRowButton = createFocusTarget();
        const secondRowButton = createFocusTarget();
        const thirdRowButton = createFocusTarget();
        mountRows(initialRows, [[firstRowButton], [secondRowButton], [thirdRowButton]]);

        const rerenderedRows = getRowElements({items: ITEMS.filter(item => item.id !== 'banana')});
        const rerenderedNodes = mountRows(rerenderedRows, [[firstRowButton], [thirdRowButton]]);

        flushAnimationFrames();

        expect(focusedIndexSetter).not.toHaveBeenCalled();
        expect(focusedItemIdSetter).not.toHaveBeenCalled();
        expect(firstRowButton.focus).not.toHaveBeenCalled();
        expect(secondRowButton.focus).not.toHaveBeenCalled();
        expect(thirdRowButton.focus).not.toHaveBeenCalled();
        expect(rerenderedNodes[0]?.focus).not.toHaveBeenCalled();
        expect(rerenderedNodes[1]?.focus).not.toHaveBeenCalled();
        expect(rerenderedRows.map(row => row.props.tabIndex)).toEqual([0, -1]);
    });

    it('does not restore focus after the list has blurred and the focused row is removed', () => {
        const {list, rows: initialRows} = renderList();
        const listNode: ListNode = {
            contains: vi.fn(() => false),
        };
        const outsideTarget = createFocusTarget();
        const firstRowButton = createFocusTarget();
        const middleRowPrimaryButton = createFocusTarget();
        const middleRowRemoveButton = createFocusTarget();
        const replacementRowPrimaryButton = createFocusTarget();
        const replacementRowRemoveButton = createFocusTarget();

        mountRows(initialRows, [
            [firstRowButton],
            [middleRowPrimaryButton, middleRowRemoveButton],
            [replacementRowPrimaryButton, replacementRowRemoveButton],
        ]);

        middleRowRemoveButton.focus();
        (list.props.onFocus as ((event: unknown) => void) | undefined)?.({
            currentTarget: listNode,
            target: middleRowRemoveButton,
        });
        (list.props.onBlur as ((event: unknown) => void) | undefined)?.({
            currentTarget: listNode,
            relatedTarget: outsideTarget,
        });

        const rerenderedRows = getRowElements({items: ITEMS.filter(item => item.id !== 'banana')});
        const rerenderedNodes = mountRows(rerenderedRows, [
            [firstRowButton],
            [replacementRowPrimaryButton, replacementRowRemoveButton],
        ]);

        flushAnimationFrames();

        expect(focusedItemIdSetter).toHaveBeenLastCalledWith('cherry');
        expect(replacementRowRemoveButton.focus).not.toHaveBeenCalled();
        expect(rerenderedNodes[1]?.focus).not.toHaveBeenCalled();
    });

    it('restores focus when row removal triggers blur with relatedTarget=null before rerender', async () => {
        const {list, rows: initialRows} = renderList();
        const listNode: ListNode = {
            contains: vi.fn(() => false),
        };
        const firstRowButton = createFocusTarget();
        const middleRowPrimaryButton = createFocusTarget();
        const middleRowRemoveButton = createFocusTarget();
        const replacementRowPrimaryButton = createFocusTarget();
        const replacementRowRemoveButton = createFocusTarget();

        mountRows(initialRows, [
            [firstRowButton],
            [middleRowPrimaryButton, middleRowRemoveButton],
            [replacementRowPrimaryButton, replacementRowRemoveButton],
        ]);

        middleRowRemoveButton.focus();
        (list.props.onFocus as ((event: unknown) => void) | undefined)?.({
            currentTarget: listNode,
            target: middleRowRemoveButton,
        });
        (list.props.onBlur as ((event: unknown) => void) | undefined)?.({
            currentTarget: listNode,
            relatedTarget: null,
        });

        const rerenderedRows = getRowElements({items: ITEMS.filter(item => item.id !== 'banana')});
        mountRows(rerenderedRows, [[firstRowButton], [replacementRowPrimaryButton, replacementRowRemoveButton]]);

        await flushMicrotasks();
        flushAnimationFrames();

        expect(replacementRowRemoveButton.focus).toHaveBeenCalledOnce();
    });

    it('restores focus to the matching target when the focused middle row is removed', () => {
        const {list, rows: initialRows} = renderList();
        const listNode: ListNode = {
            contains: vi.fn(() => true),
        };
        const firstRowButton = createFocusTarget();
        const middleRowPrimaryButton = createFocusTarget();
        const middleRowRemoveButton = createFocusTarget();
        const replacementRowPrimaryButton = createFocusTarget();
        const replacementRowRemoveButton = createFocusTarget();

        mountRows(initialRows, [
            [firstRowButton],
            [middleRowPrimaryButton, middleRowRemoveButton],
            [replacementRowPrimaryButton, replacementRowRemoveButton],
        ]);

        middleRowRemoveButton.focus();
        (list.props.onFocus as ((event: unknown) => void) | undefined)?.({
            currentTarget: listNode,
            target: middleRowRemoveButton,
        });

        expect(focusedIndexState).toBe(1);
        expect(focusedTargetIndexState).toBe(2);
        expect(focusedItemIdState).toBe('banana');

        const rerenderedRows = getRowElements({items: ITEMS.filter(item => item.id !== 'banana')});
        const rerenderedNodes = mountRows(rerenderedRows, [
            [firstRowButton],
            [replacementRowPrimaryButton, replacementRowRemoveButton],
        ]);

        flushAnimationFrames();

        expect(focusedItemIdSetter).toHaveBeenLastCalledWith('cherry');
        expect(replacementRowRemoveButton.focus).toHaveBeenCalledOnce();
        expect(rerenderedNodes[1]?.focus).not.toHaveBeenCalled();
        expect(rerenderedRows.map(row => row.props.tabIndex)).toEqual([-1, 0]);
    });

    it('keeps the focused logical item as the roving tab stop after reorder', () => {
        focusedIndexState = 1;
        focusedItemIdState = 'banana';

        const onMove = vi.fn();
        const {list, rows: initialRows} = renderList({onMove});
        const listNode: ListNode = {
            contains: vi.fn(() => true),
        };
        mountRows(initialRows);
        (list.props.onFocus as ((event: unknown) => void) | undefined)?.({
            currentTarget: listNode,
            target: rowRefsRef.current[1],
        });

        (getDndContextProps().onDragEnd as ((event: unknown) => void) | undefined)?.({
            active: {id: 'banana'},
            over: {id: 'cherry'},
        });

        expect(onMove).toHaveBeenCalledWith(1, 2);
        expect(focusedIndexSetter).toHaveBeenCalledWith(2);

        const reorderedRows = getRowElements({items: moveItem(ITEMS, 1, 2), onMove});
        const reorderedNodes = mountRows(reorderedRows);

        flushAnimationFrames();

        expect(reorderedNodes[2].focus).toHaveBeenCalledOnce();
        expect(reorderedRows.map(row => row.props.tabIndex)).toEqual([-1, -1, 0]);
    });
});
