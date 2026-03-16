import {
    closestCenter,
    DndContext,
    type DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable} from '@dnd-kit/sortable';
import {cn, IconButton, Input, Tooltip} from '@enonic/ui';
import {X} from 'lucide-react';
import {type JSX, type ReactElement, type RefObject, useRef, useState} from 'react';

import type {Value} from '../../../data/Value';
import {ValueTypes} from '../../../data/ValueTypes';
import type {Occurrences} from '../../../form/Occurrences';
import type {OccurrenceValidationState} from '../../descriptor';
import {useI18n} from '../../I18nContext';
import type {SelfManagedComponentProps} from '../../types';
import {getFirstError} from '../../utils';

const TAG_INPUT_NAME = 'TagInput';
const TAG_WRAPPER_CLASS_NAME = 'rounded border border-bdr-subtle min-h-14 px-4 py-3';
const TAG_HELPER_TEXT_CLASS_NAME = 'min-h-5 text-error text-sm';
const TAG_LIST_CLASS_NAME = 'flex flex-wrap items-center gap-2';
const TAG_DRAFT_INPUT_ITEM_CLASS_NAME = 'w-40';
const TAG_DRAFT_INPUT_CLASS_NAME =
    '[&>div[data-state]]:h-7.5 [&>div[data-state]]:!border-transparent ' +
    '[&>div[data-state]]:hover:!outline-none [&>div[data-state]:focus-within]:!border-bdr-subtle ' +
    '[&>div[data-state]:focus-within]:!ring-0 [&>div[data-state]:focus-within]:!ring-offset-0';
const TAG_ITEM_BASE_CLASS_NAME = 'inline-flex max-w-full items-center gap-2 rounded-sm border px-2.5 py-0.75';
const TAG_ITEM_DRAGGABLE_CLASS_NAME = 'cursor-grab outline-none focus-visible:ring-1 focus-visible:ring-ring';
const TAG_ITEM_DRAGGING_CLASS_NAME = 'cursor-grabbing shadow-md shadow-main/70';
const TAG_LABEL_MAX_LENGTH = 20;
const TAG_DRAG_ACTIVATION_DISTANCE = 5;

//
// * Types
//

type TranslateFn = (key: string, ...args: unknown[]) => string;
type SortableTransform = {x: number; y: number; scaleX: number; scaleY: number};

type TagItemProps = {
    id: string;
    label: string;
    error?: string;
    enabled: boolean;
    showDrag: boolean;
    showRemove: boolean;
    registerItemRef: (node: HTMLLIElement | null) => void;
    onNavigate: (direction: -1 | 1) => void;
    onDeleteKey: () => void;
    onRemovePointerDown: () => void;
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
    inputRef: RefObject<HTMLInputElement | null>;
    onChange: (value: string) => void;
    onKeyDown: (event: JSX.TargetedKeyboardEvent<HTMLInputElement>) => void;
    onBlur: () => void;
};

type RemoveTagOptions = {
    activateInput?: boolean;
    commitCurrentDraft?: boolean;
};

//
// * Helpers
//

export function normalizeTagDraft(raw: string): string {
    return raw.trim().replace(/,+$/, '').trim();
}

export function shouldRemoveLatestTag(key: string, draft: string, canRemove: boolean, hasModifier = false): boolean {
    return !hasModifier && canRemove && draft.length === 0 && (key === 'Backspace' || key === 'Delete');
}

export function getTagLabel(value: Value): string {
    return value.isNull() ? '' : (value.getString() ?? '');
}

export function hasTagLabel(values: Value[], label: string, excludedIndex?: number): boolean {
    return values.some((value, index) => index !== excludedIndex && normalizeTagDraft(getTagLabel(value)) === label);
}

export function isTagLabelCropped(label: string): boolean {
    return label.length > TAG_LABEL_MAX_LENGTH;
}

export function getVisibleTagLabel(label: string): string {
    return isTagLabelCropped(label) ? `${label.slice(0, TAG_LABEL_MAX_LENGTH)}...` : label;
}

