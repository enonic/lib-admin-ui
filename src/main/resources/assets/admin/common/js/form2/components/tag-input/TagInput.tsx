import {
    closestCenter,
    DndContext,
    type DragEndEvent,
    type DragStartEvent,
    type KeyboardCoordinateGetter,
    KeyboardSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable} from '@dnd-kit/sortable';
import {cn, getIsMobile, IconButton, Input, subscribeToMobileChanges, Tooltip} from '@enonic/ui';
import {GripVertical, X} from 'lucide-react';
import {
    type JSX,
    type ReactElement,
    type RefObject,
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    useState,
    useSyncExternalStore,
} from 'react';

import type {Value} from '../../../data/Value';
import {ValueTypes} from '../../../data/ValueTypes';
import type {Occurrences} from '../../../form/Occurrences';
import type {InputTypeConfig} from '../../descriptor';
import {useI18n} from '../../I18nContext';
import type {SelfManagedComponentProps} from '../../types';
import {getFirstError, getInputAccessibleName, getOccurrenceErrorMessage} from '../../utils';
import {useValidationVisibility} from '../../ValidationContext';
import {FieldError} from '../field-error';
import {HANDLE_TOUCH_SENSOR_OPTIONS, MOUSE_SENSOR_OPTIONS, PrimaryButtonMouseSensor} from '../sortableSensors';
import {
    getPastedTagLabels,
    getSuggestedTagLabels,
    getTagLabel,
    getVisibleTagLabel,
    hasPastedTagSeparators,
    hasRenderableTagLabel,
    hasTagLabel,
    isRenderableTagValue,
    isTagLabelCropped,
    normalizeTagDraft,
} from './tag-input.utils';

export {
    getPastedTagLabels,
    getSuggestedTagLabels,
    getTagLabel,
    getVisibleTagLabel,
    hasPastedTagSeparators,
    hasTagLabel,
    isTagLabelCropped,
    normalizeTagDraft,
} from './tag-input.utils';

const TAG_INPUT_NAME = 'TagInput';
const SUGGESTION_LIST_ID = 'tag-input-suggestions';
const SUGGESTION_DEBOUNCE_MS = 300;
const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button',
    'input:not([type="hidden"])',
    'select',
    'textarea',
    '[contenteditable]:not([contenteditable="false"])',
    '[tabindex]',
].join(',');

//
// * Types
//

type SortableTransform = {x: number; y: number; scaleX: number; scaleY: number};

type TagItemProps = {
    id: string;
    label: string;
    error?: string;
    enabled: boolean;
    editing: boolean;
    editDraft: string;
    editInvalid: boolean;
    selectEditText: boolean;
    isTabStop: boolean;
    showDrag: boolean;
    showRemove: boolean;
    registerFocusableRef: (node: HTMLButtonElement | null) => void;
    registerRemoveRef: (node: HTMLButtonElement | null) => void;
    onNavigate: (direction: -1 | 1) => void;
    onDragMove: (direction: -1 | 1) => void;
    onDeleteKey: () => void;
    onEditStart: (initialDraft?: string, selectText?: boolean) => void;
    onEditChange: (value: string) => void;
    onEditCommit: (rawDraft: string, explicit?: boolean, focusTarget?: HTMLInputElement) => boolean;
    onEditCancel: () => void;
    onEditRemovePrevious: () => void;
    onRemovePointerDown: () => void;
    onRemoveKey: () => void;
    onRemove: () => void;
};

export type TagSuggester = (query: string) => Promise<string[]>;

export type TagInputProps<C extends InputTypeConfig = InputTypeConfig> = SelfManagedComponentProps<C> & {
    suggestTags?: TagSuggester;
};

type TagViewState = {
    canAdd: boolean;
    canRemove: boolean;
    showDrag: boolean;
};

