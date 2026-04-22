import {
    closestCenter,
    DndContext,
    type DragEndEvent,
    type DragStartEvent,
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
import {useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';

//
// * Types
//

/** Per-item state passed to `renderItem` and `itemClassName`. */
export type SortableGridListItemContext<T> = {
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
    /** `true` when this row can be reordered. */
    isMovable: boolean;
};

/** Vertical drag-to-reorder list with built-in drag handles. */
export type SortableGridListProps<T> = {
    'data-component'?: string;
    /** Source array — one sortable row per element. */
    items: T[];
    /** Unique string ID for dnd-kit; called once per item. */
    keyExtractor: (item: T, index: number) => string;
    /** Called after a drag completes with the old and new indices. */
    onMove: (fromIndex: number, toIndex: number) => void;
    /** Controls whether drag handles are interactive. */
    enabled: boolean;
    /** Optional per-item override for row movability. Defaults to `items.length >= 2`. */
    isItemMovable?: (item: T, index: number) => boolean;
    /** When `true`, the entire row becomes the drag target instead of just the grip handle. Defaults to `false`. */
    fullRowDraggable?: boolean;
    /** Renders the content inside each sortable row. */
    renderItem: (context: SortableGridListItemContext<T>) => ReactNode;
    /** Accessible label for drag handle buttons (e.g. "Drag to reorder"). */
    dragLabel?: string;
    /** Extra classes on each row wrapper; function form receives item context. */
    itemClassName?: string | ((context: SortableGridListItemContext<T>) => string);
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

function isKeyboardDragPressed(value: unknown): boolean {
    return value === true || value === 'true';
}

const COMPOSITE_NAVIGATION_TARGET_SELECTOR = '[data-sortable-list-composite-target="true"]';
const NAVIGATION_TARGET_SELECTOR =
    'a[href], button, iframe, input:not([type="hidden"]), select, textarea, [contenteditable], [tabindex]';
const ROW_NAVIGATION_TARGET_SELECTOR = `${COMPOSITE_NAVIGATION_TARGET_SELECTOR}, ${NAVIGATION_TARGET_SELECTOR}`;
const NAVIGATION_TARGET_TABINDEX_ATTR = 'data-sortable-list-navigation-target-tabindex';
const NAVIGATION_TARGET_TABINDEX_IMPLICIT = '__implicit__';
const NAVIGATION_TARGET_EFFECTIVE_TABINDEX_ATTR = 'data-sortable-list-effective-tabindex';
const NON_EDITABLE_INPUT_TYPES = new Set([
    'button',
    'checkbox',
    'color',
    'file',
    'hidden',
    'image',
    'radio',
    'range',
    'reset',
    'submit',
]);

function clampIndex(index: number, itemCount: number): number {
    if (itemCount <= 0) {
        return 0;
    }
    return Math.min(Math.max(index, 0), itemCount - 1);
}

function getNavigationTargetTabIndex(element: {
    tabIndex?: number;
    getAttribute?: (name: string) => string | null;
}): number {
    if (typeof element.tabIndex === 'number') {
        return element.tabIndex;
    }

    const attr = element.getAttribute?.('tabindex');
    if (attr == null) {
        return 0;
    }

    const parsed = Number(attr);
    return Number.isNaN(parsed) ? 0 : parsed;
}

function getEffectiveNavigationTargetTabIndex(element: {
    getAttribute?: (name: string) => string | null;
    tabIndex?: number;
}): number {
    const stored = element.getAttribute?.(NAVIGATION_TARGET_EFFECTIVE_TABINDEX_ATTR);
    if (stored == null) {
        return getNavigationTargetTabIndex(element);
    }

    const parsed = Number(stored);
    return Number.isNaN(parsed) ? 0 : parsed;
}

function isEditableNavigationTarget(target: EventTarget | null): boolean {
    if (target == null || typeof target !== 'object') {
        return false;
    }

    const element = target as {
        getAttribute?: (name: string) => string | null;
        isContentEditable?: boolean;
        tagName?: string;
        type?: string;
    };

    if (element.isContentEditable) {
        return true;
    }

    const role = element.getAttribute?.('role');
    if (role === 'textbox' || role === 'combobox' || role === 'spinbutton') {
        return true;
    }

    switch (element.tagName?.toUpperCase()) {
        case 'INPUT':
            return !NON_EDITABLE_INPUT_TYPES.has((element.type ?? 'text').toLowerCase());
        case 'SELECT':
        case 'TEXTAREA':
            return true;
        default:
            return false;
    }
}

function getRowNavigationTargets(row: HTMLDivElement | null): Array<HTMLDivElement | HTMLElement> {
    if (row == null) {
        return [];
    }

    const descendants = Array.from(row.querySelectorAll<HTMLElement>(ROW_NAVIGATION_TARGET_SELECTOR)).filter(target => {
        if (target === row) {
            return false;
        }
        const compositeTarget = target.closest<HTMLElement>(COMPOSITE_NAVIGATION_TARGET_SELECTOR);
        if (compositeTarget != null && compositeTarget !== target) {
            return false;
        }
        if (getEffectiveNavigationTargetTabIndex(target) < 0) {
            return false;
        }
        if ((target as HTMLButtonElement | HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).disabled) {
            return false;
        }
        if (target.getAttribute('aria-hidden') === 'true') {
            return false;
        }
        return target.closest('[hidden], [aria-hidden="true"]') == null;
    });

    return [row, ...descendants];
}

function getRowNavigationTargetIndex(row: HTMLDivElement, target: EventTarget | null): number {
    const targets = getRowNavigationTargets(row);
    if (targets.length === 0 || target == null || typeof target !== 'object') {
        return 0;
    }

    const exactIndex = targets.indexOf(target as HTMLDivElement | HTMLElement);
    if (exactIndex !== -1) {
        return exactIndex;
    }

    const containingIndex = targets.findIndex(candidate => candidate !== row && candidate.contains(target as Node));
    return containingIndex === -1 ? 0 : containingIndex;
}

function resolveFocusedIndexAfterMove(focusedIndex: number, oldIndex: number, newIndex: number): number {
    if (focusedIndex === oldIndex) {
        return newIndex;
    }
    if (oldIndex < focusedIndex && focusedIndex <= newIndex) {
        return focusedIndex - 1;
    }
    if (newIndex <= focusedIndex && focusedIndex < oldIndex) {
        return focusedIndex + 1;
    }
    return focusedIndex;
}

function restoreNavigationTargetTabIndex(target: HTMLElement): void {
    const originalTabIndex = target.getAttribute(NAVIGATION_TARGET_TABINDEX_ATTR);
    if (originalTabIndex == null) {
        return;
    }

    if (originalTabIndex === NAVIGATION_TARGET_TABINDEX_IMPLICIT) {
        target.removeAttribute('tabindex');
    } else {
        target.setAttribute('tabindex', originalTabIndex);
    }

    target.removeAttribute(NAVIGATION_TARGET_TABINDEX_ATTR);
    target.removeAttribute(NAVIGATION_TARGET_EFFECTIVE_TABINDEX_ATTR);
}

function restoreRowNavigationTargetsTabIndex(row: HTMLDivElement | null): void {
    if (row == null) {
        return;
    }

    Array.from(row.querySelectorAll<HTMLElement>(ROW_NAVIGATION_TARGET_SELECTOR)).forEach(target => {
        if (target === row) {
            return;
        }
        restoreNavigationTargetTabIndex(target);
    });
}

function syncRowNavigationTargetsTabIndex(row: HTMLDivElement | null, isNavigable: boolean): void {
    if (row == null) {
        return;
    }

    const descendants = Array.from(row.querySelectorAll<HTMLElement>(ROW_NAVIGATION_TARGET_SELECTOR)).filter(target => {
        if (target === row) {
            return false;
        }
        if (target.getAttribute('aria-hidden') === 'true') {
            return false;
        }
        return target.closest('[hidden], [aria-hidden="true"]') == null;
    });

    descendants.forEach(target => {
        if (!isNavigable) {
            restoreNavigationTargetTabIndex(target);
            return;
        }

        if (target.getAttribute(NAVIGATION_TARGET_TABINDEX_ATTR) == null) {
            const originalTabIndexAttr = target.getAttribute('tabindex');
            target.setAttribute(
                NAVIGATION_TARGET_TABINDEX_ATTR,
                originalTabIndexAttr ?? NAVIGATION_TARGET_TABINDEX_IMPLICIT,
            );
            target.setAttribute(NAVIGATION_TARGET_EFFECTIVE_TABINDEX_ATTR, String(getNavigationTargetTabIndex(target)));
        }

        target.tabIndex = -1;
    });
}

//
// * SortableGridListItem
//

type SortableGridListItemInternalProps<T> = {
    id: string;
    item: T;
    index: number;
    isMovable: boolean;
    isNavigable: boolean;
    isDragActive: boolean;
    enabled: boolean;
    fullRowDraggable: boolean;
    isTabStop: boolean;
    registerRowRef: (index: number, node: HTMLDivElement | null) => void;
    onFocusRow: (index: number, targetIndex: number) => void;
    onNavigate: (index: number, targetIndex: number) => void;
    onTabNavigate: (index: number, targetIndex: number, isBackward: boolean) => boolean;
    dragLabel?: string;
    renderItem: (context: SortableGridListItemContext<T>) => ReactNode;
    itemClassName?: string | ((context: SortableGridListItemContext<T>) => string);
};

const SortableGridListItem = <T,>({
    id,
    item,
    index,
    isMovable,
    isNavigable,
    isDragActive,
    enabled,
    fullRowDraggable,
    isTabStop,
    registerRowRef,
    onFocusRow,
    onNavigate,
    onTabNavigate,
    dragLabel,
    renderItem,
    itemClassName,
}: SortableGridListItemInternalProps<T>): ReactElement => {
    const [isFocused, setIsFocused] = useState(false);
    const rowRef = useRef<HTMLDivElement | null>(null);
    const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({
        id,
        disabled: !isMovable,
    });

    const handleNodeRef = (node: HTMLDivElement | null) => {
        if (node == null) {
            restoreRowNavigationTargetsTabIndex(rowRef.current);
            rowRef.current = null;
            setNodeRef(null);
            registerRowRef(index, null);
            return;
        }

        rowRef.current = node;
        setNodeRef(node);
        registerRowRef(index, node);
        syncRowNavigationTargetsTabIndex(node, isNavigable);
    };

    useEffect(() => {
        syncRowNavigationTargetsTabIndex(rowRef.current, isNavigable);
    }, [isNavigable]);

    const handleKeyDown: JSX.KeyboardEventHandler<HTMLDivElement> = e => {
        syncRowNavigationTargetsTabIndex(e.currentTarget, isNavigable);

        const isKeyboardDragging = isKeyboardDragPressed(attributes['aria-pressed']);
        const targetIndex = getRowNavigationTargetIndex(e.currentTarget, e.target);

        if (!isKeyboardDragging && isNavigable && e.key === 'Tab' && e.target !== e.currentTarget) {
            const didNavigate = onTabNavigate(index, targetIndex, e.shiftKey);

            if (didNavigate) {
                e.preventDefault();
                return;
            }
        }

        if (!isKeyboardDragging) {
            if (!isEditableNavigationTarget(e.target)) {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    onNavigate(index + 1, targetIndex);
                    return;
                }

                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    onNavigate(index - 1, targetIndex);
                    return;
                }

                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                    const targets = getRowNavigationTargets(e.currentTarget);
                    const offset = e.key === 'ArrowRight' ? 1 : -1;
                    const nextTargetIndex = clampIndex(targetIndex + offset, targets.length);

                    if (nextTargetIndex !== targetIndex) {
                        e.preventDefault();
                        targets[nextTargetIndex]?.focus();
                        return;
                    }
                }
            }
        }

        if (e.target !== e.currentTarget) return;

        (listeners?.onKeyDown as JSX.KeyboardEventHandler<HTMLDivElement>)?.(e);
    };

    // ? useSortable returns a fresh listeners object each render, so memoizing is a no-op
    // When fullRowDraggable, dnd-kit listeners must not override the guarded handleKeyDown
    let rowListenersSafe: Omit<NonNullable<typeof listeners>, 'onKeyDown'> | undefined;
    if (fullRowDraggable && isMovable && listeners != null) {
        const {onKeyDown: _ignored, ...rest} = listeners;
        rowListenersSafe = rest;
    }

    const handleFocus: JSX.FocusEventHandler<HTMLDivElement> = e => {
        syncRowNavigationTargetsTabIndex(e.currentTarget, isNavigable);
        setIsFocused(true);
        onFocusRow(index, getRowNavigationTargetIndex(e.currentTarget, e.target));
    };

    const handleBlur: JSX.FocusEventHandler<HTMLDivElement> = e => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsFocused(false);
    };

    const style = {
        transform: toTransformCSS(transform),
        transition: transition ?? undefined,
        zIndex: isDragging ? 999 : undefined,
    };

    const context: SortableGridListItemContext<T> = {
        item,
        index,
        isDragging,
        isDragActive,
        isFocused,
        isMovable,
    };

    const resolvedClassName = typeof itemClassName === 'function' ? itemClassName(context) : itemClassName;
    const resolvedRole = isMovable ? (attributes.role as JSX.AriaRole) : undefined;
    const resolvedAriaDisabled = isMovable ? attributes['aria-disabled'] : undefined;
    const resolvedAriaPressed = isMovable ? attributes['aria-pressed'] : undefined;
    const resolvedAriaRoleDescription = isMovable ? attributes['aria-roledescription'] : undefined;
    const resolvedAriaDescribedBy = isMovable ? attributes['aria-describedby'] : undefined;
    let resolvedTabIndex: number | undefined;
    if (isNavigable) {
        resolvedTabIndex = isTabStop ? 0 : -1;
    }

    // ? Spread dnd-kit attributes individually to fix Preact type mismatch (string vs AriaRole)
    return (
        <div
            ref={handleNodeRef}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            role={resolvedRole}
            tabIndex={resolvedTabIndex}
            aria-disabled={resolvedAriaDisabled}
            aria-pressed={resolvedAriaPressed}
            aria-roledescription={resolvedAriaRoleDescription}
            aria-describedby={resolvedAriaDescribedBy}
            style={style}
            className={cn(
                'relative flex items-center rounded outline-none',
                'focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:ring-inset',
                isDragging && 'bg-surface-neutral shadow-[0_2px_8px_2px] shadow-main/10 ring-1 ring-main/5',
                fullRowDraggable && isMovable && (isDragging ? 'cursor-grabbing' : 'cursor-grab'),
                resolvedClassName,
            )}
            {...rowListenersSafe}
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
                    aria-label={dragLabel}
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
// * SortableGridList
//

const SORTABLE_GRID_LIST_NAME = 'SortableGridList';

export const SortableGridList = <T,>({
    items,
    keyExtractor,
    onMove,
    enabled,
    isItemMovable,
    fullRowDraggable = false,
    dragLabel,
    renderItem,
    itemClassName,
    className,
    'data-component': dataComponent = SORTABLE_GRID_LIST_NAME,
}: SortableGridListProps<T>): ReactElement => {
    const ids = useMemo(() => items.map((item, i) => keyExtractor(item, i)), [items, keyExtractor]);
    const isNavigable = items.length >= 2;
    const [focusedIndex, setFocusedIndex] = useState(0);
    const [focusedTargetIndex, setFocusedTargetIndex] = useState(0);
    const [focusedItemId, setFocusedItemId] = useState<string | null>(null);
    const [isDragActive, setIsDragActive] = useState(false);
    const rowRefs = useRef<Array<HTMLDivElement | null>>([]);
    const hasFocusWithinRef = useRef(false);
    const pendingBlurClearVersionRef = useRef(0);

    const sensors = useSensors(
        useSensor(PointerSensor, {activationConstraint: {distance: 5}}),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    const getIsItemMovable = useCallback(
        (item: T, index: number) => isItemMovable?.(item, index) ?? isNavigable,
        [isItemMovable, isNavigable],
    );

    const focusRowByIndex = useCallback(
        (index: number, targetIndex: number) => {
            if (items.length === 0) {
                return;
            }

            pendingBlurClearVersionRef.current += 1;
            hasFocusWithinRef.current = true;
            requestAnimationFrame(() => {
                const row = rowRefs.current[clampIndex(index, items.length)];
                syncRowNavigationTargetsTabIndex(row, isNavigable);
                const targets = getRowNavigationTargets(row);
                const resolvedTargetIndex = clampIndex(targetIndex, targets.length);
                targets[resolvedTargetIndex]?.focus();
            });
        },
        [isNavigable, items.length],
    );

    const registerRowRef = useCallback((index: number, node: HTMLDivElement | null) => {
        rowRefs.current[index] = node;
    }, []);

    const handleListFocus = useCallback(() => {
        pendingBlurClearVersionRef.current += 1;
        hasFocusWithinRef.current = true;
    }, []);

    const handleListBlur: JSX.FocusEventHandler<HTMLDivElement> = useCallback(e => {
        if (e.relatedTarget != null && !e.currentTarget.contains(e.relatedTarget as Node)) {
            pendingBlurClearVersionRef.current += 1;
            hasFocusWithinRef.current = false;
            return;
        }

        if (e.relatedTarget != null) {
            return;
        }

        const blurVersion = pendingBlurClearVersionRef.current + 1;
        pendingBlurClearVersionRef.current = blurVersion;
        queueMicrotask(() => {
            if (pendingBlurClearVersionRef.current !== blurVersion) {
                return;
            }
            hasFocusWithinRef.current = false;
        });
    }, []);

    const handleFocusRow = useCallback(
        (index: number, targetIndex: number) => {
            setFocusedIndex(index);
            setFocusedTargetIndex(targetIndex);
            setFocusedItemId(ids[index] ?? null);
        },
        [ids],
    );

    const handleNavigate = useCallback(
        (index: number, targetIndex: number) => {
            if (items.length === 0) {
                return;
            }

            const nextFocusedIndex = clampIndex(index, items.length);
            setFocusedIndex(nextFocusedIndex);
            setFocusedTargetIndex(targetIndex);
            setFocusedItemId(ids[nextFocusedIndex] ?? null);
            focusRowByIndex(nextFocusedIndex, targetIndex);
        },
        [focusRowByIndex, ids, items.length],
    );

    const handleTabNavigate = useCallback(
        (index: number, targetIndex: number, isBackward: boolean): boolean => {
            if (items.length === 0) {
                return false;
            }

            const currentTargets = getRowNavigationTargets(rowRefs.current[index]);
            const nextTargetIndex = targetIndex + (isBackward ? -1 : 1);

            if (nextTargetIndex >= 0 && nextTargetIndex < currentTargets.length) {
                setFocusedIndex(index);
                setFocusedTargetIndex(nextTargetIndex);
                setFocusedItemId(ids[index] ?? null);
                focusRowByIndex(index, nextTargetIndex);
                return true;
            }

            if (isBackward) {
                for (let previousIndex = index - 1; previousIndex >= 0; previousIndex -= 1) {
                    const previousTargets = getRowNavigationTargets(rowRefs.current[previousIndex]);

                    if (previousTargets.length > 0) {
                        const previousTargetIndex = previousTargets.length - 1;
                        setFocusedIndex(previousIndex);
                        setFocusedTargetIndex(previousTargetIndex);
                        setFocusedItemId(ids[previousIndex] ?? null);
                        focusRowByIndex(previousIndex, previousTargetIndex);
                        return true;
                    }
                }

                return false;
            }

            for (let nextIndex = index + 1; nextIndex < items.length; nextIndex += 1) {
                const nextTargets = getRowNavigationTargets(rowRefs.current[nextIndex]);

                if (nextTargets.length > 0) {
                    setFocusedIndex(nextIndex);
                    setFocusedTargetIndex(0);
                    setFocusedItemId(ids[nextIndex] ?? null);
                    focusRowByIndex(nextIndex, 0);
                    return true;
                }
            }

            return false;
        },
        [focusRowByIndex, ids, items.length],
    );

    useLayoutEffect(() => {
        rowRefs.current = rowRefs.current.slice(0, items.length);

        if (items.length === 0) {
            pendingBlurClearVersionRef.current += 1;
            hasFocusWithinRef.current = false;
            if (focusedIndex !== 0) {
                setFocusedIndex(0);
            }
            if (focusedTargetIndex !== 0) {
                setFocusedTargetIndex(0);
            }
            if (focusedItemId !== null) {
                setFocusedItemId(null);
            }
            return;
        }

        if (focusedItemId == null) {
            const nextFocusedIndex = clampIndex(focusedIndex, items.length);

            if (focusedIndex !== nextFocusedIndex) {
                setFocusedIndex(nextFocusedIndex);
            }

            return;
        }

        const nextFocusedIndex = ids.indexOf(focusedItemId);

        if (nextFocusedIndex === -1) {
            const fallbackFocusedIndex = clampIndex(focusedIndex, items.length);
            const fallbackFocusedItemId = ids[fallbackFocusedIndex] ?? null;

            if (focusedIndex !== fallbackFocusedIndex) {
                setFocusedIndex(fallbackFocusedIndex);
            }

            if (focusedItemId !== fallbackFocusedItemId) {
                setFocusedItemId(fallbackFocusedItemId);
            }

            if (hasFocusWithinRef.current) {
                focusRowByIndex(fallbackFocusedIndex, focusedTargetIndex);
            }
            return;
        }

        if (focusedIndex !== nextFocusedIndex) {
            setFocusedIndex(nextFocusedIndex);
        }
    }, [focusRowByIndex, focusedIndex, focusedItemId, focusedTargetIndex, ids, items.length]);

    const handleDragStart = useCallback((_event: DragStartEvent) => {
        setIsDragActive(true);
    }, []);

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            setIsDragActive(false);

            const {active, over} = event;
            if (over == null || active.id === over.id) return;

            const oldIndex = ids.indexOf(String(active.id));
            const newIndex = ids.indexOf(String(over.id));
            if (oldIndex === -1 || newIndex === -1) return;

            if (focusedItemId == null) {
                onMove(oldIndex, newIndex);
                return;
            }

            const nextFocusedIndex = resolveFocusedIndexAfterMove(focusedIndex, oldIndex, newIndex);
            setFocusedIndex(nextFocusedIndex);
            onMove(oldIndex, newIndex);

            if (hasFocusWithinRef.current) {
                focusRowByIndex(nextFocusedIndex, focusedTargetIndex);
            }
        },
        [focusRowByIndex, focusedIndex, focusedItemId, focusedTargetIndex, ids, onMove],
    );

    const handleDragCancel = useCallback(() => {
        setIsDragActive(false);
    }, []);

    return (
        <div
            data-component={dataComponent}
            data-drag-active={isDragActive || undefined}
            className={cn(isDragActive && '[&_*]:pointer-events-none', className)}
            onFocus={handleListFocus}
            onBlur={handleListBlur}
        >
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis]}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
            >
                <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                    {items.map((item, i) => (
                        <SortableGridListItem
                            key={ids[i]}
                            id={ids[i]}
                            item={item}
                            index={i}
                            isMovable={getIsItemMovable(item, i)}
                            isNavigable={isNavigable}
                            isDragActive={isDragActive}
                            enabled={enabled}
                            fullRowDraggable={fullRowDraggable}
                            isTabStop={focusedIndex === i}
                            registerRowRef={registerRowRef}
                            onFocusRow={handleFocusRow}
                            onNavigate={handleNavigate}
                            onTabNavigate={handleTabNavigate}
                            dragLabel={dragLabel}
                            renderItem={renderItem}
                            itemClassName={itemClassName}
                        />
                    ))}
                </SortableContext>
            </DndContext>
        </div>
    );
};

SortableGridList.displayName = SORTABLE_GRID_LIST_NAME;
