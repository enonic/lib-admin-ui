import {cn} from '@enonic/ui';
import type {Meta, StoryObj} from '@storybook/preact-vite';
import {useCallback, useMemo, useState} from 'react';
import type {SortableDragInfo, SortableListProps} from './SortableList';
import {SortableList} from './SortableList';
import {type DropProjection, projectTreeDrop} from './treeProjection';

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
// * Tree projection demo (mirrors Content Studio page components)
//

type TreeItemKind = 'part' | 'text' | 'layout';

type TreeItem = {
    id: string;
    label: string;
    kind: TreeItemKind;
    regions?: TreeRegion[];
};

type TreeRegion = {
    id: string;
    name: string;
    items: TreeItem[];
};

type TreeRow = {
    id: string;
    parentId: string | null;
    depth: number;
    kind: 'container' | 'item';
    label: string;
    rowKind: 'page' | 'region' | TreeItemKind;
};

const TREE_INDENT = 16;

const INITIAL_TREE: TreeRegion[] = [
    {
        id: 'main',
        name: 'main',
        items: [
            {id: 'text-1', label: 'Heading', kind: 'text'},
            {
                id: 'layout-1',
                label: '2-column layout',
                kind: 'layout',
                regions: [
                    {
                        id: 'left',
                        name: 'left',
                        items: [
                            {id: 'part-a', label: 'Article', kind: 'part'},
                            {id: 'part-b', label: 'Image', kind: 'part'},
                        ],
                    },
                    {id: 'right', name: 'right', items: []},
                ],
            },
            {id: 'text-2', label: 'Footer', kind: 'text'},
        ],
    },
];

function flattenTree(regions: TreeRegion[]): TreeRow[] {
    const rows: TreeRow[] = [{id: 'page', parentId: null, depth: 1, kind: 'item', label: 'Page', rowKind: 'page'}];

    function walkItem(item: TreeItem, parentId: string, depth: number): void {
        rows.push({id: item.id, parentId, depth, kind: 'item', label: item.label, rowKind: item.kind});
        item.regions?.forEach(region => {
            walkRegion(region, item.id, depth + 1);
        });
    }

    function walkRegion(region: TreeRegion, parentId: string, depth: number): void {
        rows.push({id: region.id, parentId, depth, kind: 'container', label: region.name, rowKind: 'region'});
        region.items.forEach(item => {
            walkItem(item, region.id, depth + 1);
        });
    }

    for (const region of regions) {
        walkRegion(region, 'page', 2);
    }
    return rows;
}

function moveTreeItem(regions: TreeRegion[], itemId: string, targetRegionId: string, index: number): TreeRegion[] {
    let moved: TreeItem | null = null;

    const remove = (list: TreeRegion[]): TreeRegion[] =>
        list.map(region => {
            const kept: TreeItem[] = [];
            for (const item of region.items) {
                if (item.id === itemId) {
                    moved = item;
                } else {
                    kept.push({...item, regions: item.regions ? remove(item.regions) : undefined});
                }
            }
            return {...region, items: kept};
        });

    const withoutSource = remove(regions);
    if (moved == null) return regions;

    const insert = (list: TreeRegion[]): TreeRegion[] =>
        list.map(region => {
            const items: TreeItem[] = region.items.map(item => ({
                ...item,
                regions: item.regions ? insert(item.regions) : undefined,
            }));
            if (region.id === targetRegionId) {
                items.splice(Math.min(index, items.length), 0, moved as TreeItem);
            }
            return {...region, items};
        });

    return insert(withoutSource);
}

function hasLayoutAncestor(rowById: Map<string, TreeRow>, containerId: string): boolean {
    let parentId = rowById.get(containerId)?.parentId ?? null;
    while (parentId != null) {
        const parent = rowById.get(parentId);
        if (parent == null) break;
        if (parent.rowKind === 'layout') return true;
        parentId = parent.parentId;
    }
    return false;
}

function TreeDemo() {
    const [regions, setRegions] = useState(INITIAL_TREE);
    const rows = useMemo(() => flattenTree(regions), [regions]);
    const rowById = useMemo(() => new Map(rows.map(row => [row.id, row])), [rows]);

    const keyExtractor = useCallback((row: TreeRow) => row.id, []);
    const isItemMovable = useCallback((row: TreeRow) => row.kind === 'item' && row.rowKind !== 'page', []);

    const project = useCallback(
        (info: SortableDragInfo): DropProjection | null => {
            const active = rows[info.activeIndex];
            const over = rows[info.overIndex];
            if (active == null || over == null) return null;
            return projectTreeDrop({
                nodes: rows,
                activeId: active.id,
                overId: over.id,
                side: info.side,
                direction: info.direction,
                isContainerAllowed: containerId =>
                    active.rowKind !== 'layout' || !hasLayoutAncestor(rowById, containerId),
            });
        },
        [rows, rowById],
    );

    return (
        <div className='w-96'>
            <p className='mb-3 text-subtle text-xs'>
                Drag a row up or down — it walks through the valid drop slots. Dragging up enters the region above
                (incl. the empty one); dragging down steps out past the layout when a region ends. The dragged row
                re-indents to show its level. It dims when the drop is not allowed (no layout in a layout).
            </p>
            <SortableList
                items={rows}
                keyExtractor={keyExtractor}
                isItemMovable={isItemMovable}
                enabled={rows.length > 1}
                fullRowDraggable
                controlGrip
                dragLabel='Drag to move'
                resolveDrop={info => {
                    const projection = project(info);
                    return projection == null
                        ? null
                        : {indent: projection.depth * TREE_INDENT, allowed: projection.allowed};
                }}
                onMove={(_from, _to, info) => {
                    if (info == null) return;
                    const projection = project(info);
                    if (projection == null || !projection.allowed) return;
                    setRegions(prev =>
                        moveTreeItem(prev, rows[info.activeIndex].id, projection.containerId, projection.index),
                    );
                }}
                className='flex flex-col gap-y-1'
                renderItem={({item: row, projectedIndent}) => (
                    <div
                        style={{marginLeft: projectedIndent ?? row.depth * TREE_INDENT}}
                        className={cn(
                            'flex flex-1 items-center gap-2 rounded px-2 py-1 text-sm transition-[margin] duration-75',
                            row.kind === 'container' ? 'text-subtle uppercase' : 'bg-surface-neutral font-medium',
                        )}
                    >
                        {row.kind === 'item' && row.rowKind !== 'page' && (
                            <span className='rounded bg-black/5 px-1 text-[10px] text-subtle uppercase'>
                                {row.rowKind}
                            </span>
                        )}
                        <span className='truncate'>{row.label}</span>
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

export const TreeProjection: Story = {
    name: 'Behavior / Tree Projection',
    render: () => <TreeDemo />,
};