type TagDraftInputProps = {
    draft: string;
    accessibleName: string;
    enterKeyHint?: 'enter' | 'next';
    enabled: boolean;
    invalid: boolean;
    visible: boolean;
    inputRef: RefObject<HTMLInputElement | null>;
    onChange: (value: string) => void;
    onFocus: () => void;
    onKeyDown: (event: JSX.TargetedKeyboardEvent<HTMLInputElement>) => void;
    onPaste: (event: JSX.TargetedClipboardEvent<HTMLInputElement>) => void;
    onBlur: (event: JSX.TargetedFocusEvent<HTMLInputElement>) => void;
    suggestionListId?: string;
    activeSuggestionId?: string;
    suggestionsExpanded: boolean;
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

type EditingState = {
    id: string;
    selectText: boolean;
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
const KEYBOARD_SENSOR_OPTIONS = {coordinateGetter: tagKeyboardCoordinates};

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

function focusElementNextFrame(element: HTMLElement | null | undefined): void {
    requestAnimationFrame(() => element?.focus());
}

function isTabTarget(element: HTMLElement): boolean {
    if (!element.isConnected || element.tabIndex < 0 || element.matches(':disabled')) {
        return false;
    }

    if (element.closest('[hidden], [inert]') != null) {
        return false;
    }

    const style = element.ownerDocument.defaultView?.getComputedStyle(element);
    if (style?.display === 'none' || style?.visibility === 'hidden' || style?.visibility === 'collapse') {
        return false;
    }

    return element.getClientRects().length > 0;
}

function getNextFocusableElements(element: HTMLElement): HTMLElement[] {
    const container = element.closest('[data-component="TagInput"]');
    const focusableElements = Array.from(element.ownerDocument.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
        .map((candidate, domIndex) => ({candidate, domIndex}))
        .sort((first, second) => {
            const firstTabIndex = first.candidate.tabIndex;
            const secondTabIndex = second.candidate.tabIndex;
            const firstIsPositive = firstTabIndex > 0;
            const secondIsPositive = secondTabIndex > 0;

            if (firstIsPositive && secondIsPositive && firstTabIndex !== secondTabIndex) {
                return firstTabIndex - secondTabIndex;
            }
            if (firstIsPositive !== secondIsPositive) {
                return firstIsPositive ? -1 : 1;
            }
            return first.domIndex - second.domIndex;
        })
        .map(({candidate}) => candidate);
    const currentIndex = focusableElements.indexOf(element);
    if (currentIndex < 0) {
        return [];
    }

    return focusableElements.slice(currentIndex + 1).filter(candidate => !container?.contains(candidate));
}

function focusFirstAvailable(candidates: HTMLElement[]): boolean {
    for (const candidate of candidates) {
        if (!isTabTarget(candidate)) {
            continue;
        }

        candidate.focus();
        if (candidate.ownerDocument.activeElement === candidate) {
            return true;
        }
    }

    return false;
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
    accessibleName,
    enterKeyHint,
    enabled,
    invalid,
    visible,
    inputRef,
    onChange,
    onFocus,
    onKeyDown,
    onPaste,
    onBlur,
    suggestionListId,
    activeSuggestionId,
    suggestionsExpanded,
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
                aria-label={accessibleName}
                enterKeyHint={enterKeyHint}
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
                aria-autocomplete='list'
                aria-expanded={suggestionsExpanded}
                aria-controls={suggestionsExpanded ? suggestionListId : undefined}
                aria-activedescendant={activeSuggestionId}
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
    editing,
    editDraft,
    editInvalid,
    selectEditText,
    isTabStop,
    showDrag,
    showRemove,
    registerFocusableRef,
    registerRemoveRef,
    onNavigate,
    onDragMove,
    onDeleteKey,
    onEditStart,
    onEditChange,
    onEditCommit,
    onEditCancel,
    onEditRemovePrevious,
    onRemovePointerDown,
    onRemoveKey,
    onRemove,
}: TagItemProps): ReactElement => {
    const t = useI18n();
    const visibleLabel = getVisibleTagLabel(label);
    const tooltipValue = isTagLabelCropped(label) ? label : undefined;
    const editInputRef = useRef<HTMLInputElement | null>(null);
    const skipEditBlur = useRef(false);
    const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({
        id,
        disabled: !showDrag || editing,
    });
    const isKeyboardDragging = isKeyboardDragPressed(attributes['aria-pressed']);

    useLayoutEffect(() => {
        if (editing) {
            skipEditBlur.current = false;
            editInputRef.current?.focus();
            if (selectEditText) {
                editInputRef.current?.select();
            } else {
                const draftLength = editInputRef.current?.value.length ?? 0;
                editInputRef.current?.setSelectionRange(draftLength, draftLength);
            }
        }
    }, [editing, selectEditText]);

    const setRefs = (node: HTMLLIElement | null) => setNodeRef(node);
    const setRemoveButtonRef = (node: HTMLButtonElement | null) => {
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
              tabIndex: -1,
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
            event.currentTarget.closest('li')?.querySelector<HTMLButtonElement>('[data-tag-label]')?.focus();
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

    const handleLabelButtonKeyDown: preact.JSX.KeyboardEventHandler<HTMLButtonElement> = event => {
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
            const dragButton = event.currentTarget.closest('li')?.querySelector<HTMLButtonElement>('[data-tag-drag]');
            if (dragButton != null) {
                dragButton.focus();
            } else {
                onNavigate(-1);
            }
            return;
        }

        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
            event.preventDefault();
            const removeButton = event.currentTarget
                .closest('li')
                ?.querySelector<HTMLButtonElement>('[data-tag-remove]');
            if (removeButton != null) {
                removeButton.focus();
            } else {
                onNavigate(1);
            }
            return;
        }

        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            event.stopPropagation();
            onEditStart();
        } else if (event.key.length === 1) {
            event.preventDefault();
            event.stopPropagation();
            onEditStart(event.key, false);
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
            event.currentTarget.closest('li')?.querySelector<HTMLButtonElement>('[data-tag-label]')?.focus();
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

    const handleEditKeyDown: preact.JSX.KeyboardEventHandler<HTMLInputElement> = event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            event.stopPropagation();
            skipEditBlur.current = onEditCommit(event.currentTarget.value, true, event.currentTarget);
        } else if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            skipEditBlur.current = true;
            onEditCancel();
        } else if (event.key === 'Backspace' && event.currentTarget.value.length === 0) {
            event.preventDefault();
            event.stopPropagation();
            skipEditBlur.current = true;
            onEditRemovePrevious();
        }
    };

    const handleEditBlur: preact.JSX.FocusEventHandler<HTMLInputElement> = event => {
        if (skipEditBlur.current) {
            skipEditBlur.current = false;
            return;
        }
        onEditCommit(event.currentTarget.value);
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
            {showDrag && !editing && (
                <IconButton
                    ref={registerFocusableRef}
                    data-tag-drag
                    icon={GripVertical}
                    iconSize='sm'
                    variant='text'
                    className={cn(
                        'size-5 touch-none focus-visible:ring-2 focus-visible:ring-offset-2',
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
            {editing ? (
                <input
                    ref={editInputRef}
                    data-tag-editor
                    className={cn('h-5 w-36 bg-transparent font-semibold outline-none', editInvalid && 'text-error')}
                    value={editDraft}
                    disabled={!enabled}
                    aria-label={`${t('action.edit')}: ${label}`}
                    aria-invalid={editInvalid || undefined}
                    onChange={event => onEditChange(event.currentTarget.value)}
                    onKeyDown={handleEditKeyDown}
                    onBlur={handleEditBlur}
                />
            ) : (
                <Tooltip value={tooltipValue} side='top' className='max-w-64 whitespace-normal break-words'>
                    <button
                        data-tag-label
                        type='button'
                        className='font-semibold outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
                        tabIndex={enabled && isTabStop ? 0 : -1}
                        disabled={!enabled}
                        aria-label={`${t('action.edit')}: ${label}`}
                        onKeyDown={handleLabelButtonKeyDown}
                        onClick={() => onEditStart()}
                    >
                        {visibleLabel}
                    </button>
                </Tooltip>
            )}
            {showRemove && !editing && (
                <IconButton
                    ref={setRemoveButtonRef}
                    data-tag-remove
                    icon={X}
                    iconSize='sm'
                    variant='text'
                    className='size-5 focus-visible:ring-2 focus-visible:ring-offset-2'
                    tabIndex={-1}
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
    occurrenceIds,
    values,
    onChange,
    onAdd,
    onRemove,
    onMove,
    occurrences,
    input,
    enabled,
    errors,
    suggestTags,
}: TagInputProps): ReactElement => {
    const t = useI18n();
    const visibility = useValidationVisibility();
    const isMobile = useSyncExternalStore(subscribeToMobileChanges, getIsMobile);
    const suggestionListId = `${SUGGESTION_LIST_ID}-${useId()}`;
    const [draft, setDraft] = useState('');
    const [isInputActive, setIsInputActive] = useState(false);
    const [hasFocusWithin, setHasFocusWithin] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const tagRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const removeTagRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const draftRef = useRef(draft);
    const skipBlurCommit = useRef(false);
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
            id: occurrenceIds[index],
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
    const maximum = occurrences.getMaximum();
    const nextTagReachesMaximum = maximum > 0 && visibleTagCount + 1 >= maximum;
    const enterKeyHint = isMobile ? (nextTagReachesMaximum ? 'next' : 'enter') : undefined;
    const isDraftInputVisible = isInputActive || draft.length > 0;
    const [dragContextKey, setDragContextKey] = useState(0);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
    const [touched, setTouched] = useState(false);
    const [editingState, setEditingState] = useState<EditingState | null>(null);
    const [editDraft, setEditDraft] = useState('');
    const showInlineInput = canAdd && editingState == null;
    const sensors = useSensors(
        useSensor(PrimaryButtonMouseSensor, MOUSE_SENSOR_OPTIONS),
        useSensor(TouchSensor, HANDLE_TOUCH_SENSOR_OPTIONS),
        useSensor(KeyboardSensor, KEYBOARD_SENSOR_OPTIONS),
    );

    const ids = tagEntries.map(entry => entry.id);
    const normalizedDraft = normalizeTagDraft(draft);
    const suggestionsVisible =
        editingState == null && enabled && canAdd && hasRenderableTagLabel(normalizedDraft) && suggestions.length > 0;
    const activeSuggestion =
        suggestionsVisible && activeSuggestionIndex >= 0 ? suggestions[activeSuggestionIndex] : undefined;
    const activeSuggestionId = activeSuggestion != null ? `${suggestionListId}-${activeSuggestionIndex}` : undefined;
    const isDraftDuplicate = hasTagLabel(
        tagEntries.map(entry => entry.value),
        normalizedDraft,
    );
    const normalizedEditDraft = normalizeTagDraft(editDraft);
    const editingEntry = tagEntries.find(entry => entry.id === editingState?.id);
    const isEditInvalid =
        editingEntry != null &&
        (!hasRenderableTagLabel(normalizedEditDraft) ||
            hasTagLabel(values, normalizedEditDraft, editingEntry.originalIndex));

    const hasSuppressedHiddenEntries = hiddenErrors.some(
        entry => !entry.breaksRequired && entry.validationResults.length === 0,
    );
    const occurrenceErrorVisible = visibility === 'all' || (visibility === 'interactive' && touched);
    const occurrenceError =
        !occurrenceErrorVisible || hasSuppressedHiddenEntries
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
    const fieldMessage = fieldErrorText ?? (visibility !== 'all' ? occurrenceError : undefined);
    const hasErrors = fieldErrorText != null || occurrenceError != null;
    const focusInput = () => {
        setIsInputActive(true);
        inputRef.current?.focus();
    };

    useEffect(() => {
        if (suggestTags == null || !enabled || !canAdd || !hasRenderableTagLabel(normalizedDraft)) {
            setSuggestions([]);
            setActiveSuggestionIndex(-1);
            return undefined;
        }

        let stale = false;
        setSuggestions([]);
        setActiveSuggestionIndex(-1);

        const timeoutId = setTimeout(() => {
            suggestTags(normalizedDraft).then(
                suggestedLabels => {
                    if (stale) {
                        return;
                    }

                    setSuggestions(getSuggestedTagLabels(suggestedLabels, values, normalizedDraft));
                },
                () => {
                    if (!stale) {
                        setSuggestions([]);
                    }
                },
            );
        }, SUGGESTION_DEBOUNCE_MS);

        return () => {
            stale = true;
            clearTimeout(timeoutId);
        };
    }, [suggestTags, normalizedDraft, enabled, canAdd, values]);

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

    const focusLabelAt = (index: number) => {
        requestAnimationFrame(() => {
            if (index < 0) {
                return;
            }
            if (index >= visibleTagCount) {
                inputRef.current?.focus();
                return;
            }
            wrapperRef.current?.querySelectorAll<HTMLButtonElement>('[data-tag-label]').item(index)?.focus();
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
        setTouched(true);
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

        const nextVisibleTagCount = visibleTagCount + labelsToCommit.length;
        const hasRoomForAnother = maximum === 0 || nextVisibleTagCount < maximum;
        const nextFocusableElements =
            isMobile && focusTarget != null && !hasRoomForAnother ? getNextFocusableElements(focusTarget) : [];
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
                        if (!focusFirstAvailable(nextFocusableElements)) {
                            (removeTagRefs.current[lastTagIndex] ?? tagRefs.current[lastTagIndex])?.focus();
                        }
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

    const commitSuggestion = (label: string, focusTarget: HTMLInputElement | null = inputRef.current) => {
        commitTagLabels([label], {
            focusTarget: focusTarget ?? undefined,
            clearDraft: true,
        });
        setSuggestions([]);
        setActiveSuggestionIndex(-1);
    };

    const prepareRemove = () => {
        skipBlurCommit.current = true;
    };

    const handleRemove = (index: number, options: RemoveTagOptions = {}) => {
        setTouched(true);
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

    const startEditing = (id: string, label: string, selectText = true) => {
        setEditingState({id, selectText});
        setEditDraft(label);
        setIsInputActive(false);
    };

    const cancelEditing = (focusIndex?: number) => {
        setEditingState(null);
        setEditDraft('');
        if (focusIndex != null) {
            focusLabelAt(focusIndex);
        }
    };

    const focusDraftInput = () => {
        setIsInputActive(true);
        requestAnimationFrame(() => inputRef.current?.focus());
    };

    const commitEditing = (rawDraft: string, explicit = false, focusTarget?: HTMLInputElement): boolean => {
        if (editingEntry == null) {
            return false;
        }

        const normalized = normalizeTagDraft(rawDraft);
        if (!hasRenderableTagLabel(normalized)) {
            onRemove(editingEntry.originalIndex);
            cancelEditing();
            if (explicit) {
                focusDraftInput();
            }
            return true;
        }

        if (hasTagLabel(values, normalized, editingEntry.originalIndex)) {
            if (!explicit) {
                cancelEditing();
                return true;
            }
            return false;
        }

        const editingVisibleIndex = tagEntries.findIndex(entry => entry.id === editingEntry.id);
        const nextFocusableElements =
            explicit && isMobile && !canAdd && focusTarget != null ? getNextFocusableElements(focusTarget) : [];
        const currentLabel = normalizeTagDraft(getTagLabel(editingEntry.value));
        if (normalized !== currentLabel) {
            onChange(editingEntry.originalIndex, ValueTypes.STRING.newValue(normalized), normalized);
        }
        cancelEditing();
        if (explicit) {
            if (canAdd) {
                focusDraftInput();
            } else {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        if (!focusFirstAvailable(nextFocusableElements)) {
                            (
                                removeTagRefs.current[editingVisibleIndex] ?? tagRefs.current[editingVisibleIndex]
                            )?.focus();
                        }
                    });
                });
            }
        }
        return true;
    };

    const removeEditingAndEditPrevious = () => {
        if (editingEntry == null) {
            return;
        }

        const visibleIndex = tagEntries.findIndex(entry => entry.id === editingEntry.id);
        const previousEntry = tagEntries[visibleIndex - 1];
        onRemove(editingEntry.originalIndex);

        if (previousEntry != null) {
            startEditing(previousEntry.id, getTagLabel(previousEntry.value));
        } else {
            cancelEditing();
            focusDraftInput();
        }
    };

    const editLastTagFromInput = (input: HTMLInputElement) => {
        const lastEntry = tagEntries[visibleTagCount - 1];
        if (lastEntry == null) {
            return;
        }

        skipBlurCommit.current = true;
        input.blur();
        startEditing(lastEntry.id, getTagLabel(lastEntry.value));
    };

    const handleFieldClick: preact.JSX.MouseEventHandler<HTMLElement> = event => {
        if (event.target === event.currentTarget) {
            handleFieldActivate();
        }
    };

    const getTagItemProps = (entry: TagEntry, index: number): TagItemProps => ({
        id: entry.id,
        label: getTagLabel(entry.value),
        error: getFirstError(errors[entry.originalIndex]?.validationResults ?? []),
        enabled,
        editing: editingState?.id === entry.id,
        editDraft,
        editInvalid: editingState?.id === entry.id && isEditInvalid,
        selectEditText: editingState?.selectText ?? true,
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
        onEditStart: (initialDraft = getTagLabel(entry.value), selectText = true) =>
            startEditing(entry.id, initialDraft, selectText),
        onEditChange: setEditDraft,
        onEditCommit: commitEditing,
        onEditCancel: () => cancelEditing(index),
        onEditRemovePrevious: removeEditingAndEditPrevious,
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
        if (isMobile && event.key === 'Enter') {
            event.stopPropagation?.();
        }

        if (suggestionsVisible && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
            event.preventDefault();
            setActiveSuggestionIndex(current => {
                if (event.key === 'ArrowDown') {
                    return current < suggestions.length - 1 ? current + 1 : 0;
                }

                return current > 0 ? current - 1 : suggestions.length - 1;
            });
            return;
        }

        if (event.key === 'Enter' && activeSuggestion != null) {
            event.preventDefault();
            commitSuggestion(activeSuggestion, event.currentTarget);
            return;
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            commitAndLeaveInput(event.currentTarget, focusTagIndexNextFrame);
            return;
        }

        const isAtStart = event.currentTarget.selectionStart === 0 && event.currentTarget.selectionEnd === 0;

        if (visibleTagCount > 0 && isAtStart && (event.key === 'ArrowLeft' || event.key === 'ArrowUp')) {
            event.preventDefault();
            commitAndLeaveInput(
                event.currentTarget,
                event.key === 'ArrowLeft' && draftRef.current.length === 0 ? focusLabelAt : focusRemoveAt,
            );
            return;
        }

        if (visibleTagCount > 0 && isAtStart && event.key === 'Backspace') {
            event.preventDefault();
            if (draftRef.current.length === 0) {
                editLastTagFromInput(event.currentTarget);
            } else {
                commitAndLeaveInput(event.currentTarget, focusRemoveAt);
            }
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

        setTouched(true);
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
                onClick={handleFieldClick}
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
                        <ul className='flex flex-wrap items-center gap-2' onClick={handleFieldClick}>
                            {tagEntries.map((entry, index) => (
                                <TagItem key={entry.id} {...getTagItemProps(entry, index)} />
                            ))}
                            {showInlineInput &&
                                renderTagDraftInput({
                                    draft,
                                    accessibleName: getInputAccessibleName(input),
                                    enterKeyHint,
                                    enabled,
                                    invalid: isDraftDuplicate,
                                    visible: isDraftInputVisible,
                                    inputRef,
                                    onChange: setDraftValue,
                                    onFocus: handleInputFocus,
                                    onKeyDown: handleKeyDown,
                                    onPaste: handlePaste,
                                    onBlur: handleBlur,
                                    suggestionListId,
                                    activeSuggestionId,
                                    suggestionsExpanded: suggestionsVisible,
                                })}
                        </ul>
                    </SortableContext>
                </DndContext>
                {suggestionsVisible ? (
                    <ul
                        id={suggestionListId}
                        role='listbox'
                        className='mt-2 max-h-48 overflow-y-auto rounded border border-bdr-subtle bg-surface-primary shadow-md'
                    >
                        {suggestions.map((suggestion, index) => (
                            <li
                                key={suggestion}
                                id={`${suggestionListId}-${index}`}
                                role='option'
                                aria-selected={activeSuggestionIndex === index}
                            >
                                <button
                                    type='button'
                                    className={cn(
                                        'block w-full px-3 py-1.5 text-left text-sm',
                                        activeSuggestionIndex === index
                                            ? 'bg-surface-selected text-alt'
                                            : 'hover:bg-surface-neutral',
                                    )}
                                    onPointerDown={event => event.preventDefault()}
                                    onMouseDown={event => event.preventDefault()}
                                    onMouseEnter={() => setActiveSuggestionIndex(index)}
                                    onClick={() => commitSuggestion(suggestion)}
                                >
                                    {suggestion}
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : null}
            </div>
            <FieldError message={fieldMessage} />
        </div>
    );
};

TagInput.displayName = TAG_INPUT_NAME;
