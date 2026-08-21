import {
    closestCenter,
    DndContext,
    type DragEndEvent,
    type DragMoveEvent,
    type DragOverEvent,
    DragOverlay,
    type DragStartEvent,
    KeyboardSensor,
    type MeasuringConfiguration,
    MeasuringStrategy,
    TouchSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    type SortingStrategy,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {cn} from '@enonic/ui';
import {GripVertical} from 'lucide-react';
import type {JSX, ReactElement, ReactNode} from 'react';
import {useCallback, useMemo, useState} from 'react';
import {
    FULL_ROW_TOUCH_SENSOR_OPTIONS,
    HANDLE_TOUCH_SENSOR_OPTIONS,
    MOUSE_SENSOR_OPTIONS,
    PrimaryButtonMouseSensor,
} from '../sortableSensors';
import {
    getProjectionDragInfo,
    getProjectionPlaceholderIndex,
    type SortableDragDirection,
    type SortableDragInfo,
} from './projectionDragInfo';

export type {SortableDragDirection, SortableDragInfo, SortableDropSide} from './projectionDragInfo';

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

/** Consumer's resolution of a drag state into a drop hint for the dragged row. */
export type SortableDropHint = {
    /** Indent in px the dragged row should adopt to show its projected drop level. */
    indent: number;
    /** Whether the drop is permitted; drives the dragged row's styling and the commit. */
    allowed: boolean;
};

/** Semantic attributes applied to the list container. */
export type SortableListContainerProps = {
    role?: JSX.AriaRole;
    'aria-label'?: string;
};

/** Semantic attributes applied to a sortable row. */
export type SortableListItemProps = {
    role?: JSX.AriaRole;
    tabIndex?: number;
    'aria-disabled'?: boolean;
    'aria-expanded'?: boolean;
    'aria-level'?: number;
    'aria-posinset'?: number;
    'aria-roledescription'?: string;
    'aria-selected'?: boolean;
    'aria-setsize'?: number;
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
     * (`resolveDrop` set), it receives the final drag state only when the final projection
     * returns a non-null, allowed hint.
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
    /**
     * Renders content inside each sortable row. Projection mode also mounts the active item's
     * content in an inert drag overlay, so it may be mounted twice during a drag. Keep rendering
     * side-effect free and account for duplicated refs, effects, and DOM IDs.
     */
    renderItem: (context: SortableListItemContext<T>, grip?: ReactNode) => ReactNode;
    /** Accessible label for drag handle buttons (e.g. "Drag to reorder"). */
    dragLabel?: string;
    /** Called during drag to check if the current drop position is valid. Controls dragged item opacity. */
    isDropAllowed?: (fromIndex: number, toIndex: number) => boolean;
    /** Custom function to control when layout-change animations run. Passed to `useSortable`. */
    animateLayoutChanges?: (args: {isSorting: boolean; wasDragging: boolean}) => boolean;
    /**
     * Projection mode for tree-shaped lists. When provided, the list reports the live drag
     * state (hovered row, midpoint-relative `side`, travel `direction`) and feeds `hint.indent` back
     * to the dragged row (via `context.projectedIndent`) so it re-indents to its projected drop
     * level. The drag stays vertical; the level comes from the neighbours plus travel direction.
     * Return `null` for no projection; it is shown as disallowed and `onMove` is not called.
     * An allowed commit arrives through `onMove`'s `info` argument.
     */
    resolveDrop?: (info: SortableDragInfo, items: T[]) => SortableDropHint | null;
    /** Extra classes on each row wrapper; function form receives item context. */
    itemClassName?: string | ((context: SortableListItemContext<T>) => string);
    /** Semantic attributes applied to the list container. */
    containerProps?: SortableListContainerProps;
    /**
     * Returns semantic attributes for each row. Overriding `role` drops dnd-kit's button-specific
     * ARIA, so supply `aria-disabled` and `aria-roledescription` here when the role needs them.
     * Rows keep dnd-kit's tab stop unless `tabIndex` is returned — roving tab stop consumers
     * (trees, listboxes) must return it, otherwise every row lands in the tab order.
     */
    getItemProps?: (context: SortableListItemContext<T>) => SortableListItemProps;
    /** Whether dnd-kit restores focus to the original activator after a keyboard drag. Defaults to `true`. */
    restoreFocus?: boolean;
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
const KEYBOARD_SENSOR_OPTIONS = {
    coordinateGetter: sortableKeyboardCoordinates,
};

type ProjectionDragEvent = DragMoveEvent | DragEndEvent;

type ProjectionDrop = {
    info: SortableDragInfo;
    hint: SortableDropHint | null;
};

function getOverId(event: ProjectionDragEvent): string {
    return event.over == null ? String(event.active.id) : String(event.over.id);
}

function getProjectionDragInfoFromEvent(event: ProjectionDragEvent, ids: string[]): SortableDragInfo | null {
    const {active, over, delta} = event;
    const activeId = String(active.id);
    const overId = getOverId(event);
    const activeIndex = ids.indexOf(activeId);
    const overIndex = ids.indexOf(overId);
    if (activeIndex === -1 || overIndex === -1) return null;

    return getProjectionDragInfo({
        activeIndex,
        overIndex,
        deltaY: delta.y,
        activeTranslatedRect: active.rect.current.translated,
        activeInitialRect: active.rect.current.initial,
        overRect: over?.rect ?? null,
    });
}

function hasProjectionIntent(event: ProjectionDragEvent): boolean {
    const {active, over, delta} = event;
    const direction: SortableDragDirection = delta.y < 0 ? 'up' : 'down';
    const atOwnSlot = over == null || active.id === over.id;
    return !atOwnSlot || (direction === 'down' && delta.y > 0);
}

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
    useDragPlaceholder: boolean;
    dropAllowed: boolean;
    projectedIndent?: number;
    dragLabel?: string;
    animateLayoutChanges?: (args: {isSorting: boolean; wasDragging: boolean}) => boolean;
    renderItem: (context: SortableListItemContext<T>, grip?: ReactNode) => ReactNode;
    itemClassName?: string | ((context: SortableListItemContext<T>) => string);
    getItemProps?: (context: SortableListItemContext<T>) => SortableListItemProps;
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
    useDragPlaceholder,
    dropAllowed,
    projectedIndent,
    dragLabel,
    animateLayoutChanges,
    renderItem,
    itemClassName,
    getItemProps,
}: SortableListItemInternalProps<T>): ReactElement => {
    const [isFocused, setIsFocused] = useState(false);
    const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({
        id,
        disabled: !enabled || !isMovable,
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
        zIndex: isDragging && !useDragPlaceholder ? 999 : undefined,
    };

    const context: SortableListItemContext<T> = {
        item,
        index,
        isDragging,
        isDragActive,
        isFocused,
        isMovable,
        projectedIndent: isDragging ? projectedIndent : undefined,
    };

    const resolvedClassName = typeof itemClassName === 'function' ? itemClassName(context) : itemClassName;
    const resolvedItemProps = getItemProps?.(context);
    const resolvedRole = resolvedItemProps?.role ?? (attributes.role as JSX.AriaRole);
    const hasCustomRole = resolvedItemProps?.role != null;
    // ? dnd-kit's aria-disabled reports "not draggable", which only reads correctly on its own button role
    const defaultAriaDisabled = hasCustomRole ? !enabled || undefined : attributes['aria-disabled'];

    const grip = isMovable && (
        <button
            type='button'
            className={cn(
                'flex shrink-0 items-center text-subtle',
                fullRowDraggable
                    ? 'pointer-events-none'
                    : cn('cursor-grab touch-none', 'hover:text-foreground', isDragging && 'cursor-grabbing'),
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
            data-drag-placeholder={(useDragPlaceholder && isDragging) || undefined}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            role={resolvedRole}
            tabIndex={resolvedItemProps?.tabIndex ?? (isMovable && enabled ? attributes.tabIndex : undefined)}
            aria-disabled={resolvedItemProps?.['aria-disabled'] ?? defaultAriaDisabled}
            aria-pressed={hasCustomRole ? undefined : attributes['aria-pressed']}
            aria-roledescription={
                resolvedItemProps?.['aria-roledescription'] ??
                (hasCustomRole ? undefined : attributes['aria-roledescription'])
            }
            aria-describedby={isMovable && enabled ? attributes['aria-describedby'] : undefined}
            aria-expanded={resolvedItemProps?.['aria-expanded']}
            aria-level={resolvedItemProps?.['aria-level']}
            aria-posinset={resolvedItemProps?.['aria-posinset']}
            aria-selected={resolvedItemProps?.['aria-selected']}
            aria-setsize={resolvedItemProps?.['aria-setsize']}
            data-dragging={isDragging || undefined}
            style={style}
            className={cn(
                'relative flex items-center rounded outline-none',
                'focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:ring-inset',
                isDragging &&
                    (useDragPlaceholder
                        ? 'bg-surface-neutral opacity-30 ring-1 ring-main/15'
                        : 'bg-surface-neutral shadow-[0_2px_8px_2px] shadow-main/10 ring-1 ring-main/5'),
                isDragging && !dropAllowed && 'opacity-40',
                // Full-row drag targets must not turn a press-drag into a text selection.
                enabled && fullRowDraggable && isMovable && 'select-none',
                enabled && fullRowDraggable && isMovable && (isDragging ? 'cursor-grabbing' : 'cursor-grab'),
                resolvedClassName,
            )}
            {...rowListenersSafe}
        >
            {!controlGrip && grip}
            {renderItem(context, grip)}
        </div>
    );
};

type SortableListDragOverlayProps<T> = {
    item: T;
    index: number;
    isMovable: boolean;
    controlGrip: boolean;
    fullRowDraggable: boolean;
    dropAllowed: boolean;
    projectedIndent?: number;
    renderItem: (context: SortableListItemContext<T>, grip?: ReactNode) => ReactNode;
    itemClassName?: string | ((context: SortableListItemContext<T>) => string);
};

const SortableListDragOverlay = <T,>({
    item,
    index,
    isMovable,
    controlGrip,
    fullRowDraggable,
    dropAllowed,
    projectedIndent,
    renderItem,
    itemClassName,
}: SortableListDragOverlayProps<T>): ReactElement => {
    const context: SortableListItemContext<T> = {
        item,
        index,
        isDragging: true,
        isDragActive: true,
        isFocused: false,
        isMovable,
        projectedIndent,
    };
    const resolvedClassName = typeof itemClassName === 'function' ? itemClassName(context) : itemClassName;
    const grip = isMovable && (
        <span className='flex shrink-0 items-center text-subtle' aria-hidden>
            <GripVertical className='size-5' />
        </span>
    );

    return (
        <div
            data-drag-overlay
            aria-hidden
            inert
            className={cn(
                'relative flex items-center rounded bg-surface-neutral outline-none',
                'shadow-[0_2px_8px_2px] shadow-main/10 ring-1 ring-main/5',
                !dropAllowed && 'opacity-40',
                fullRowDraggable && isMovable && 'cursor-grabbing',
                resolvedClassName,
            )}
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
    containerProps,
    getItemProps,
    restoreFocus = true,

    'data-component': dataComponent = SORTABLE_LIST_NAME,
}: SortableListProps<T>): ReactElement => {
    const ids = useMemo(() => items.map((item, i) => keyExtractor(item, i)), [items, keyExtractor]);
    const isMovable = items.length >= 2;
    const [dropAllowed, setDropAllowed] = useState(true);
    const [isDragActive, setIsDragActive] = useState(false);
    const [drop, setDrop] = useState<ProjectionDrop | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const activeIndex = activeId == null ? -1 : ids.indexOf(activeId);
    const activeItem = activeIndex === -1 ? null : items[activeIndex];
    const projectionSortingStrategy = useCallback<SortingStrategy>(
        args =>
            verticalListSortingStrategy({
                ...args,
                overIndex: drop == null ? args.overIndex : getProjectionPlaceholderIndex(drop.info, ids.length),
            }),
        [drop, ids.length],
    );

    const applyDrop = useCallback((nextDrop: ProjectionDrop | null) => {
        setDrop(nextDrop);
        setDropAllowed(nextDrop == null ? true : (nextDrop.hint?.allowed ?? false));
    }, []);

    const sensors = useSensors(
        useSensor(PrimaryButtonMouseSensor, MOUSE_SENSOR_OPTIONS),
        useSensor(TouchSensor, fullRowDraggable ? FULL_ROW_TOUCH_SENSOR_OPTIONS : HANDLE_TOUCH_SENSOR_OPTIONS),
        useSensor(KeyboardSensor, KEYBOARD_SENSOR_OPTIONS),
    );

    const handleDragStart = useCallback(
        (event: DragStartEvent) => {
            applyDrop(null);
            setIsDragActive(true);
            setActiveId(resolveDrop == null ? null : String(event.active.id));
            if (onDragStartProp != null) {
                const index = ids.indexOf(String(event.active.id));
                if (index !== -1) {
                    onDragStartProp(index);
                }
            }
        },
        [ids, onDragStartProp, resolveDrop, applyDrop],
    );

    // Projection mode: recompute the drop from the live drag state. Driven by both
    // `onDragMove` (pointer moved) and `onDragOver` (dnd-kit re-measured and changed
    // `over`) so the indicator never lags the displacement.
    const applyProjection = useCallback(
        (event: DragMoveEvent) => {
            if (resolveDrop == null) return;

            // `over === active` only carries intent at the list edge — a down-drag past the
            // last row, which steps the item out a level. Otherwise it means "no move yet".
            if (!hasProjectionIntent(event)) {
                applyDrop(null);
                return;
            }

            const info = getProjectionDragInfoFromEvent(event, ids);
            if (info == null) {
                applyDrop(null);
                return;
            }

            const hint = resolveDrop(info, items);
            applyDrop({info, hint});
        },
        [ids, items, resolveDrop, applyDrop],
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
            setIsDragActive(false);
            setActiveId(null);
            applyDrop(null);

            if (resolveDrop != null) {
                if (!hasProjectionIntent(event)) return;
                const finalInfo = getProjectionDragInfoFromEvent(event, ids);
                if (finalInfo == null) return;
                const finalHint = resolveDrop(finalInfo, items);
                if (!finalHint?.allowed) return;
                onMove(finalInfo.activeIndex, finalInfo.overIndex, finalInfo);
                return;
            }

            const {active, over} = event;
            if (over == null || active.id === over.id) return;
            const oldIndex = ids.indexOf(String(active.id));
            const newIndex = ids.indexOf(String(over.id));
            if (oldIndex === -1 || newIndex === -1) return;

            onMove(oldIndex, newIndex);
        },
        [ids, items, onMove, resolveDrop, applyDrop],
    );

    const handleDragCancel = useCallback(() => {
        setIsDragActive(false);
        setActiveId(null);
        applyDrop(null);
    }, [applyDrop]);

    return (
        <div
            data-component={dataComponent}
            data-drag-active={isDragActive || undefined}
            className={cn(isDragActive && '[&_*]:pointer-events-none', className)}
            role={containerProps?.role}
            aria-label={containerProps?.['aria-label']}
        >
            <DndContext
                sensors={sensors}
                accessibility={{restoreFocus, container: document.body}}
                collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis]}
                measuring={resolveDrop != null ? PROJECTION_MEASURING : undefined}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragMove={handleDragMove}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
            >
                <SortableContext
                    items={ids}
                    strategy={resolveDrop == null ? verticalListSortingStrategy : projectionSortingStrategy}
                >
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
                            useDragPlaceholder={resolveDrop != null}
                            dropAllowed={dropAllowed}
                            projectedIndent={drop?.hint != null && ids[i] === activeId ? drop.hint.indent : undefined}
                            dragLabel={dragLabel}
                            animateLayoutChanges={animateLayoutChanges}
                            renderItem={renderItem}
                            itemClassName={itemClassName}
                            getItemProps={getItemProps}
                        />
                    ))}
                </SortableContext>
                {resolveDrop != null && (
                    <DragOverlay>
                        {activeItem != null && (
                            <SortableListDragOverlay
                                item={activeItem}
                                index={activeIndex}
                                isMovable={isItemMovable?.(activeItem, activeIndex) ?? isMovable}
                                controlGrip={controlGrip}
                                fullRowDraggable={fullRowDraggable}
                                dropAllowed={dropAllowed}
                                projectedIndent={drop?.hint?.indent}
                                renderItem={renderItem}
                                itemClassName={itemClassName}
                            />
                        )}
                    </DragOverlay>
                )}
            </DndContext>
        </div>
    );
};

SortableList.displayName = SORTABLE_LIST_NAME;
