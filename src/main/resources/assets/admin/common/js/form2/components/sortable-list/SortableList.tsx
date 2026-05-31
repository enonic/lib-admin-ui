import {
    closestCenter,
    DndContext,
    type DragEndEvent,
    type DragMoveEvent,
    type DragOverEvent,
    type DragStartEvent,
    KeyboardSensor,
    type MeasuringConfiguration,
    MeasuringStrategy,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {cn} from '@enonic/ui';
import {GripVertical} from 'lucide-react';
import type {JSX, ReactElement, ReactNode} from 'react';
import {useCallback, useMemo, useState} from 'react';

//
// * Types
//

/** Per-item state passed to `renderItem` and `itemClassName`. */
export type SortableListItemContext<T> = {
    /** Current item from the `items` array. */
    item: T;
    /** Position in the list. */
    index: number;
    /** `true` while this item is actively being dragged. */
    isDragging: boolean;
    /** `true` while any item in the list is being dragged. */
    isDragActive: boolean;
    /** `true` when the row or any of its children has DOM focus. */
    isFocused: boolean;
    /** `true` when the list has 2+ items (drag handles visible). */
    isMovable: boolean;
    /**
     * Projection mode only: the live indent (px) of the dragged row's projected drop level.
     * Set on the dragged row mid-drag, `undefined` otherwise — apply it as the row's indent so
     * the dragged element itself shows the level it will land at.
     */
    projectedIndent?: number;
};

/** Which side of the over row the dragged item lands on. */
export type SortableDropSide = 'above' | 'below';

/** Net vertical travel direction during a drag. */
export type SortableDragDirection = 'up' | 'down';

/** Live drag state surfaced in projection mode for resolving a tree-shaped drop. */
export type SortableDragInfo = {
    /** Index of the dragged item. */
    activeIndex: number;
    /** Index of the row currently under the pointer (equals `activeIndex` at the list edge). */
    overIndex: number;
    /** Side relative to the over row, from the dnd-kit displacement gap (below when the
     *  dragged item comes from above the over row, above when it comes from below). */
    side: SortableDropSide;
    /** Net vertical travel from the drag start (sign of the cumulative offset). */
    direction: SortableDragDirection;
};

/** Consumer's resolution of a drag state into a drop hint for the dragged row. */
export type SortableDropHint = {
    /** Indent in px the dragged row should adopt to show its projected drop level. */
    indent: number;
    /** Whether the drop is permitted; drives the dragged row's styling and the commit. */
    allowed: boolean;
};

/** Vertical drag-to-reorder list with built-in drag handles. */
export type SortableListProps<T> = {
    'data-component'?: string;
    /** Source array — one sortable row per element. */
    items: T[];
    /** Unique string ID for dnd-kit; called once per item. */
    keyExtractor: (item: T, index: number) => string;
    /** Called when a drag starts with the index of the dragged item. */
    onDragStart?: (index: number) => void;
    /**
     * Called after a drag completes with the old and new indices. In projection mode
     * (`resolveDrop` set) it also receives the final drag state for tree-aware commits.
     */
    onMove: (fromIndex: number, toIndex: number, info?: SortableDragInfo) => void;
    /** Controls whether drag handles are interactive. */
    enabled: boolean;
    /** When `true`, the entire row becomes the drag target instead of just the grip handle. Defaults to `false`. */
    fullRowDraggable?: boolean;
    /** Per-item override for movability. When provided, its return value replaces the global `isMovable` check for that item. */
    isItemMovable?: (item: T, index: number) => boolean;
    /** When `false`, the drag handle is not rendered. If true, the drag handle is passed to renderItem as a second argument. Defaults to `false`. */
    controlGrip?: boolean;
    /** Renders the content inside each sortable row. */
    renderItem: (context: SortableListItemContext<T>, grip?: ReactNode) => ReactNode;
    /** Accessible label for drag handle buttons (e.g. "Drag to reorder"). */
    dragLabel?: string;
    /** Called during drag to check if the current drop position is valid. Controls dragged item opacity. */
    isDropAllowed?: (fromIndex: number, toIndex: number) => boolean;
    /** Custom function to control when layout-change animations run. Passed to `useSortable`. */
    animateLayoutChanges?: (args: {isSorting: boolean; wasDragging: boolean}) => boolean;
    /**
     * Projection mode for tree-shaped lists. When provided, the list reports the live drag
     * state (hovered row, displacement `side`, travel `direction`) and feeds `hint.indent` back
     * to the dragged row (via `context.projectedIndent`) so it re-indents to its projected drop
     * level. The drag stays vertical; the level comes from the neighbours plus travel direction.
     * Return `null` for no projection. The commit arrives through `onMove`'s `info` argument.
     */
    resolveDrop?: (info: SortableDragInfo, items: T[]) => SortableDropHint | null;
    /** Extra classes on each row wrapper; function form receives item context. */
    itemClassName?: string | ((context: SortableListItemContext<T>) => string);
    className?: string;
};

//
// * Helpers
//

// ? Scale is intentionally omitted — @dnd-kit/utilities CSS.Transform is not a direct dependency
function toTransformCSS(transform: {x: number; y: number; scaleX: number; scaleY: number} | null): string | undefined {
    if (transform == null) return undefined;
    return `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0)`;
}

function restrictToVerticalAxis({transform}: {transform: {x: number; y: number; scaleX: number; scaleY: number}}): {
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
} {
    return {...transform, x: 0};
}

// Re-measure droppables continuously in projection mode — the tree can collapse the
// dragged node and shift rows, which would otherwise leave the `over` rects stale.
const PROJECTION_MEASURING: MeasuringConfiguration = {
    droppable: {strategy: MeasuringStrategy.Always},
};

//
// * SortableListItem
//

type SortableListItemInternalProps<T> = {
    id: string;
    item: T;
    index: number;
    isMovable: boolean;
    isDragActive: boolean;
    enabled: boolean;
    controlGrip: boolean;
    fullRowDraggable: boolean;
    dropAllowed: boolean;
    projectedIndent?: number;
    dragLabel?: string;
    animateLayoutChanges?: (args: {isSorting: boolean; wasDragging: boolean}) => boolean;
    renderItem: (context: SortableListItemContext<T>, grip?: ReactNode) => ReactNode;
    itemClassName?: string | ((context: SortableListItemContext<T>) => string);
    itemTabIndex?: number;
};

const SortableListItem = <T,>({
    id,
    item,
    index,
    isMovable,
    isDragActive,
    enabled,
    controlGrip,
    fullRowDraggable,
    dropAllowed,
    projectedIndent,
    dragLabel,
    animateLayoutChanges,
    renderItem,
    itemClassName,
    itemTabIndex,
}: SortableListItemInternalProps<T>): ReactElement => {
    const [isFocused, setIsFocused] = useState(false);
    const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({
        id,
        disabled: !isMovable,
        animateLayoutChanges,
    });

    const handleKeyDown: JSX.KeyboardEventHandler<HTMLDivElement> = e => {
        if (e.target !== e.currentTarget) return;
        (listeners?.onKeyDown as JSX.KeyboardEventHandler<HTMLDivElement>)?.(e);
    };

    // When fullRowDraggable, dnd-kit listeners must not override the guarded handleKeyDown
    const rowListenersSafe = useMemo(() => {
        if (!fullRowDraggable || !isMovable || !listeners) return undefined;
        const {onKeyDown: _ignored, ...rest} = listeners;
        return rest;
    }, [fullRowDraggable, isMovable, listeners]);

    const handleFocus = () => setIsFocused(true);

    const handleBlur: JSX.FocusEventHandler<HTMLDivElement> = e => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsFocused(false);
    };

    const style = {
        transform: toTransformCSS(transform),
        transition: transition ?? undefined,
        zIndex: isDragging ? 999 : undefined,
    };

    const context: SortableListItemContext<T> = {
        item,
        index,
        isDragging,
        isDragActive,
        isFocused,
        isMovable,
        projectedIndent,
    };

    const resolvedClassName = typeof itemClassName === 'function' ? itemClassName(context) : itemClassName;

    const grip = isMovable && (
        <button
            type='button'
            className={cn(
                'flex shrink-0 items-center text-subtle',
                fullRowDraggable
                    ? 'pointer-events-none'
                    : cn('cursor-grab', 'hover:text-foreground', isDragging && 'cursor-grabbing'),
                'focus-visible:outline-none',
                !enabled && 'pointer-events-none opacity-30',
            )}
            tabIndex={-1}
            disabled={!enabled}
            aria-label={dragLabel}
            {...(fullRowDraggable ? undefined : listeners)}
        >
            <GripVertical className='size-5' />
        </button>
    );

    // ? Spread dnd-kit attributes individually to fix Preact type mismatch (string vs AriaRole)
    return (
        <div
            ref={setNodeRef}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            role={attributes.role as JSX.AriaRole}
            tabIndex={itemTabIndex ?? (isMovable ? attributes.tabIndex : undefined)}
            aria-disabled={attributes['aria-disabled']}
            aria-pressed={attributes['aria-pressed']}
            aria-roledescription={attributes['aria-roledescription']}
            aria-describedby={attributes['aria-describedby']}
            style={style}
            className={cn(
                'relative flex items-center rounded outline-none',
                'focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:ring-inset',
                isDragging && 'bg-surface-neutral shadow-[0_2px_8px_2px] shadow-main/10 ring-1 ring-main/5',
                isDragging && !dropAllowed && 'opacity-40',
                // Full-row drag targets must not turn a press-drag into a text selection.
                fullRowDraggable && isMovable && 'touch-none select-none',
                fullRowDraggable && isMovable && (isDragging ? 'cursor-grabbing' : 'cursor-grab'),
                resolvedClassName,
            )}
            {...rowListenersSafe}
        >
            {!controlGrip && grip}
            {renderItem(context, grip)}
        </div>
    );
};

