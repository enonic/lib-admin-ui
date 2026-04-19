import {cn} from '@enonic/ui';
import type {Meta, StoryObj} from '@storybook/preact-vite';
import {useCallback, useState} from 'react';
import type {SortableGridListProps} from './SortableGridList';
import {SortableGridList} from './SortableGridList';

//
// * Helpers
//

type Fruit = {id: string; label: string; color: string};

const FRUITS: Fruit[] = [
    {id: 'apple', label: 'Apple', color: 'bg-red-100 text-red-800'},
    {id: 'banana', label: 'Banana', color: 'bg-yellow-100 text-yellow-800'},
    {id: 'cherry', label: 'Cherry', color: 'bg-pink-100 text-pink-800'},
    {id: 'date', label: 'Date', color: 'bg-amber-100 text-amber-800'},
];

function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
    const next = [...items];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    return next;
}

type DemoProps = {
    initialItems?: Fruit[];
    enabled?: boolean;
    fullRowDraggable?: boolean;
    itemClassName?: SortableGridListProps<Fruit>['itemClassName'];
};

function Demo({initialItems = FRUITS, enabled = true, fullRowDraggable, itemClassName}: DemoProps) {
    const [items, setItems] = useState(initialItems);
    const keyExtractor = useCallback((item: Fruit) => item.id, []);

    return (
        <div className='w-72'>
            <SortableGridList
                items={items}
                keyExtractor={keyExtractor}
                onMove={(from, to) => setItems(prev => moveItem(prev, from, to))}
                enabled={enabled}
                fullRowDraggable={fullRowDraggable}
                dragLabel='Drag to reorder'
                className='flex flex-col gap-y-2'
                itemClassName={itemClassName ?? 'gap-2'}
                renderItem={({item}) => (
                    <div className={cn('flex-1 rounded-md px-3 py-2 font-medium text-sm', item.color)}>
                        {item.label}
                    </div>
                )}
            />
        </div>
    );
}

type ButtonDemoProps = {
    fullRowDraggable?: boolean;
    showHelp?: boolean;
};

function ButtonDemo({fullRowDraggable, showHelp = false}: ButtonDemoProps) {
    const [items, setItems] = useState(FRUITS);
    const [log, setLog] = useState<string[]>([]);
    const keyExtractor = useCallback((item: Fruit) => item.id, []);

    const addLog = useCallback((message: string) => {
        setLog(prev => [...prev.slice(-4), message]);
    }, []);

    return (
        <div className='flex flex-col gap-y-4'>
            {showHelp && (
                <p className='w-80 rounded-md border border-bdr-subtle bg-surface-neutral px-3 py-2 text-sm leading-5'>
                    Press Tab to enter the list, use ArrowUp and ArrowDown to move between rows, and use ArrowLeft and
                    ArrowRight to move between row actions before picking an item up. Once Space picks the row up,
                    dnd-kit keyboard reordering owns the arrows until Space drops it again.
                </p>
            )}
            <div className='w-80'>
                <SortableGridList
                    items={items}
                    keyExtractor={keyExtractor}
                    onMove={(from, to) => {
                        setItems(prev => moveItem(prev, from, to));
                        addLog(`Moved "${items[from].label}" from ${from} to ${to}`);
                    }}
                    enabled
                    fullRowDraggable={fullRowDraggable}
                    dragLabel='Drag to reorder'
                    className='flex flex-col gap-y-2'
                    itemClassName='gap-2'
                    renderItem={({item}) => (
                        <div
                            className={cn(
                                'flex flex-1 items-center justify-between rounded-md px-3 py-2 text-sm',
                                item.color,
                            )}
                        >
                            <span className='font-medium'>{item.label}</span>
                            <div className='flex gap-1'>
                                <button
                                    type='button'
                                    className='rounded bg-white/60 px-2 py-0.5 text-xs hover:bg-white/90'
                                    onClick={() => addLog(`Edit: ${item.label}`)}
                                >
                                    Edit
                                </button>
                                <button
                                    type='button'
                                    className='rounded bg-white/60 px-2 py-0.5 text-red-600 text-xs hover:bg-white/90'
                                    onClick={() => {
                                        setItems(prev => prev.filter(i => i.id !== item.id));
                                        addLog(`Removed: ${item.label}`);
                                    }}
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    )}
                />
            </div>
            <pre className='min-h-24 rounded-md bg-surface-neutral p-3 font-mono text-subtle text-xs'>
                {log.length > 0 ? log.join('\n') : 'Click buttons or drag items…'}
            </pre>
        </div>
    );
}

