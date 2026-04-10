import {
    closestCenter,
    DndContext,
    type DragEndEvent,
    type DragStartEvent,
    type KeyboardCoordinateGetter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable} from '@dnd-kit/sortable';
import {cn, IconButton, Input, Tooltip} from '@enonic/ui';
import {GripVertical, X} from 'lucide-react';
import {type JSX, type ReactElement, type RefObject, useEffect, useRef, useState} from 'react';

import type {Value} from '../../../data/Value';
import {ValueTypes} from '../../../data/ValueTypes';
import type {Occurrences} from '../../../form/Occurrences';
import {useI18n} from '../../I18nContext';
import type {SelfManagedComponentProps} from '../../types';
import {getFirstError, getOccurrenceErrorMessage} from '../../utils';
import {FieldError} from '../field-error';
import {
    getPastedTagLabels,
    getTagLabel,
    getVisibleTagLabel,
    hasPastedTagSeparators,
    hasRenderableTagLabel,
    hasTagLabel,
    isRenderableTagValue,
    isTagLabelCropped,
    normalizeTagDraft,
} from './tagInputUtils';

export {
    getPastedTagLabels,
    getTagLabel,
    getVisibleTagLabel,
    hasPastedTagSeparators,
    hasTagLabel,
    isTagLabelCropped,
    normalizeTagDraft,
} from './tagInputUtils';

const TAG_INPUT_NAME = 'TagInput';

//
// * Types
//

type SortableTransform = {x: number; y: number; scaleX: number; scaleY: number};

type TagItemProps = {
    id: string;
    label: string;
    error?: string;
    enabled: boolean;
    isTabStop: boolean;
    showDrag: boolean;
    showRemove: boolean;
    registerFocusableRef: (node: HTMLButtonElement | null) => void;
    registerRemoveRef: (node: HTMLButtonElement | null) => void;
    onNavigate: (direction: -1 | 1) => void;
    onDragMove: (direction: -1 | 1) => void;
    onDeleteKey: () => void;
    onRemovePointerDown: () => void;
    onRemoveKey: () => void;
    onRemove: () => void;
};

export type TagInputProps = SelfManagedComponentProps;

type TagViewState = {
    canAdd: boolean;
    canRemove: boolean;
    showDrag: boolean;
};

type TagDraftInputProps = {
    draft: string;
    enabled: boolean;
    invalid: boolean;
    visible: boolean;
    inputRef: RefObject<HTMLInputElement | null>;
    onChange: (value: string) => void;
    onFocus: () => void;
    onKeyDown: (event: JSX.TargetedKeyboardEvent<HTMLInputElement>) => void;
    onPaste: (event: JSX.TargetedClipboardEvent<HTMLInputElement>) => void;
    onBlur: (event: JSX.TargetedFocusEvent<HTMLInputElement>) => void;
};

type RemoveTagOptions = {
    activateInput?: boolean;
    focusPreviousTag?: boolean;
    commitCurrentDraft?: boolean;
};

type CommitDraftResult = {
    committed: boolean;
    usedHiddenSlot: boolean;
};

type CommitTagLabelsOptions = {
    focusTarget?: HTMLInputElement;
    clearDraft?: boolean;
};

type CommitTagLabelsResult = {
    committedCount: number;
    usedHiddenSlots: number;
};

type SortableDataEntry = {
    id: string | number;
    disabled?: boolean;
    node?: {current: HTMLElement | null};
    data?: {
        current?: {
            sortable?: {
                containerId: string;
                items: Array<string | number>;
                index: number;
            };
        };
    };
};

type TagEntry = {
    value: Value;
    originalIndex: number;
    id: string;
};

type DragScrollListener = {
    clear: () => void;
    listen: (ownerDocument: Document, onScroll: () => void) => void;
};

//
// * Helpers
//

export function shouldRemoveLatestTag(key: string, draft: string, canRemove: boolean, hasModifier = false): boolean {
    return !hasModifier && canRemove && draft.length === 0 && (key === 'Backspace' || key === 'Delete');
}

function isRemoveButtonKey(key: string): boolean {
    return key === 'Enter' || key === ' ' || key === 'Backspace' || key === 'Delete';
}

