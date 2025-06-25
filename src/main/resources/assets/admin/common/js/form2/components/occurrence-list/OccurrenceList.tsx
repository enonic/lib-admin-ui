import {closestCenter, DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors} from '@dnd-kit/core';
import {SortableContext, useSortable, verticalListSortingStrategy} from '@dnd-kit/sortable';
import {Button, cn, IconButton} from '@enonic/ui';
import {GripVertical, Plus, X} from 'lucide-react';
import type {ReactElement, ReactNode} from 'react';

import type {Value} from '../../../data/Value';
import type {Input} from '../../../form/Input';
import type {InputTypeConfig} from '../../descriptor/InputTypeConfig';
import type {OccurrenceManagerState} from '../../descriptor/OccurrenceManager';
import {useI18n} from '../../I18nContext';
import type {InputTypeComponent} from '../../types';

//
// * Types
//

export type OccurrenceListRootProps<C extends InputTypeConfig = InputTypeConfig> = {
    Component: InputTypeComponent<C>;
    state: OccurrenceManagerState;
    onAdd: () => void;
    onRemove: (index: number) => void;
    onMove: (fromIndex: number, toIndex: number) => void;
    onChange: (index: number, value: Value) => void;
    onBlur?: (index: number) => void;
    config: C;
    input: Input;
    enabled: boolean;
};

type OccurrenceListItemContentProps<C extends InputTypeConfig = InputTypeConfig> = {
    Component: InputTypeComponent<C>;
    value: Value;
    index: number;
    config: C;
    input: Input;
    enabled: boolean;
    errors: OccurrenceManagerState['occurrenceValidation'][number];
    showRemove: boolean;
    onChange: (index: number, value: Value) => void;
    onBlur?: (index: number) => void;
    onRemove: (index: number) => void;
};

type OccurrenceListItemProps<C extends InputTypeConfig = InputTypeConfig> = OccurrenceListItemContentProps<C> & {
    className?: string;
};