//
// * SortableList
//

const SORTABLE_LIST_NAME = 'SortableList';

export const SortableList = <T,>({
    items,
    keyExtractor,
    onDragStart: onDragStartProp,
    onMove,
    enabled,
    fullRowDraggable = false,
    isItemMovable,
    isDropAllowed,
    animateLayoutChanges,
    resolveDrop,
    dragLabel,
    controlGrip = false,
    renderItem,
    itemClassName,
    className,

    'data-component': dataComponent = SORTABLE_LIST_NAME,
}: SortableListProps<T>): ReactElement => {
    const ids = useMemo(() => items.map((item, i) => keyExtractor(item, i)), [items, keyExtractor]);
    const isMovable = items.length >= 2;
    const [dropAllowed, setDropAllowed] = useState(true);
    const [isDragActive, setIsDragActive] = useState(false);
    const [drop, setDrop] = useState<{info: SortableDragInfo; hint: SortableDropHint | null} | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {activationConstraint: {distance: 5}}),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    const handleDragStart = useCallback(
        (event: DragStartEvent) => {
            setDropAllowed(true);
            setIsDragActive(true);
            if (onDragStartProp != null) {
                const index = ids.indexOf(String(event.active.id));
                if (index !== -1) {
                    onDragStartProp(index);
                }
            }
        },
        [ids, onDragStartProp],
    );

    // Projection mode: recompute the drop from the live drag state. Driven by both
    // `onDragMove` (pointer moved) and `onDragOver` (dnd-kit re-measured and changed
    // `over`) so the indicator never lags the displacement.
    const applyProjection = useCallback(
        (event: DragMoveEvent) => {
            if (resolveDrop == null) return;

            const {active, over, delta} = event;
            const direction: SortableDragDirection = delta.y < 0 ? 'up' : 'down';

            // `over === active` only carries intent at the list edge — a down-drag past the
            // last row, which steps the item out a level. Otherwise it means "no move yet".
            const atOwnSlot = over == null || active.id === over.id;
            if (atOwnSlot && (direction !== 'down' || delta.y <= 0)) {
                setDrop(null);
                setDropAllowed(true);
                return;
            }

            const overId = over == null ? String(active.id) : String(over.id);
            const activeIndex = ids.indexOf(String(active.id));
            const overIndex = ids.indexOf(overId);
            if (activeIndex === -1 || overIndex === -1) {
                setDrop(null);
                return;
            }

            // Side matches dnd-kit's displacement gap: the item lands at the over row's slot,
            // so it sits after the over row when coming from above and before it when from below.
            const side: SortableDropSide = overIndex > activeIndex ? 'below' : 'above';
            const info: SortableDragInfo = {activeIndex, overIndex, side, direction};
            const hint = resolveDrop(info, items);
            setDrop({info, hint});
            setDropAllowed(hint?.allowed ?? true);
        },
        [ids, items, resolveDrop],
    );

    const handleDragOver = useCallback(
        (event: DragOverEvent) => {
            if (resolveDrop != null) {
                applyProjection(event);
                return;
            }
            if (isDropAllowed == null) return;

            const {active, over} = event;
            if (over == null || active.id === over.id) {
                setDropAllowed(true);
                return;
            }

            const fromIndex = ids.indexOf(String(active.id));
            const toIndex = ids.indexOf(String(over.id));
            setDropAllowed(fromIndex !== -1 && toIndex !== -1 && isDropAllowed(fromIndex, toIndex));
        },
        [ids, isDropAllowed, resolveDrop, applyProjection],
    );

    const handleDragMove = useCallback((event: DragMoveEvent) => applyProjection(event), [applyProjection]);

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            setDropAllowed(true);
            setIsDragActive(false);
            setDrop(null);

            const {active, over, delta} = event;
            const oldIndex = ids.indexOf(String(active.id));
            if (oldIndex === -1) return;

            if (resolveDrop != null) {
                const direction: SortableDragDirection = delta.y < 0 ? 'up' : 'down';
                const atOwnSlot = over == null || active.id === over.id;
                if (atOwnSlot && (direction !== 'down' || delta.y <= 0)) return;
                const overId = over == null ? String(active.id) : String(over.id);
                const overIndex = ids.indexOf(overId);
                if (overIndex === -1) return;
                const side: SortableDropSide = overIndex > oldIndex ? 'below' : 'above';
                onMove(oldIndex, overIndex, {activeIndex: oldIndex, overIndex, side, direction});
                return;
            }

            if (over == null || active.id === over.id) return;
            const newIndex = ids.indexOf(String(over.id));
            if (newIndex === -1) return;

            onMove(oldIndex, newIndex);
        },
        [ids, onMove, resolveDrop],
    );

    const handleDragCancel = useCallback(() => {
        setDropAllowed(true);
        setIsDragActive(false);
        setDrop(null);
    }, []);

    return (
        <div
            data-component={dataComponent}
            data-drag-active={isDragActive || undefined}
            className={cn(isDragActive && '[&_*]:pointer-events-none', className)}
        >
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis]}
                measuring={resolveDrop != null ? PROJECTION_MEASURING : undefined}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragMove={handleDragMove}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
            >
                <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                    {items.map((item, i) => (
                        <SortableListItem
                            key={ids[i]}
                            id={ids[i]}
                            item={item}
                            index={i}
                            isMovable={isItemMovable?.(item, i) ?? isMovable}
                            isDragActive={isDragActive}
                            controlGrip={controlGrip}
                            enabled={enabled}
                            fullRowDraggable={fullRowDraggable}
                            dropAllowed={dropAllowed}
                            projectedIndent={
                                drop?.hint != null && i === drop.info.activeIndex ? drop.hint.indent : undefined
                            }
                            dragLabel={dragLabel}
                            animateLayoutChanges={animateLayoutChanges}
                            renderItem={renderItem}
                            itemClassName={itemClassName}
                        />
                    ))}
                </SortableContext>
            </DndContext>
        </div>
    );
};

SortableList.displayName = SORTABLE_LIST_NAME;