function isArrowKey(key: string): boolean {
    return key === 'ArrowLeft' || key === 'ArrowRight' || key === 'ArrowUp' || key === 'ArrowDown';
}

function isKeyboardDragPressed(value: unknown): boolean {
    return value === true || value === 'true';
}

function hasSortableData(entry: SortableDataEntry | null | undefined): entry is SortableDataEntry & {
    data: {current: {sortable: {containerId: string; items: Array<string | number>; index: number}}};
} {
    return entry?.data?.current?.sortable != null;
}

function getSortableEntries(
    currentEntry: SortableDataEntry & {
        data: {current: {sortable: {containerId: string; items: Array<string | number>; index: number}}};
    },
    droppableContainers: {getEnabled: () => Array<SortableDataEntry | undefined>},
): Array<
    SortableDataEntry & {
        data: {current: {sortable: {containerId: string; items: Array<string | number>; index: number}}};
    }
> {
    return droppableContainers
        .getEnabled()
        .filter(
            (
                entry,
            ): entry is SortableDataEntry & {
                data: {current: {sortable: {containerId: string; items: Array<string | number>; index: number}}};
            } =>
                Boolean(
                    entry &&
                        !entry.disabled &&
                        hasSortableData(entry) &&
                        entry.data.current.sortable.containerId === currentEntry.data.current.sortable.containerId,
                ),
        )
        .sort((first, second) => first.data.current.sortable.index - second.data.current.sortable.index);
}

const tagKeyboardCoordinates: KeyboardCoordinateGetter = (event, args) => {
    const {context} = args;

    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.code)) {
        return sortableKeyboardCoordinates(event, args);
    }

    event.preventDefault();

    if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
        return undefined;
    }

    const {active, droppableRects, droppableContainers, over} = context;
    const currentEntry = (over != null ? droppableContainers.get(over.id) : droppableContainers.get(active?.id)) as
        | SortableDataEntry
        | undefined;

    if (!active || !currentEntry || !hasSortableData(currentEntry)) {
        return undefined;
    }

    const entries = getSortableEntries(currentEntry, droppableContainers);
    const currentIndex = entries.findIndex(entry => entry.id === currentEntry.id);
    if (currentIndex === -1) {
        return undefined;
    }

    const target = entries[currentIndex + (event.code === 'ArrowLeft' ? -1 : 1)];
    const targetRect = target ? droppableRects.get(target.id) : undefined;
    if (targetRect == null) {
        return undefined;
    }

    return {
        x: targetRect.left,
        y: targetRect.top,
    };
};

function toTransformCSS(transform: SortableTransform | null): string | undefined {
    if (transform == null) {
        return undefined;
    }
    return `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0)`;
}

function getTagViewState(occurrences: Occurrences, enabled: boolean, valueCount: number): TagViewState {
    const isFixed = occurrences.getMinimum() > 0 && occurrences.getMinimum() === occurrences.getMaximum();
    const canAdd = enabled && !occurrences.maximumReached(valueCount);
    const canRemove = enabled && valueCount > 0;

    return {
        canAdd,
        canRemove,
        showDrag: enabled && occurrences.multiple() && valueCount >= 2 && !isFixed,
    };
}

function getOrCreateTagId(idsByValue: WeakMap<Value, string>, nextId: RefObject<number>, value: Value): string {
    let id = idsByValue.get(value);
    if (id == null) {
        id = `tag-${nextId.current}`;
        nextId.current += 1;
        idsByValue.set(value, id);
    }
    return id;
}

function focusElementNextFrame(element: HTMLElement | null | undefined): void {
    requestAnimationFrame(() => element?.focus());
}

function clearCleanupRef(cleanupRef: RefObject<(() => void) | null>): void {
    cleanupRef.current?.();
    cleanupRef.current = null;
}

function useDragScrollListener(): DragScrollListener {
    const cleanupRef = useRef<(() => void) | null>(null);

    const clear = () => clearCleanupRef(cleanupRef);

    useEffect(() => {
        return () => clearCleanupRef(cleanupRef);
    }, []);

    const listen = (ownerDocument: Document, onScroll: () => void) => {
        clear();
        ownerDocument.addEventListener('scroll', onScroll, true);
        cleanupRef.current = () => {
            ownerDocument.removeEventListener('scroll', onScroll, true);
        };
    };

    return {clear, listen};
}