function RovingDemo() {
    const [items, setItems] = useState(FRUITS);
    const keyExtractor = useCallback((item: Fruit) => item.id, []);

    return (
        <div className='flex w-80 flex-col gap-y-3'>
            <p className='rounded-md border border-bdr-subtle bg-surface-neutral px-3 py-2 text-sm leading-5'>
                Press Tab to enter the list, use ArrowUp and ArrowDown to move between rows, then press Space to pick up
                the focused item. Once picked up, dnd-kit keyboard reordering takes over until Space drops it again.
            </p>
            <SortableGridList
                items={items}
                keyExtractor={keyExtractor}
                onMove={(from, to) => setItems(prev => moveItem(prev, from, to))}
                enabled
                fullRowDraggable
                dragLabel='Drag to reorder'
                className='flex flex-col gap-y-2'
                itemClassName={({isFocused}) =>
                    cn('gap-2 rounded-xl border border-transparent p-1', isFocused && 'border-ring/50')
                }
                renderItem={({item, isFocused}) => (
                    <div
                        className={cn(
                            'flex flex-1 items-center justify-between rounded-lg px-3 py-2 text-sm',
                            item.color,
                        )}
                    >
                        <span className='font-medium'>{item.label}</span>
                        <span className='font-mono text-[11px] uppercase tracking-[0.14em]'>
                            {isFocused ? 'Focused row' : 'Row'}
                        </span>
                    </div>
                )}
            />
        </div>
    );
}

//
// * Meta
//

const meta: Meta<typeof SortableGridList> = {
    title: 'Components/SortableGridList',
    component: SortableGridList,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof meta>;

//
// * Examples
//

export const Default: Story = {
    name: 'Examples / Default',
    render: () => <Demo />,
};

export const TwoItems: Story = {
    name: 'Examples / Two Items',
    render: () => <Demo initialItems={FRUITS.slice(0, 2)} />,
};

export const FullRowDraggable: Story = {
    name: 'Examples / Full Row Draggable',
    render: () => <Demo fullRowDraggable />,
};

//
// * States
//

export const SingleItem: Story = {
    name: 'States / Single Item (no handles)',
    render: () => <Demo initialItems={FRUITS.slice(0, 1)} />,
};

export const Disabled: Story = {
    name: 'States / Disabled',
    render: () => <Demo enabled={false} />,
};

export const WithItemClassName: Story = {
    name: 'States / Dynamic itemClassName',
    render: () => (
        <Demo
            itemClassName={({isDragging, isFocused}) =>
                cn('gap-2 rounded-lg border border-transparent p-1', isFocused && !isDragging && 'border-ring/50')
            }
        />
    ),
};

//
// * Behavior
//

export const WithButtons: Story = {
    name: 'Behavior / With Buttons',
    render: () => <ButtonDemo />,
};

export const WithButtonsFullRow: Story = {
    name: 'Behavior / With Buttons (Full Row Draggable)',
    render: () => <ButtonDemo fullRowDraggable />,
};

export const RovingFocusFullRow: Story = {
    name: 'Behavior / Roving Focus (Full Row Draggable)',
    render: () => <RovingDemo />,
};

export const RovingFocusWithButtonsFullRow: Story = {
    name: 'Behavior / Roving Focus With Buttons (Full Row Draggable)',
    render: () => <ButtonDemo fullRowDraggable showHelp />,
};
