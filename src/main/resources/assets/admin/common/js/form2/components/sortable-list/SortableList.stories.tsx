import {cn} from '@enonic/ui';
import type {Meta, StoryObj} from '@storybook/preact-vite';
import {useCallback, useState} from 'react';
import type {SortableListProps} from './SortableList';
import {SortableList} from './SortableList';

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
    itemClassName?: SortableListProps<Fruit>['itemClassName'];
};

function Demo({initialItems = FRUITS, enabled = true, fullRowDraggable, itemClassName}: DemoProps) {
    const [items, setItems] = useState(initialItems);
    const keyExtractor = useCallback((item: Fruit) => item.id, []);

    return (
        <div className='w-72'>
            <SortableList
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
};

function ButtonDemo({fullRowDraggable}: ButtonDemoProps) {
    const [items, setItems] = useState(FRUITS);
    const [log, setLog] = useState<string[]>([]);
    const keyExtractor = useCallback((item: Fruit) => item.id, []);

    const addLog = useCallback((message: string) => {
        setLog(prev => [...prev.slice(-4), message]);
    }, []);

    return (
        <div className='flex flex-col gap-y-4'>
            <div className='w-80'>
                <SortableList
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

//
// * Meta
//

const meta: Meta<typeof SortableList> = {
    title: 'Components/SortableList',
    component: SortableList,
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