export function getOccurrenceErrorMessage(
    occurrences: Occurrences,
    validation: OccurrenceValidationState[],
    t: TranslateFn,
): string | undefined {
    const hasFieldErrors = validation.some(entry => entry.validationResults.length > 0);
    if (hasFieldErrors) {
        return undefined;
    }

    const totalValid = validation.filter(entry => !entry.breaksRequired && entry.validationResults.length === 0).length;
    const min = occurrences.getMinimum();
    const max = occurrences.getMaximum();

    if (occurrences.minimumBreached(totalValid)) {
        return min >= 1 && max !== 1 ? t('field.occurrence.breaks.min', min) : t('field.value.required');
    }

    if (occurrences.maximumBreached(totalValid)) {
        return max > 1 ? t('field.occurrence.breaks.max.many', max) : t('field.occurrence.breaks.max.one');
    }

    return undefined;
}

function toTransformCSS(transform: SortableTransform | null): string | undefined {
    if (transform == null) return undefined;
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

//
// * TagDraftInput
//

function renderTagDraftInput({
    draft,
    enabled,
    inputRef,
    onChange,
    onKeyDown,
    onBlur,
}: TagDraftInputProps): ReactElement {
    return (
        <li className={TAG_DRAFT_INPUT_ITEM_CLASS_NAME}>
            <Input
                ref={inputRef}
                className={TAG_DRAFT_INPUT_CLASS_NAME}
                value={draft}
                onChange={(event: JSX.TargetedEvent<HTMLInputElement>) => onChange(event.currentTarget.value)}
                onKeyDown={onKeyDown}
                onBlur={onBlur}
                disabled={!enabled}
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
    showDrag,
    showRemove,
    registerItemRef,
    onNavigate,
    onDeleteKey,
    onRemovePointerDown,
    onRemove,
}: TagItemProps): ReactElement => {
    const t = useI18n();
    const visibleLabel = getVisibleTagLabel(label);
    const tooltipValue = isTagLabelCropped(label) ? label : undefined;
    const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({
        id,
        disabled: !showDrag,
    });
    const isKeyboardDragging = Boolean(attributes['aria-pressed']);
    const setRefs = (node: HTMLLIElement | null) => {
        setNodeRef(node);
        registerItemRef(node);
    };

    const dragInteractionProps = {
        onPointerDown: listeners?.onPointerDown as preact.JSX.PointerEventHandler<HTMLLIElement> | undefined,
        onPointerUp: listeners?.onPointerUp as preact.JSX.PointerEventHandler<HTMLLIElement> | undefined,
        onPointerCancel: listeners?.onPointerCancel as preact.JSX.PointerEventHandler<HTMLLIElement> | undefined,
        onPointerMove: listeners?.onPointerMove as preact.JSX.PointerEventHandler<HTMLLIElement> | undefined,
        onPointerLeave: listeners?.onPointerLeave as preact.JSX.PointerEventHandler<HTMLLIElement> | undefined,
        onTouchStart: listeners?.onTouchStart as preact.JSX.TouchEventHandler<HTMLLIElement> | undefined,
        onTouchEnd: listeners?.onTouchEnd as preact.JSX.TouchEventHandler<HTMLLIElement> | undefined,
        onTouchMove: listeners?.onTouchMove as preact.JSX.TouchEventHandler<HTMLLIElement> | undefined,
        onTouchCancel: listeners?.onTouchCancel as preact.JSX.TouchEventHandler<HTMLLIElement> | undefined,
        onMouseDown: listeners?.onMouseDown as preact.JSX.MouseEventHandler<HTMLLIElement> | undefined,
    };

    const dragAccessibilityProps = showDrag
        ? {
              role: attributes.role as preact.JSX.AriaRole,
              tabIndex: enabled ? (attributes.tabIndex ?? 0) : -1,
              'aria-disabled': attributes['aria-disabled'],
              'aria-pressed': attributes['aria-pressed'],
              'aria-roledescription': attributes['aria-roledescription'],
              'aria-describedby': attributes['aria-describedby'],
          }
        : {
              tabIndex: enabled ? 0 : -1,
          };

    const handleItemKeyDown: preact.JSX.KeyboardEventHandler<HTMLLIElement> = event => {
        if (event.altKey || event.ctrlKey || event.metaKey) return;

        if (isKeyboardDragging) {
            (listeners?.onKeyDown as preact.JSX.KeyboardEventHandler<HTMLLIElement>)?.(event);
            return;
        }

        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
            event.preventDefault();
            onNavigate(-1);
            return;
        }

        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
            event.preventDefault();
            onNavigate(1);
            return;
        }

        if (event.key === 'Backspace' || event.key === 'Delete') {
            event.preventDefault();
            onDeleteKey();
            return;
        }

        if (event.key === ' ' || event.key === 'Enter') {
            (listeners?.onKeyDown as preact.JSX.KeyboardEventHandler<HTMLLIElement>)?.(event);
        }
    };
    return (
        <li
            ref={setRefs}
            onKeyDown={handleItemKeyDown}
            {...dragInteractionProps}
            {...dragAccessibilityProps}
            style={{
                transform: toTransformCSS(transform),
                transition: transition ?? undefined,
                zIndex: isDragging ? 1 : undefined,
            }}
            title={error}
            className={cn(
                TAG_ITEM_BASE_CLASS_NAME,
                'bg-surface-neutral text-sm',
                enabled && showDrag && TAG_ITEM_DRAGGABLE_CLASS_NAME,
                error ? 'border-current text-error' : 'border-bdr-strong text-foreground',
                isDragging && TAG_ITEM_DRAGGING_CLASS_NAME,
            )}
        >
            <Tooltip value={tooltipValue} side='top' className='max-w-64 whitespace-normal break-words'>
                <span className={cn('font-semibold', !showDrag && 'cursor-default')}>{visibleLabel}</span>
            </Tooltip>
            {showRemove && (
                <IconButton
                    icon={X}
                    iconSize='sm'
                    variant='text'
                    className='size-5'
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
    const inputRef = useRef<HTMLInputElement>(null);
    const tagRefs = useRef<Array<HTMLLIElement | null>>([]);
    const skipBlurCommit = useRef(false);
    const idsByValue = useRef(new WeakMap<Value, string>());
    const nextId = useRef(0);
    const {canAdd, canRemove, showDrag} = getTagViewState(occurrences, enabled, values.length);
    const showInlineInput = canAdd && (isInputActive || draft.length > 0);
    const sensors = useSensors(
        useSensor(PointerSensor, {activationConstraint: {distance: TAG_DRAG_ACTIVATION_DISTANCE}}),
        useSensor(KeyboardSensor, {coordinateGetter: sortableKeyboardCoordinates}),
    );

    const ids = values.map(value => getOrCreateTagId(idsByValue.current, nextId, value));

    const occurrenceError = getOccurrenceErrorMessage(occurrences, errors, t);
    const firstFieldError = errors.map(entry => getFirstError(entry.validationResults)).find(Boolean);
    const helperText = occurrenceError ?? firstFieldError;
    const focusInput = () => {
        setIsInputActive(true);
        focusElementNextFrame(inputRef.current);
    };

    const handleFieldActivate = () => {
        if (!canAdd || !enabled) return;
        focusInput();
    };

    const focusTagAt = (index: number) => {
        requestAnimationFrame(() => {
            if (index < 0) return;
            if (index >= values.length) {
                inputRef.current?.focus();
                return;
            }
            tagRefs.current[index]?.focus();
        });
    };

    const commitDraft = (focusTarget?: HTMLInputElement, excludedIndex?: number) => {
        const normalized = normalizeTagDraft(draft);
        if (normalized.length === 0) {
            setDraft('');
            return;
        }

        if (hasTagLabel(values, normalized, excludedIndex)) {
            setDraft('');
            return;
        }

        if (!canAdd) {
            return;
        }

        onAdd(ValueTypes.STRING.newValue(normalized));
        setDraft('');

        const hasRoomForAnother = occurrences.getMaximum() === 0 || values.length + 1 < occurrences.getMaximum();

        if (focusTarget != null && hasRoomForAnother) {
            focusElementNextFrame(focusTarget);
        }
    };

    const prepareRemove = () => {
        skipBlurCommit.current = true;
    };

    const handleRemove = (index: number, options: RemoveTagOptions = {}) => {
        const {activateInput = false, commitCurrentDraft = false} = options;
        if (commitCurrentDraft) {
            commitDraft(undefined, index);
        }
        onRemove(index);
        if (activateInput) {
            focusInput();
            return;
        }

        setIsInputActive(false);
    };

    const handleTagNavigate = (index: number, direction: -1 | 1) => {
        focusTagAt(index + direction);
    };

    const handleFieldPointerDown: preact.JSX.PointerEventHandler<HTMLElement> = event => {
        if (event.target === event.currentTarget) {
            handleFieldActivate();
        }
    };

    const getTagItemProps = (value: Value, index: number): TagItemProps => ({
        id: ids[index],
        label: getTagLabel(value),
        error: getFirstError(errors[index]?.validationResults ?? []),
        enabled,
        showDrag,
        showRemove: canRemove,
        registerItemRef: node => {
            tagRefs.current[index] = node;
        },
        onNavigate: direction => handleTagNavigate(index, direction),
        onDeleteKey: () => handleRemove(index, {activateInput: true}),
        onRemovePointerDown: prepareRemove,
        onRemove: () => handleRemove(index, {commitCurrentDraft: true}),
    });

    const handleKeyDown = (event: JSX.TargetedKeyboardEvent<HTMLInputElement>) => {
        if (shouldRemoveLatestTag(event.key, draft, canRemove, event.altKey || event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            handleRemove(values.length - 1, {activateInput: true});
            return;
        }

        if (event.key !== 'Enter' && event.key !== ',') {
            return;
        }

        event.preventDefault();
        commitDraft(event.currentTarget);
    };

    const handleBlur = () => {
        if (skipBlurCommit.current) {
            skipBlurCommit.current = false;
            return;
        }

        commitDraft();
        setIsInputActive(false);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const {active, over} = event;
        if (over == null || active.id === over.id) return;

        const fromIndex = ids.indexOf(String(active.id));
        const toIndex = ids.indexOf(String(over.id));
        if (fromIndex === -1 || toIndex === -1) return;
        onMove(fromIndex, toIndex);
    };

    return (
        <div data-component={TAG_INPUT_NAME} className='flex flex-col gap-y-2.5'>
            <div
                className={cn(TAG_WRAPPER_CLASS_NAME, helperText && 'border-current')}
                onPointerDown={handleFieldPointerDown}
                onFocus={event => {
                    if (event.target === event.currentTarget) {
                        handleFieldActivate();
                    }
                }}
                tabIndex={enabled && canAdd && !showInlineInput ? 0 : -1}
            >
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={ids} strategy={rectSortingStrategy}>
                        <ul className={TAG_LIST_CLASS_NAME} onPointerDown={handleFieldPointerDown}>
                            {values.map((value, index) => (
                                <TagItem key={ids[index]} {...getTagItemProps(value, index)} />
                            ))}
                            {showInlineInput &&
                                renderTagDraftInput({
                                    draft,
                                    enabled,
                                    inputRef,
                                    onChange: setDraft,
                                    onKeyDown: handleKeyDown,
                                    onBlur: handleBlur,
                                })}
                        </ul>
                    </SortableContext>
                </DndContext>
            </div>
            <div className={TAG_HELPER_TEXT_CLASS_NAME}>{helperText}</div>
        </div>
    );
};

TagInput.displayName = TAG_INPUT_NAME;
