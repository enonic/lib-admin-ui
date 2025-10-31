import {Button, Checkbox, type CheckboxChecked, cn, Combobox, Listbox, SearchInput} from '@enonic/ui';
import {Download} from 'lucide-react';
import {ReactElement, useMemo} from 'preact/compat';
import {useCallback, useState} from 'react';
import {AggregationSelection} from '../aggregation/AggregationSelection';
import {Bucket} from '../aggregation/Bucket';
import {BucketAggregation} from '../aggregation/BucketAggregation';
import {LegacyElement} from './LegacyElement';

const MAX_VISIBLE_BUCKETS = 5;

const toSafeKey = (key: string) => key.replace(/[^a-zA-Z0-9_-]/g, '--');

interface BucketAggregationComponentProps {
    aggregation: BucketAggregation;
    selection: Bucket[];
    onSelectionChange: (selection: Bucket[]) => void;
    showAll?: boolean;
    showMoreLabel?: string;
    showLessLabel?: string;
}

const BucketAggregationComponent = ({
                                        aggregation,
                                        selection,
                                        onSelectionChange,
                                        showAll,
                                        showMoreLabel = 'Show more',
                                        showLessLabel = 'Show less',
                                    }: BucketAggregationComponentProps): ReactElement => {
    const [showAllState, setShowAllState] = useState(showAll ?? false);
    const handleShowMoreLessClick = () => {
        setShowAllState(!showAllState);
    };

    const isSelected = (bucket: Bucket) => selection.some(b => b.getKey() === bucket.getKey());

    const buckets = aggregation.getBuckets().filter((b) => b.getDocCount() > 0);
    const visibleBuckets = showAllState ? buckets : buckets.slice(0, MAX_VISIBLE_BUCKETS);
    const hasHiddenBuckets = buckets.length > MAX_VISIBLE_BUCKETS;

    const handleSelectionChange = (bucket: Bucket, checkedState: CheckboxChecked) => {
        const isChecked = checkedState === true;
        const newSelection = isChecked ? [...selection, bucket] : selection.filter(b => b.getKey() !== bucket.getKey());
        onSelectionChange(newSelection);
    }

    return (
        <div className=''>
            <div className={'font-semibold'}>{aggregation.getDisplayName()}</div>
            <div className={'pt-2 pb-2 flex flex-col gap-2'}>
                {visibleBuckets.map(bucket => {
                    const label = `${bucket.getDisplayName() ?? bucket.getKey()} (${bucket.getDocCount()})`;
                    const safeKey = `${aggregation.getName()}-${toSafeKey(bucket.getKey())}`;
                    return (
                        <Checkbox
                            id={safeKey}
                            key={safeKey}
                            className={'px-2.5'}
                            checked={isSelected(bucket)}
                            defaultChecked={false}
                            label={label}
                            onCheckedChange={(checked: CheckboxChecked) => handleSelectionChange(bucket, checked)}
                        />

                    );
                })}
                {hasHiddenBuckets && (
                    <div className='flex justify-end'>
                        <Button className='show-more'
                                size='sm'
                                variant={'outline'}
                                label={showAllState ? showLessLabel : showMoreLabel}
                                onClick={handleShowMoreLessClick}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export interface FilterableBucketAggregationComponentProps {
    aggregation: BucketAggregation;
    selection: Bucket[];
    onSelectionChange: (selection: Bucket[]) => void;
    idsToKeepOnTop?: string[];
}

const FilterableBucketAggregationComponent = ({
                                                  aggregation,
                                                  selection,
                                                  onSelectionChange,
                                                  idsToKeepOnTop,
                                              }: FilterableBucketAggregationComponentProps): ReactElement => {
    const [inputValue, setInputValue] = useState('');
    const isSelected = (bucket: Bucket) => selection.some(b => b.getKey() === bucket.getKey());
    const toLabel = useCallback((bucket: Bucket) => {
        return `${bucket.getDisplayName() ?? bucket.getKey()} (${bucket.getDocCount()})`;
    }, []);


    const buckets = useMemo(
        () => aggregation.getBuckets().filter(b => b.getDocCount() > 0),
        [aggregation]
    );

    const filteredBuckets = useMemo(() => {
        const val: string = inputValue.toLowerCase();
        return buckets.filter(bucket => bucket.getKey().toLowerCase().indexOf(val) >= 0 ||
               bucket.getDisplayName()?.toLowerCase().indexOf(val) >= 0);
    }, [buckets, inputValue]);

    const listboxSelection = useMemo(
        () => selection.map(b => toSafeKey(b.getKey())),
        [selection]
    );

    const onListboxSelectionChange = useCallback(
        (selectedKeys: string[]) => {
            const selectedBuckets = buckets.filter(b => selectedKeys.includes(toSafeKey(b.getKey())));
            onSelectionChange(selectedBuckets);
        },
        [buckets, onSelectionChange]
    );

    const bucketsToShowOnTop = useMemo(() => {
        if (!idsToKeepOnTop || idsToKeepOnTop.length === 0) {
            return [];
        }
        return buckets.filter(b => idsToKeepOnTop.includes(b.getKey()));
    }, [buckets, idsToKeepOnTop]);

    const topBuckets = useMemo(() => {
        const result = new Map<string, Bucket>();
        bucketsToShowOnTop.forEach(b => result.set(b.getKey(), b));
        selection.forEach(b => {
            if (!result.has(b.getKey())) {
                result.set(b.getKey(), b);
            }
        });

        return Array.from(result.values());
    }, [bucketsToShowOnTop, selection]);

    const toggleTopBucket = useCallback(
        (bucket: Bucket) => {
            const isBucketSelected = isSelected(bucket);
            let newSelection: Bucket[];
            if (isBucketSelected) {
                newSelection = selection.filter(b => b.getKey() !== bucket.getKey());
            } else {
                newSelection = [...selection, bucket];
            }
            onSelectionChange(newSelection);
        },
        [selection, onSelectionChange]
    );

    return (
        <div className='relative'>
            <div className={'font-semibold mb-2'}>{aggregation.getDisplayName()}</div>
            {topBuckets.map((bucket) => {
                const safeKey = `${aggregation.getName()}-${toSafeKey(bucket.getKey())}-top`;

                return(
                    <Checkbox
                        id={safeKey}
                        key={safeKey}
                        className={'mb-2'}
                        checked={isSelected(bucket)}
                        onClick={() => toggleTopBucket(bucket)}
                        label={toLabel(bucket)}
                    />
                )
            })}
            <Combobox.Root value={inputValue} onChange={setInputValue} selectionMode={'multiple'} onSelectionChange={onListboxSelectionChange} selection={listboxSelection} closeOnBlur={false}>
                <Combobox.Content>
                    <Combobox.Control>
                        <Combobox.Input placeholder='Search'/>
                        <Combobox.Toggle/>
                    </Combobox.Control>

                    <Combobox.Popup>
                        <Listbox.Content>
                            {filteredBuckets.map((bucket) => {
                                const safeKey = `${aggregation.getName()}-${toSafeKey(bucket.getKey())}-list-item`;
                                const isBucketSelected = isSelected(bucket);

                                return (
                                    <Listbox.Item key={safeKey} value={toSafeKey(bucket.getKey())} className={cn('h-9',isBucketSelected && 'group')} data-tone={isBucketSelected ? 'inverse' : ''} >
                                        <Checkbox
                                            id={safeKey}
                                            checked={isBucketSelected}
                                            onClick={e => { // listbox will handle selection
                                                e.stopPropagation();
                                                e.preventDefault();
                                            }}
                                            label={toLabel(bucket)}
                                            tabIndex={-1}
                                        />
                                    </Listbox.Item>
                                );
                            })}
                        </Listbox.Content>
                    </Combobox.Popup>
                </Combobox.Content>
            </Combobox.Root>
        </div>
    );
};

export interface BrowseFilterPanelComponentProps {
    value?: string;
    onChange: (value: string) => void;
    selection?: AggregationSelection[];
    onSelectionChange?: (selection: AggregationSelection[]) => void;
    hits?: number;
    bucketAggregations: BucketAggregation[];
    filterableAggregations?: {
       name: string;
       idsToKeepOnTop?: string[];
    }[];
    exportOptions?: {
        label?: string;
        action: () => void;
    }
}

const BrowseFilterPanelComponent = ({
                                        value,
                                        onChange,
                                        hits = 0,
                                        selection: controlledSelection,
                                        onSelectionChange,
                                        bucketAggregations,
                                        filterableAggregations,
                                        exportOptions,
                                    }: BrowseFilterPanelComponentProps): React.ReactElement => {
    const nonEmptyAggregations = bucketAggregations.filter(ba => ba.getBuckets().some(b => b.getDocCount() > 0));

    const [uncontrolledSelection, setUncontrolledSelection] = useState<AggregationSelection[]>([]);
    const isSelectionControlled = controlledSelection !== undefined;
    const selection = isSelectionControlled ? controlledSelection : uncontrolledSelection;
    const updateSelection = useCallback(
        (newSelection: AggregationSelection[]) => {
            if (!isSelectionControlled) {
                setUncontrolledSelection(newSelection);
            }

            onSelectionChange?.(newSelection);
        },
        [isSelectionControlled, onSelectionChange],
    );

    const getBucketSelection = useCallback(
        (ba: BucketAggregation) => selection.find(s => s.getName() === ba.getName())?.getSelectedBuckets() || [], [selection]);
    const onBucketSelectionChange = useCallback((name: string, newBucketSelection: Bucket[]) => {
        const newSelection = selection.filter(s => s.getName() !== name);
        if (newBucketSelection.length > 0) {
            newSelection.push(new AggregationSelection(name, newBucketSelection));
        }
        updateSelection(newSelection);
    }, [selection, updateSelection]);

    return (
        <div className='bg-surface-neutral px-5 py-3'>
            <SearchInput id={`bfc-input-${new Date().getDate()}`} className={'h-11.5'} showSearchIcon={false} value={value} onChange={onChange} placeholder='Type to search...'/>
            <div className='flex mt-2 mb-8 items-center'>
                <div className='grow'>
                    <span className='text-lg pl-4.5 pr-4.5'>{hits} hits</span>
                </div>
                {
                    exportOptions && hits > 0 &&
                    <Button onClick={exportOptions.action} size={'sm'} label={exportOptions.label || 'Export'} variant='outline'
                            endIcon={Download}/>
                }
            </div>
            <div className={'flex flex-col gap-7.5'}>
                {nonEmptyAggregations.map((ba) => {
                    const safeKey = ba.getName();
                    const filterableOptions = filterableAggregations?.find(fa => fa.name === ba.getName());

                    return (
                        filterableOptions ?
                        <FilterableBucketAggregationComponent
                            key={safeKey}
                            selection={getBucketSelection(ba)}
                            idsToKeepOnTop={filterableOptions.idsToKeepOnTop}
                            onSelectionChange={(bucketSel) => onBucketSelectionChange(ba.getName(), bucketSel)}
                            aggregation={ba}/> :
                        <BucketAggregationComponent key={safeKey}
                                                    selection={getBucketSelection(ba)}
                                                    onSelectionChange={(bucketSel) => onBucketSelectionChange(ba.getName(), bucketSel)}
                                                    aggregation={ba}/>
                    );
                })}
            </div>
        </div>
    );
}

export class BrowseFilterComponent
    extends LegacyElement<typeof BrowseFilterPanelComponent, BrowseFilterPanelComponentProps> {

    private currentValue: string;

    private selection: AggregationSelection[] = [];

    constructor(props: BrowseFilterPanelComponentProps) {
        const {onChange, onSelectionChange, ...rest} = props;

        super({
            onChange: (value: string) => {
                this.currentValue = value;
                props.onChange?.(value);
            },
            onSelectionChange: (selection: AggregationSelection[]) => {
                this.selection = selection;
                props.onSelectionChange?.(selection);
            },
            ...rest,
        }, BrowseFilterPanelComponent);

        this.currentValue = props.value ?? '';
    }

    reset(): void {
        //
    }

    deselectAll(silent?: boolean): void {
        //
    }

    updateAggregations(aggregations: BucketAggregation[]): void {
        this.props.setKey('bucketAggregations', aggregations);
    }

    getSelectedBuckets(): AggregationSelection[] {
        return this.selection;
    }

    getValue(): string {
        return this.currentValue;
    }

    hasSelectedBuckets(): boolean {
        return this.selection.length > 0;
    }

    updateHitsCounter(hits: number): void {
        this.props.setKey('hits', hits);
    }
}
