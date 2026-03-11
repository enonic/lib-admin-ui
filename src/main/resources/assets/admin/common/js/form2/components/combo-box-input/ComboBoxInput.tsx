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
import {Combobox, cn, IconButton, Listbox} from '@enonic/ui';
import {GripVertical, X} from 'lucide-react';
import type {ReactElement} from 'react';
import {useCallback, useMemo, useState} from 'react';

import {ValueTypes} from '../../../data/ValueTypes';
import type {ComboBoxConfig} from '../../descriptor/InputTypeConfig';
import {useI18n} from '../../I18nContext';
import type {SelfManagedComponentProps} from '../../types';

//
// * Types
//

type SelectedItemProps = {
    id: string;
    label: string;
    index: number;
    enabled: boolean;
    showDrag: boolean;
    showRemove: boolean;
    onRemove: (index: number) => void;
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
// * SelectedItem
//

const SelectedItem = ({id, label, index, enabled, showDrag, showRemove, onRemove}: SelectedItemProps): ReactElement => {
    const t = useI18n();
    const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({
        id,
        disabled: !showDrag,
    });

    const handleKeyDown: preact.JSX.KeyboardEventHandler<HTMLDivElement> = e => {
        if (e.target !== e.currentTarget) return;
        (listeners?.onKeyDown as preact.JSX.KeyboardEventHandler<HTMLDivElement>)?.(e);
    };

    const style = {
        transform: toTransformCSS(transform),
        transition: transition ?? undefined,
        zIndex: isDragging ? 1 : undefined,
    };

    // ? Spread dnd-kit attributes individually to fix Preact type mismatch (string vs AriaRole)
    return (
        <div
            ref={setNodeRef}
            onKeyDown={handleKeyDown}
            role={attributes.role as preact.JSX.AriaRole}
            tabIndex={showDrag ? attributes.tabIndex : undefined}
            aria-disabled={attributes['aria-disabled']}
            aria-pressed={attributes['aria-pressed']}
            aria-roledescription={attributes['aria-roledescription']}
            aria-describedby={attributes['aria-describedby']}
            style={style}
            className={cn(
                'flex h-12 items-center gap-2.5 rounded px-2.5 py-1 outline-none',
                'focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:ring-inset',
                isDragging && 'bg-surface-neutral shadow-[0_2px_8px_2px] shadow-main/10 ring-1 ring-main/5',
            )}
        >
            {showDrag && (
                <button
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
            <div className='min-w-0 flex-1'>
                <span className='block truncate text-sm'>{label}</span>
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
        </div>
    );
};

//
// * ComboBoxInput
//

const COMBO_BOX_INPUT_NAME = 'ComboBoxInput';

export const ComboBoxInput = ({
    values,
    onAdd,
    onRemove,
    onMove,
    occurrences,
    config,
    enabled,
}: SelfManagedComponentProps<ComboBoxConfig>): ReactElement => {
    const [searchValue, setSearchValue] = useState<string | undefined>();

    const selectedStrings = useMemo(() => values.filter(v => !v.isNull()).map(v => v.getString()), [values]);

    const selectedSet = useMemo(() => new Set(selectedStrings), [selectedStrings]);

    const optionMap = useMemo(() => new Map(config.options.map(o => [o.value, o])), [config.options]);

    const filteredOptions = useMemo(() => {
        if (!searchValue) return config.options;
        const query = searchValue.toLowerCase();
        return config.options.filter(
            o => o.label.toLowerCase().includes(query) || o.value.toLowerCase().includes(query),
        );
    }, [config.options, searchValue]);

    const isMultiSelect = occurrences.getMaximum() === 0 || occurrences.getMaximum() > 1;
    const canAdd = occurrences.getMaximum() === 0 || values.length < occurrences.getMaximum();
    const canRemove = values.length > occurrences.getMinimum();

    const handleSelectionChange = useCallback(
        (newSelection: readonly string[]) => {
            const newSet = new Set(newSelection);

            // ? Reverse order keeps indices stable during batch removal
            for (let i = values.length - 1; i >= 0; i--) {
                const str = values[i].isNull() ? undefined : values[i].getString();
                if (str != null && !newSet.has(str)) {
                    onRemove(i);
                }
            }

            for (const val of newSelection) {
                if (!selectedSet.has(val)) {
                    onAdd(ValueTypes.STRING.newValue(val));
                }
            }

            setSearchValue(undefined);
        },
        [selectedSet, values, onAdd, onRemove],
    );

    // ? Use value strings as dnd-kit IDs; ComboBox values are unique per option
    const itemIds = useMemo(() => values.map((v, i) => (v.isNull() ? `null-${i}` : v.getString())), [values]);

    const showDrag = values.length >= 2;

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const {active, over} = event;
            if (over == null || active.id === over.id) return;

            const oldIndex = itemIds.indexOf(String(active.id));
            const newIndex = itemIds.indexOf(String(over.id));
            if (oldIndex === -1 || newIndex === -1) return;
            onMove(oldIndex, newIndex);
        },
        [itemIds, onMove],
    );

    const sensors = useSensors(
        useSensor(PointerSensor, {activationConstraint: {distance: 5}}),
        useSensor(KeyboardSensor, {coordinateGetter: sortableKeyboardCoordinates}),
    );

    return (
        <div data-component={COMBO_BOX_INPUT_NAME} className='flex flex-col gap-y-5'>
            {canAdd && (
                <Combobox.Root
                    value={searchValue}
                    onChange={setSearchValue}
                    selection={selectedStrings}
                    onSelectionChange={handleSelectionChange}
                    selectionMode={isMultiSelect ? 'staged' : 'multiple'}
                    disabled={!enabled}
                >
                    <Combobox.Content className='relative'>
                        <Combobox.Control>
                            <Combobox.Search>
                                <Combobox.SearchIcon />
                                <Combobox.Input placeholder='Type to search...' />
                                {isMultiSelect && <Combobox.Apply />}
                                <Combobox.Toggle />
                            </Combobox.Search>
                        </Combobox.Control>
                        <Combobox.Popup>
                            <Listbox.Content className='rounded-sm'>
                                {filteredOptions.map(option => (
                                    <Listbox.Item key={option.value} value={option.value}>
                                        {option.label}
                                    </Listbox.Item>
                                ))}
                            </Listbox.Content>
                        </Combobox.Popup>
                    </Combobox.Content>
                </Combobox.Root>
            )}

            {values.length > 0 && (
                <div className='flex flex-col gap-y-2.5'>
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        modifiers={[restrictToVerticalAxis]}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
                            {values.map((value, i) => {
                                const str = value.isNull() ? '' : value.getString();
                                return (
                                    <SelectedItem
                                        key={itemIds[i]}
                                        id={itemIds[i]}
                                        label={optionMap.get(str)?.label ?? str}
                                        index={i}
                                        enabled={enabled}
                                        showDrag={showDrag}
                                        showRemove={canRemove}
                                        onRemove={onRemove}
                                    />
                                );
                            })}
                        </SortableContext>
                    </DndContext>
                </div>
            )}
        </div>
    );
};

ComboBoxInput.displayName = COMBO_BOX_INPUT_NAME;