type OccurrenceListSortableItemProps<C extends InputTypeConfig = InputTypeConfig> =
    OccurrenceListItemContentProps<C> & {
        id: string;
        showDrag: boolean;
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
// * OccurrenceListItemContent
//

const OccurrenceListItemContent = <C extends InputTypeConfig = InputTypeConfig>({
    Component,
    value,
    index,
    config,
    input,
    enabled,
    errors,
    showRemove,
    onChange,
    onBlur,
    onRemove,
}: OccurrenceListItemContentProps<C>): ReactNode => {
    const t = useI18n();

    return (
        <>
            <div className='min-w-0 flex-1'>
                <Component
                    value={value}
                    onChange={(v: Value) => onChange(index, v)}
                    onBlur={onBlur ? () => onBlur(index) : undefined}
                    config={config}
                    input={input}
                    enabled={enabled}
                    index={index}
                    errors={errors.validationResults}
                />
            </div>
            {showRemove && (
                <IconButton
                    icon={X}
                    iconSize='lg'
                    variant='text'
                    className='size-8'
                    disabled={!enabled}
                    aria-label={t('field.occurrence.action.remove')}
                    onClick={() => onRemove(index)}
                />
            )}
        </>
    );
};

//
// * OccurrenceListSortableItem
//

const OccurrenceListSortableItem = <C extends InputTypeConfig = InputTypeConfig>({
    id,
    enabled,
    showDrag,
    showRemove,
    className,
    ...contentProps
}: OccurrenceListSortableItemProps<C>): ReactElement => {
    const t = useI18n();
    const {attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging} = useSortable({
        id,
    });

    const style = {
        transform: toTransformCSS(transform),
        transition: transition ?? undefined,
        zIndex: isDragging ? 1 : undefined,
    };

    // ? Spread dnd-kit attributes individually to fix Preact type mismatch (string vs AriaRole)
    return (
        <div
            ref={setNodeRef}
            role={attributes.role as preact.JSX.AriaRole}
            tabIndex={attributes.tabIndex}
            aria-disabled={attributes['aria-disabled']}
            aria-pressed={attributes['aria-pressed']}
            aria-roledescription={attributes['aria-roledescription']}
            aria-describedby={attributes['aria-describedby']}
            style={style}
            className={cn(
                'flex items-center gap-2 rounded outline-none',
                'focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:ring-inset',
                '-my-1 py-1',
                showDrag && 'pl-2',
                showRemove && 'pr-2',
                isDragging && 'bg-surface-neutral shadow-[0_2px_8px_2px] shadow-main/10 ring-1 ring-main/5',
                className,
            )}
        >
            {showDrag && (
                <button
                    ref={setActivatorNodeRef}
                    type='button'
                    className={cn(
                        'flex shrink-0 cursor-grab items-center text-subtle',
                        'hover:text-foreground focus-visible:outline-none',
                        isDragging && 'cursor-grabbing',
                        !enabled && 'pointer-events-none opacity-30',
                    )}
                    tabIndex={-1}
                    disabled={!enabled}
                    aria-label={t('field.occurrence.action.reorder')}
                    {...listeners}
                >
                    <GripVertical className='size-5' />
                </button>
            )}
            <OccurrenceListItemContent enabled={enabled} showRemove={showRemove} {...contentProps} />
        </div>
    );
};

//
// * OccurrenceListItem
//

const OccurrenceListItem = <C extends InputTypeConfig = InputTypeConfig>({
    className,
    ...props
}: OccurrenceListItemProps<C>): ReactElement => (
    <div className={cn('flex items-center gap-2', props.showRemove && 'pr-2', className)}>
        <OccurrenceListItemContent {...props} />
    </div>
);

//
// * OccurrenceListRoot
//

const OCCURRENCE_LIST_NAME = 'OccurrenceList';
const OCCURRENCE_LIST_ROOT_NAME = 'OccurrenceList.Root';

const OccurrenceListRoot = <C extends InputTypeConfig = InputTypeConfig>({
    Component,
    state,
    onAdd,
    onRemove,
    onMove,
    onChange,
    onBlur,
    config,
    input,
    enabled,
}: OccurrenceListRootProps<C>): ReactElement => {
    const t = useI18n();
    const occurrences = input.getOccurrences();
    const min = occurrences.getMinimum();
    const max = occurrences.getMaximum();
    // Non-multiple: max=1, regardless of min. Both min=1,max=1 (required) and min=0,max=1 (optional)
    // render a single bare input with no add/remove buttons — matching legacy InputView behavior.
    const isSingle = !occurrences.multiple();
    // Fixed: exact count like 3:3 — no add/remove, no drag. Excludes single (1:1) which early-returns.
    const isFixed = min > 0 && min === max && !isSingle;
    const isDraggable = occurrences.multiple() && !isFixed;
    const showDrag = isDraggable && state.values.length >= 2;

    const sensors = useSensors(useSensor(PointerSensor, {activationConstraint: {distance: 5}}));

    // Single mode: render component bare
    // ? Minimum occurrences are eagerly populated in useOccurrenceManager, so values[0] is always present
    if (isSingle) {
        const value = state.values[0];
        const errors = state.occurrenceValidation[0];
        if (value == null || errors == null) return <div data-component={OCCURRENCE_LIST_NAME} />;

        return (
            <div data-component={OCCURRENCE_LIST_NAME}>
                <Component
                    value={value}
                    onChange={(v: Value) => onChange(0, v)}
                    onBlur={onBlur ? () => onBlur(0) : undefined}
                    config={config}
                    input={input}
                    enabled={enabled}
                    index={0}
                    errors={errors.validationResults}
                />
            </div>
        );
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const {active, over} = event;
        if (over == null || active.id === over.id) return;

        const oldIndex = state.ids.indexOf(String(active.id));
        const newIndex = state.ids.indexOf(String(over.id));
        if (oldIndex === -1 || newIndex === -1) return;
        onMove(oldIndex, newIndex);
    };

    const contentProps = (index: number): OccurrenceListItemContentProps<C> => ({
        Component,
        value: state.values[index],
        index,
        config,
        input,
        enabled,
        errors: state.occurrenceValidation[index],
        // canRemove reflects the schema minimum; the count > 1 guard is a UX policy
        // matching legacy isRemoveButtonRequiredStrict() — never remove the last visible input.
        showRemove: state.canRemove && state.values.length > 1 && !isFixed,
        onChange,
        onBlur,
        onRemove,
    });

    const addButton = state.canAdd && !isFixed && (
        <Button
            variant='outline'
            size='sm'
            iconSize={16}
            iconStrokeWidth={1.75}
            endIcon={Plus}
            label={t('action.add')}
            className='w-fit self-end'
            onClick={onAdd}
            disabled={!enabled}
        />
    );

    if (isDraggable) {
        return (
            <div data-component={OCCURRENCE_LIST_NAME} className='flex flex-col gap-y-5'>
                <div className='flex flex-col gap-y-2.5'>
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        modifiers={[restrictToVerticalAxis]}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext items={state.ids} strategy={verticalListSortingStrategy}>
                            {state.values.map((_, i) => (
                                <OccurrenceListSortableItem
                                    key={state.ids[i]}
                                    id={state.ids[i]}
                                    showDrag={showDrag}
                                    {...contentProps(i)}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                </div>
                {addButton}
            </div>
        );
    }

    return (
        <div data-component={OCCURRENCE_LIST_NAME} className='flex flex-col gap-y-5'>
            <div className='flex flex-col gap-y-2.5'>
                {state.values.map((_, i) => (
                    <OccurrenceListItem key={state.ids[i]} {...contentProps(i)} />
                ))}
            </div>
            {addButton}
        </div>
    );
};

OccurrenceListRoot.displayName = OCCURRENCE_LIST_ROOT_NAME;

export const OccurrenceList = Object.assign(OccurrenceListRoot, {
    Root: OccurrenceListRoot,
});
