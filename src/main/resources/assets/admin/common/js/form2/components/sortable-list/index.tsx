import {
    closestCenter,
    DndContext,
    type DragEndEvent,
    KeyboardSensor,
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
    /** `true` when the row or any of its children has DOM focus. */
    isFocused: boolean;
    /** `true` when the list has 2+ items (drag handles visible). */
    isMovable: boolean;
};

/** Vertical drag-to-reorder list with built-in drag handles. */
export type SortableListProps<T> = {
    'data-component'?: string;
    /** Source array — one sortable row per element. */
    items: T[];
    /** Unique string ID for dnd-kit; called once per item. */
    keyExtractor: (item: T, index: number) => string;
    /** Called after a drag completes with the old and new indices. */
    onMove: (fromIndex: number, toIndex: number) => void;
    /** Controls whether drag handles are interactive. */
    enabled: boolean;
    /** When `true`, the entire row becomes the drag target instead of just the grip handle. Defaults to `false`. */
    fullRowDraggable?: boolean;
    /** Renders the content inside each sortable row. */
    renderItem: (context: SortableListItemContext<T>) => ReactNode;
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

//
// * SortableListItem
//

type SortableListItemInternalProps<T> = {
    id: string;
    item: T;
    index: number;
    isMovable: boolean;
    enabled: boolean;
    fullRowDraggable: boolean;
    renderItem: (context: SortableListItemContext<T>) => ReactNode;
    itemClassName?: string | ((context: SortableListItemContext<T>) => string);
};

const SortableListItem = <T,>({
    id,
    item,
    index,
    isMovable,
    enabled,
    fullRowDraggable,
    renderItem,
    itemClassName,
}: SortableListItemInternalProps<T>): ReactElement => {
    const [isFocused, setIsFocused] = useState(false);
    const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({
        id,
        disabled: !isMovable,
    });

    const handleKeyDown: JSX.KeyboardEventHandler<HTMLDivElement> = e => {
        if (e.target !== e.currentTarget) return;
        (listeners?.onKeyDown as JSX.KeyboardEventHandler<HTMLDivElement>)?.(e);
    };

    const handleFocus = () => setIsFocused(true);

    const handleBlur: JSX.FocusEventHandler<HTMLDivElement> = e => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsFocused(false);
    };

    const style = {
        transform: toTransformCSS(transform),
        transition: transition ?? undefined,
        zIndex: isDragging ? 999 : undefined,
    };

    const context: SortableListItemContext<T> = {item, index, isDragging, isFocused, isMovable};

    const resolvedClassName = typeof itemClassName === 'function' ? itemClassName(context) : itemClassName;

    // ? When fullRowDraggable, listeners attach to the row; otherwise to the grip button
    const rowListeners = fullRowDraggable && isMovable ? listeners : undefined;

    // ? Spread dnd-kit attributes individually to fix Preact type mismatch (string vs AriaRole)
    return (
        <div
            ref={setNodeRef}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            role={attributes.role as JSX.AriaRole}
            tabIndex={isMovable ? attributes.tabIndex : undefined}
            aria-disabled={attributes['aria-disabled']}
            aria-pressed={attributes['aria-pressed']}
            aria-roledescription={attributes['aria-roledescription']}
            aria-describedby={attributes['aria-describedby']}
            style={style}
            className={cn(
                'relative flex items-center rounded outline-none',
                'focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:ring-inset',
                isDragging && 'bg-surface-neutral shadow-[0_2px_8px_2px] shadow-main/10 ring-1 ring-main/5',
                fullRowDraggable && isMovable && (isDragging ? 'cursor-grabbing' : 'cursor-grab'),
                resolvedClassName,
            )}
            {...rowListeners}
        >
            {isMovable && (
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
                    {...(fullRowDraggable ? undefined : listeners)}
                >
                    <GripVertical className='size-5' />
                </button>
            )}
            {renderItem(context)}
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
    onMove,
    enabled,
    fullRowDraggable = false,
    renderItem,
    itemClassName,
    className,
    'data-component': dataComponent = SORTABLE_LIST_NAME,
}: SortableListProps<T>): ReactElement => {
    const ids = useMemo(() => items.map((item, i) => keyExtractor(item, i)), [items, keyExtractor]);
    const isMovable = useMemo(() => items.length >= 2, [items]);

    const sensors = useSensors(
        useSensor(PointerSensor, {activationConstraint: {distance: 5}}),
        useSensor(KeyboardSensor, {coordinateGetter: sortableKeyboardCoordinates}),
    );

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const {active, over} = event;
            if (over == null || active.id === over.id) return;

            const oldIndex = ids.indexOf(String(active.id));
            const newIndex = ids.indexOf(String(over.id));
            if (oldIndex === -1 || newIndex === -1) return;
            onMove(oldIndex, newIndex);
        },
        [ids, onMove],
    );

    return (
        <div data-component={dataComponent} className={className}>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis]}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                    {items.map((item, i) => (
                        <SortableListItem
                            key={ids[i]}
                            id={ids[i]}
                            item={item}
                            index={i}
                            isMovable={isMovable}
                            enabled={enabled}
                            fullRowDraggable={fullRowDraggable}
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