function compactHiddenTagSlots(values: Value[], onMove: (fromIndex: number, toIndex: number) => void): void {
    let targetIndex = 0;

    values.forEach((value, index) => {
        if (!isRenderableTagValue(value)) {
            return;
        }

        if (index !== targetIndex) {
            onMove(index, targetIndex);
        }

        targetIndex += 1;
    });
}

function getCompactedTagIndex(values: Value[], index: number): number {
    let compactedIndex = 0;

    for (let currentIndex = 0; currentIndex < index; currentIndex += 1) {
        if (isRenderableTagValue(values[currentIndex])) {
            compactedIndex += 1;
        }
    }

    return compactedIndex;
}

//
// * TagDraftInput
//

function renderTagDraftInput({
    draft,
    enabled,
    invalid,
    visible,
    inputRef,
    onChange,
    onFocus,
    onKeyDown,
    onPaste,
    onBlur,
}: TagDraftInputProps): ReactElement {
    return (
        <li
            className={cn(
                'shrink-0 overflow-hidden',
                visible
                    ? 'w-36 opacity-100'
                    : 'pointer-events-none w-0 opacity-0 focus-within:pointer-events-auto focus-within:w-36 focus-within:opacity-100',
            )}
        >
            <Input
                ref={inputRef}
                className={cn(
                    '[&_input]:px-2.5 [&_input]:text-sm',
                    '[&>div[data-state]]:h-7 [&>div[data-state]]:border-transparent! [&>div[data-state]]::text-sm',
                    '[&>div[data-state]:focus-within]:border-bdr-subtle! [&>div[data-state]]:hover:outline-none!',
                    '[&>div[data-state]:focus-within]:ring-0! [&>div[data-state]:focus-within]:ring-offset-0!',
                    invalid && '[&>div[data-state]:focus-within]:border-error! [&>div[data-state]]:border-error!',
                )}
                value={draft}
                onChange={(event: JSX.TargetedEvent<HTMLInputElement>) => onChange(event.currentTarget.value)}
                onFocus={onFocus}
                onKeyDown={onKeyDown}
                onPaste={onPaste}
                onBlur={onBlur}
                disabled={!enabled}
                aria-invalid={invalid || undefined}
            />
        </li>
    );
}

//
// * TagItem
//

