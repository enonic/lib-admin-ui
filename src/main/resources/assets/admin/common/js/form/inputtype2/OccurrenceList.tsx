import {closestCenter, DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors} from '@dnd-kit/core';
import {SortableContext, useSortable, verticalListSortingStrategy} from '@dnd-kit/sortable';
import {Button, cn, IconButton} from '@enonic/ui';
import {GripVertical, Plus, X} from 'lucide-react';
import type {ReactElement} from 'react';

import type {Value} from '../../data/Value';
import type {Input} from '../Input';
import type {InputTypeConfig} from './descriptor/InputTypeConfig';
import type {OccurrenceManagerState} from './descriptor/OccurrenceManager';
import type {InputTypeComponent} from './types';

//
// * Types
//

export type OccurrenceListProps<C extends InputTypeConfig = InputTypeConfig> = {
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

//
// * Helpers
//

function toTransformCSS(transform: {x: number; y: number; scaleX: number; scaleY: number} | null): string | undefined {
    if (transform == null) return undefined;
    return `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0)`;
}

//
// * SortableItem
//

type ItemRowProps<C extends InputTypeConfig = InputTypeConfig> = {
    Component: InputTypeComponent<C>;
    id: string;
    value: Value;
    index: number;
    config: C;
    input: Input;
    enabled: boolean;
    errors: OccurrenceManagerState['occurrenceValidation'][number];
    showDrag: boolean;
    showRemove: boolean;
    onChange: (index: number, value: Value) => void;
    onBlur?: (index: number) => void;
    onRemove: (index: number) => void;
};

const SortableItem = <C extends InputTypeConfig = InputTypeConfig>({
    Component,
    id,
    value,
    index,
    config,
    input,
    enabled,
    errors,
    showDrag,
    showRemove,
    onChange,
    onBlur,
    onRemove,
}: ItemRowProps<C>): ReactElement => {
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
                isDragging && 'opacity-50',
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
                    aria-label='Drag to reorder'
                    {...listeners}
                >
                    <GripVertical className='size-5' />
                </button>
            )}
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
                    aria-label='Remove occurrence'
                    onClick={() => onRemove(index)}
                />
            )}
        </div>
    );
};

//
// * StaticItem
//

const StaticItem = <C extends InputTypeConfig = InputTypeConfig>({
    Component,
    value,
    index,
    config,
    input,
    enabled,
    errors,
    showDrag: _showDrag,
    showRemove,
    onChange,
    onBlur,
    onRemove,
}: ItemRowProps<C>): ReactElement => {
    return (
        <div className={cn('flex items-center gap-2', showRemove && 'pr-2')}>
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
                    aria-label='Remove occurrence'
                    onClick={() => onRemove(index)}
                />
            )}
        </div>
    );
};

//
// * OccurrenceList
//

const OCCURRENCE_LIST_NAME = 'OccurrenceList';

export const OccurrenceList = <C extends InputTypeConfig = InputTypeConfig>({
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
}: OccurrenceListProps<C>): ReactElement => {
    const occurrences = input.getOccurrences();
    const min = occurrences.getMinimum();
    const max = occurrences.getMaximum();
    const isSingle = min === 1 && max === 1;
    const isFixed = min > 0 && min === max && !isSingle;
    const isDraggable = occurrences.multiple() && !isFixed;
    const showDrag = isDraggable && state.values.length >= 2;

    const sensors = useSensors(useSensor(PointerSensor, {activationConstraint: {distance: 5}}));

    // Single mode: render component bare
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

    const itemProps = (index: number): ItemRowProps<C> => ({
        Component,
        id: state.ids[index],
        value: state.values[index],
        index,
        config,
        input,
        enabled,
        errors: state.occurrenceValidation[index],
        showDrag,
        showRemove: state.canRemove && !isFixed,
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
            label='Add'
            className='w-fit self-end'
            onClick={onAdd}
            disabled={!enabled}
        />
    );

    if (isDraggable) {
        return (
            <div data-component={OCCURRENCE_LIST_NAME} className='flex flex-col gap-y-5'>
                <div className='flex flex-col gap-y-2.5'>
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={state.ids} strategy={verticalListSortingStrategy}>
                            {state.values.map((_, i) => (
                                <SortableItem key={state.ids[i]} {...itemProps(i)} />
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
                    <StaticItem key={state.ids[i]} {...itemProps(i)} />
                ))}
            </div>
            {addButton}
        </div>
    );
};

OccurrenceList.displayName = OCCURRENCE_LIST_NAME;
OccurrenceList.Item = StaticItem;
