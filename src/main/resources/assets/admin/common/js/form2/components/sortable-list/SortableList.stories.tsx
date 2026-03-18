import {cn} from '@enonic/ui';
import type {Meta, StoryObj} from '@storybook/preact-vite';
import {useCallback, useState} from 'react';
import type {SortableListProps} from './index';
import {SortableList} from './index';

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