const TagItem = ({
    id,
    label,
    error,
    enabled,
    isTabStop,
    showDrag,
    showRemove,
    registerFocusableRef,
    registerRemoveRef,
    onNavigate,
    onDragMove,
    onDeleteKey,
    onRemovePointerDown,
    onRemoveKey,
    onRemove,
}: TagItemProps): ReactElement => {
    const t = useI18n();
    const visibleLabel = getVisibleTagLabel(label);
    const tooltipValue = isTagLabelCropped(label) ? label : undefined;
    const dragButtonRef = useRef<HTMLButtonElement | null>(null);
    const removeButtonRef = useRef<HTMLButtonElement | null>(null);
    const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({
        id,
        disabled: !showDrag,
    });
    const isKeyboardDragging = isKeyboardDragPressed(attributes['aria-pressed']);
    const setRefs = (node: HTMLLIElement | null) => setNodeRef(node);
    const setDragButtonRef = (node: HTMLButtonElement | null) => {
        dragButtonRef.current = node;
        registerFocusableRef(node);
    };
    const setRemoveButtonRef = (node: HTMLButtonElement | null) => {
        removeButtonRef.current = node;
        registerRemoveRef(node);
        if (!showDrag) {
            registerFocusableRef(node);
        }
    };

    const dragInteractionProps = {
        onPointerDown: listeners?.onPointerDown as preact.JSX.PointerEventHandler<HTMLButtonElement> | undefined,
        onPointerUp: listeners?.onPointerUp as preact.JSX.PointerEventHandler<HTMLButtonElement> | undefined,
        onPointerCancel: listeners?.onPointerCancel as preact.JSX.PointerEventHandler<HTMLButtonElement> | undefined,
        onPointerMove: listeners?.onPointerMove as preact.JSX.PointerEventHandler<HTMLButtonElement> | undefined,
        onPointerLeave: listeners?.onPointerLeave as preact.JSX.PointerEventHandler<HTMLButtonElement> | undefined,
        onTouchStart: listeners?.onTouchStart as preact.JSX.TouchEventHandler<HTMLButtonElement> | undefined,
        onTouchEnd: listeners?.onTouchEnd as preact.JSX.TouchEventHandler<HTMLButtonElement> | undefined,
        onTouchMove: listeners?.onTouchMove as preact.JSX.TouchEventHandler<HTMLButtonElement> | undefined,
        onTouchCancel: listeners?.onTouchCancel as preact.JSX.TouchEventHandler<HTMLButtonElement> | undefined,
        onMouseDown: listeners?.onMouseDown as preact.JSX.MouseEventHandler<HTMLButtonElement> | undefined,
    };

    const dragAccessibilityProps = showDrag
        ? {
              role: attributes.role as preact.JSX.AriaRole,
              tabIndex: enabled && isTabStop ? (attributes.tabIndex ?? 0) : -1,
              'aria-disabled': attributes['aria-disabled'],
              'aria-pressed': attributes['aria-pressed'],
              'aria-roledescription': attributes['aria-roledescription'],
              'aria-describedby': attributes['aria-describedby'],
          }
        : undefined;

    const handleDragButtonKeyDownCapture: preact.JSX.KeyboardEventHandler<HTMLButtonElement> = event => {
        if (!event.altKey && !event.ctrlKey && !event.metaKey && isArrowKey(event.key)) {
            event.preventDefault();
        }
    };

    const handleDragButtonKeyDown: preact.JSX.KeyboardEventHandler<HTMLButtonElement> = event => {
        if (event.altKey || event.ctrlKey || event.metaKey) {
            return;
        }

        if (isKeyboardDragging) {
            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                onDragMove(-1);
                return;
            }

            if (event.key === 'ArrowRight') {
                event.preventDefault();
                onDragMove(1);
                return;
            }

            if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                event.preventDefault();
                return;
            }

            (listeners?.onKeyDown as preact.JSX.KeyboardEventHandler<HTMLButtonElement>)?.(event);
            return;
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            event.currentTarget.blur();
            return;
        }

        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
            event.preventDefault();
            onNavigate(-1);
            return;
        }

        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
            event.preventDefault();
            if (showRemove && removeButtonRef.current != null) {
                removeButtonRef.current.focus();
            } else {
                onNavigate(1);
            }
            return;
        }

        if (event.key === 'Backspace' || event.key === 'Delete') {
            event.preventDefault();
            onDeleteKey();
            return;
        }

        if (event.key === ' ' || event.key === 'Enter') {
            (listeners?.onKeyDown as preact.JSX.KeyboardEventHandler<HTMLButtonElement>)?.(event);
        }
    };

    const handleRemoveButtonKeyDown: preact.JSX.KeyboardEventHandler<HTMLButtonElement> = event => {
        if (event.altKey || event.ctrlKey || event.metaKey) {
            return;
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            event.currentTarget.blur();
            return;
        }

        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
            event.preventDefault();
            if (showDrag && dragButtonRef.current != null) {
                dragButtonRef.current.focus();
            } else {
                onNavigate(-1);
            }
            return;
        }

        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
            event.preventDefault();
            onNavigate(1);
            return;
        }

        if (!isRemoveButtonKey(event.key)) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        onRemoveKey();
    };

    return (
        <li
            ref={setRefs}
            style={{
                transform: toTransformCSS(transform),
                transition: transition ?? undefined,
                zIndex: isDragging ? 1 : undefined,
            }}
            title={error}
            className={cn(
                'inline-flex max-w-full items-center gap-1.5 rounded-sm border py-0.75',
                showDrag ? 'pl-2' : 'pl-2.5',
                showRemove ? 'pr-2' : 'pr-2.5',
                'bg-surface-neutral text-sm',
                'outline-none',
                error ? 'border-current text-error ring-error' : 'border-bdr-strong text-foreground ring-ring',
                isDragging && 'cursor-grabbing ring-1',
                !enabled && 'cursor-default border-bdr-subtle',
            )}
        >
            {showDrag && (
                <IconButton
                    ref={setDragButtonRef}
                    icon={GripVertical}
                    iconSize='sm'
                    variant='text'
                    className={cn(
                        'size-5 focus-visible:ring-2 focus-visible:ring-offset-2',
                        enabled && (isDragging ? 'cursor-grabbing' : 'cursor-grab'),
                    )}
                    disabled={!enabled}
                    aria-label={t('field.occurrence.action.reorder')}
                    onKeyDownCapture={handleDragButtonKeyDownCapture}
                    onKeyDown={handleDragButtonKeyDown}
                    {...dragInteractionProps}
                    {...dragAccessibilityProps}
                />
            )}
            <Tooltip value={tooltipValue} side='top' className='max-w-64 whitespace-normal break-words'>
                <span className='font-semibold'>{visibleLabel}</span>
            </Tooltip>
            {showRemove && (
                <IconButton
                    ref={setRemoveButtonRef}
                    icon={X}
                    iconSize='sm'
                    variant='text'
                    className='size-5 focus-visible:ring-2 focus-visible:ring-offset-2'
                    tabIndex={enabled && isTabStop && !showDrag ? 0 : -1}
                    disabled={!enabled}
                    aria-label={t('field.occurrence.action.remove')}
                    onPointerDown={event => {
                        event.preventDefault();
                        onRemovePointerDown();
                    }}
                    onMouseDown={event => {
                        event.preventDefault();
                        onRemovePointerDown();
                    }}
                    onKeyDown={handleRemoveButtonKeyDown}
                    onClick={onRemove}
                />
            )}
        </li>
    );
};

//
// * TagInput
//

export const TagInput = ({
    values,
    onChange,
    onAdd,
    onRemove,
    onMove,
    occurrences,
    enabled,
    errors,
}: TagInputProps): ReactElement => {
    const t = useI18n();
    const [draft, setDraft] = useState('');
    const [isInputActive, setIsInputActive] = useState(false);
    const [hasFocusWithin, setHasFocusWithin] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const tagRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const removeTagRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const draftRef = useRef(draft);
    const skipBlurCommit = useRef(false);
    const idsByValue = useRef(new WeakMap<Value, string>());
    const nextId = useRef(0);
    const isDraggingRef = useRef(false);
    const dragScrollListener = useDragScrollListener();
    draftRef.current = draft;
    const tagEntries = values.reduce<TagEntry[]>((entries, value, index) => {
        if (!isRenderableTagValue(value)) {
            return entries;
        }

        entries.push({
            value,
            originalIndex: index,
            id: getOrCreateTagId(idsByValue.current, nextId, value),
        });

        return entries;
    }, []);
    const visibleTagIndexes = new Set(tagEntries.map(entry => entry.originalIndex));
    const visibleErrors = tagEntries.flatMap(entry =>
        errors[entry.originalIndex] != null ? [errors[entry.originalIndex]] : [],
    );
    const hiddenErrors = errors.filter((_, index) => !visibleTagIndexes.has(index));
    const visibleTagCount = tagEntries.length;
    const {canAdd, canRemove, showDrag} = getTagViewState(occurrences, enabled, visibleTagCount);
    const showInlineInput = canAdd;
    const isDraftInputVisible = isInputActive || draft.length > 0;
    const [dragContextKey, setDragContextKey] = useState(0);
    const sensors = useSensors(
        useSensor(PointerSensor, {activationConstraint: {distance: 5}}),
        useSensor(KeyboardSensor, {coordinateGetter: tagKeyboardCoordinates}),
    );

    const ids = tagEntries.map(entry => entry.id);
    const normalizedDraft = normalizeTagDraft(draft);
    const isDraftDuplicate = hasTagLabel(
        tagEntries.map(entry => entry.value),
        normalizedDraft,
    );

    const hasSuppressedHiddenEntries = hiddenErrors.some(
        entry => !entry.breaksRequired && entry.validationResults.length === 0,
    );
    const occurrenceError = hasSuppressedHiddenEntries
        ? undefined
        : getOccurrenceErrorMessage(occurrences, visibleErrors, t);
    const firstVisibleFieldError = tagEntries
        .map(entry => getFirstError(errors[entry.originalIndex]?.validationResults ?? []))
        .find(Boolean);
    const hiddenCustomError = hiddenErrors
        .flatMap(entry => entry.validationResults.filter(result => result.custom))
        .map(result => result.message)
        .find(Boolean);
    const fieldErrorText = firstVisibleFieldError ?? hiddenCustomError;
    const hasErrors = fieldErrorText != null || occurrenceError != null;
    const focusInput = () => {
        setIsInputActive(true);
        requestAnimationFrame(() => inputRef.current?.focus());
    };

    const handleFieldActivate = () => {
        if (!canAdd || !enabled) {
            return;
        }
        focusInput();
    };

    const handleInputFocus = () => {
        setIsInputActive(true);
    };

    const focusTagAt = (index: number) => {
        requestAnimationFrame(() => {
            if (index < 0) {
                return;
            }
            if (index >= visibleTagCount) {
                inputRef.current?.focus();
                return;
            }
            tagRefs.current[index]?.focus();
        });
    };

    const focusRemoveAt = (index: number) => {
        requestAnimationFrame(() => {
            if (index < 0) {
                return;
            }
            if (index >= visibleTagCount) {
                inputRef.current?.focus();
                return;
            }
            (removeTagRefs.current[index] ?? tagRefs.current[index])?.focus();
        });
    };

    const focusTagIndexNextFrame = (index: number) => {
        requestAnimationFrame(() => {
            if (index < 0) {
                return;
            }

            tagRefs.current[index]?.focus();
        });
    };

    const setDraftValue = (value: string) => {
        draftRef.current = value;
        setDraft(value);
    };

    const commitTagLabels = (
        rawLabels: string[],
        {focusTarget, clearDraft = false}: CommitTagLabelsOptions = {},
    ): CommitTagLabelsResult => {
        const maximum = occurrences.getMaximum();
        const remainingCapacity = maximum === 0 ? Number.POSITIVE_INFINITY : Math.max(maximum - visibleTagCount, 0);

        if (remainingCapacity === 0) {
            return {committedCount: 0, usedHiddenSlots: 0};
        }

        const knownLabels = new Set(
            values.map(value => normalizeTagDraft(getTagLabel(value))).filter(hasRenderableTagLabel),
        );
        const labelsToCommit: string[] = [];

        rawLabels.forEach(rawLabel => {
            if (labelsToCommit.length >= remainingCapacity) {
                return;
            }

            const normalizedLabel = normalizeTagDraft(rawLabel);
            if (!hasRenderableTagLabel(normalizedLabel) || knownLabels.has(normalizedLabel)) {
                return;
            }

            knownLabels.add(normalizedLabel);
            labelsToCommit.push(normalizedLabel);
        });

        if (labelsToCommit.length === 0) {
            return {committedCount: 0, usedHiddenSlots: 0};
        }

        const usedHiddenSlots = Math.min(Math.max(values.length - visibleTagCount, 0), labelsToCommit.length);

        if (usedHiddenSlots > 0) {
            compactHiddenTagSlots(values, onMove);
        }

        labelsToCommit.forEach((label, index) => {
            const nextValue = ValueTypes.STRING.newValue(label);
            if (index < usedHiddenSlots) {
                onChange(visibleTagCount + index, nextValue, label);
                return;
            }

            onAdd(nextValue);
        });

        const nextVisibleTagCount = visibleTagCount + labelsToCommit.length;
        const hasRoomForAnother = maximum === 0 || nextVisibleTagCount < maximum;

        if (clearDraft || !hasRoomForAnother) {
            setDraftValue('');
        }

        if (focusTarget != null) {
            if (hasRoomForAnother) {
                focusElementNextFrame(focusTarget);
            } else {
                skipBlurCommit.current = true;
                setIsInputActive(false);
                const lastTagIndex = nextVisibleTagCount - 1;
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        (removeTagRefs.current[lastTagIndex] ?? tagRefs.current[lastTagIndex])?.focus();
                    });
                });
            }
        }

        return {committedCount: labelsToCommit.length, usedHiddenSlots};
    };

    const commitDraft = (
        focusTarget?: HTMLInputElement,
        excludedIndex?: number,
        rawDraft = draftRef.current,
    ): CommitDraftResult => {
        const normalized = normalizeTagDraft(rawDraft);
        if (normalized.length === 0) {
            setDraftValue('');
            return {committed: false, usedHiddenSlot: false};
        }

        if (hasTagLabel(values, normalized, excludedIndex)) {
            return {committed: false, usedHiddenSlot: false};
        }

        if (!canAdd) {
            return {committed: false, usedHiddenSlot: false};
        }

        const {committedCount, usedHiddenSlots} = commitTagLabels([normalized], {focusTarget, clearDraft: true});

        return {
            committed: committedCount > 0,
            usedHiddenSlot: usedHiddenSlots > 0,
        };
    };

    const prepareRemove = () => {
        skipBlurCommit.current = true;
    };

    const handleRemove = (index: number, options: RemoveTagOptions = {}) => {
        const {activateInput = false, focusPreviousTag = false, commitCurrentDraft = false} = options;
        let removeIndex = index;

        if (commitCurrentDraft) {
            const {usedHiddenSlot} = commitDraft(undefined, index);
            if (usedHiddenSlot) {
                removeIndex = getCompactedTagIndex(values, index);
            }
        }
        onRemove(removeIndex);

        if (focusPreviousTag) {
            const compactedIndex = getCompactedTagIndex(values, index);
            const targetIndex = Math.max(0, compactedIndex - 1);
            requestAnimationFrame(() => {
                (removeTagRefs.current[targetIndex] ?? tagRefs.current[targetIndex])?.focus();
            });
            return;
        }

        if (activateInput) {
            focusInput();
            return;
        }

        setIsInputActive(false);
    };

    const handleTagNavigate = (index: number, direction: -1 | 1) => {
        if (direction === -1) {
            focusRemoveAt(index + direction);
        } else {
            focusTagAt(index + direction);
        }
    };

    const handleKeyboardDragMove = (index: number, direction: -1 | 1) => {
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= visibleTagCount) {
            return;
        }

        onMove(tagEntries[index].originalIndex, tagEntries[targetIndex].originalIndex);
        focusTagAt(targetIndex);
    };

    const handleFieldPointerDown: preact.JSX.PointerEventHandler<HTMLElement> = event => {
        if (event.target === event.currentTarget) {
            handleFieldActivate();
        }
    };

    const getTagItemProps = (entry: TagEntry, index: number): TagItemProps => ({
        id: entry.id,
        label: getTagLabel(entry.value),
        error: getFirstError(errors[entry.originalIndex]?.validationResults ?? []),
        enabled,
        isTabStop: !showInlineInput && !hasFocusWithin && index === visibleTagCount - 1,
        showDrag,
        showRemove: canRemove,
        registerFocusableRef: node => {
            tagRefs.current[index] = node;
        },
        registerRemoveRef: node => {
            removeTagRefs.current[index] = node;
        },
        onNavigate: direction => handleTagNavigate(index, direction),
        onDragMove: direction => handleKeyboardDragMove(index, direction),
        onDeleteKey: () => handleRemove(entry.originalIndex, {focusPreviousTag: true}),
        onRemovePointerDown: prepareRemove,
        onRemoveKey: () => handleRemove(entry.originalIndex, {activateInput: true, commitCurrentDraft: true}),
        onRemove: () => handleRemove(entry.originalIndex, {commitCurrentDraft: true}),
    });

    const commitAndLeaveInput = (input: HTMLInputElement, focusFn: (index: number) => void) => {
        const {committed} = commitDraft(undefined, undefined, input.value);
        const focusIndex = committed && visibleTagCount === 0 ? 0 : visibleTagCount - 1;
        skipBlurCommit.current = true;
        setIsInputActive(false);
        input.blur();
        focusFn(focusIndex);
    };

    const handleKeyDown = (event: JSX.TargetedKeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            commitAndLeaveInput(event.currentTarget, focusTagIndexNextFrame);
            return;
        }

        const isAtStart = event.currentTarget.selectionStart === 0 && event.currentTarget.selectionEnd === 0;

        if (visibleTagCount > 0 && isAtStart && (event.key === 'ArrowLeft' || event.key === 'ArrowUp')) {
            event.preventDefault();
            commitAndLeaveInput(event.currentTarget, focusRemoveAt);
            return;
        }

        if (visibleTagCount > 0 && isAtStart && event.key === 'Backspace') {
            event.preventDefault();
            commitAndLeaveInput(event.currentTarget, focusRemoveAt);
            return;
        }

        if (event.key !== 'Enter' && event.key !== ',') {
            return;
        }

        event.preventDefault();
        commitDraft(event.currentTarget);
    };

    const handlePaste = (event: JSX.TargetedClipboardEvent<HTMLInputElement>) => {
        const pastedText = event.clipboardData?.getData('text/plain');
        if (pastedText == null || !hasPastedTagSeparators(pastedText)) {
            return;
        }

        event.preventDefault();

        const pastedLabels = getPastedTagLabels(pastedText);
        if (pastedLabels.length === 0) {
            return;
        }

        const currentDraft = normalizeTagDraft(draftRef.current);
        const labelsToCommit = hasRenderableTagLabel(currentDraft) ? [currentDraft, ...pastedLabels] : pastedLabels;

        commitTagLabels(labelsToCommit, {
            focusTarget: event.currentTarget,
            clearDraft: true,
        });
    };

    const handleBlur = (event: JSX.TargetedFocusEvent<HTMLInputElement>) => {
        if (skipBlurCommit.current) {
            skipBlurCommit.current = false;
            return;
        }

        commitDraft(undefined, undefined, event.currentTarget.value);
        setIsInputActive(false);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        isDraggingRef.current = false;
        dragScrollListener.clear();

        const {active, over} = event;
        if (over == null || active.id === over.id) {
            return;
        }

        const fromIndex = ids.indexOf(String(active.id));
        const toIndex = ids.indexOf(String(over.id));
        if (fromIndex === -1 || toIndex === -1) {
            return;
        }
        onMove(tagEntries[fromIndex].originalIndex, tagEntries[toIndex].originalIndex);
    };

    const handleDragStart = (_event: DragStartEvent) => {
        isDraggingRef.current = true;
        dragScrollListener.clear();

        const ownerDocument = wrapperRef.current?.ownerDocument;
        if (ownerDocument == null) {
            return;
        }

        const handleScroll = () => {
            if (!isDraggingRef.current) {
                return;
            }

            isDraggingRef.current = false;
            dragScrollListener.clear();
            setDragContextKey(current => current + 1);
        };

        dragScrollListener.listen(ownerDocument, handleScroll);
    };

    const handleDragCancel = () => {
        isDraggingRef.current = false;
        dragScrollListener.clear();
    };

    return (
        <div data-component={TAG_INPUT_NAME} className='flex flex-col gap-y-2'>
            <div
                ref={wrapperRef}
                className={cn(
                    'rounded border border-bdr-subtle px-2 py-2',
                    'hover:outline-2 hover:outline-bdr-subtle hover:-outline-offset-1',
                    'focus-within:border-bdr-solid focus-within:outline-none',
                    'focus-within:ring-3 focus-within:ring-ring focus-within:ring-offset-3 focus-within:ring-offset-ring-offset',
                    'transition-highlight',
                    canAdd && 'cursor-text',
                    hasErrors && 'border-error focus-within:border-error focus-within:ring-error hover:outline-error',
                )}
                onPointerDown={handleFieldPointerDown}
                onFocus={() => setHasFocusWithin(true)}
                onBlur={() => {
                    requestAnimationFrame(() => {
                        if (!wrapperRef.current?.contains(document.activeElement)) {
                            setHasFocusWithin(false);
                        }
                    });
                }}
            >
                <DndContext
                    key={dragContextKey}
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    autoScroll={false}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragCancel={handleDragCancel}
                >
                    <SortableContext items={ids} strategy={rectSortingStrategy}>
                        <ul className='flex flex-wrap items-center gap-2' onPointerDown={handleFieldPointerDown}>
                            {tagEntries.map((entry, index) => (
                                <TagItem key={entry.id} {...getTagItemProps(entry, index)} />
                            ))}
                            {showInlineInput &&
                                renderTagDraftInput({
                                    draft,
                                    enabled,
                                    invalid: isDraftDuplicate,
                                    visible: isDraftInputVisible,
                                    inputRef,
                                    onChange: setDraftValue,
                                    onFocus: handleInputFocus,
                                    onKeyDown: handleKeyDown,
                                    onPaste: handlePaste,
                                    onBlur: handleBlur,
                                })}
                        </ul>
                    </SortableContext>
                </DndContext>
            </div>
            <FieldError message={fieldErrorText} />
        </div>
    );
};

TagInput.displayName = TAG_INPUT_NAME;
