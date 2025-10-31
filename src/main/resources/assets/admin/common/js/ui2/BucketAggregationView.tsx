import {Button, Checkbox} from '@enonic/ui';
import type {CheckboxChecked} from '@enonic/ui';
import type {ReactElement} from 'react';
import {useMemo} from 'react';
import {Bucket} from '../aggregation/Bucket';
import {BucketAggregation} from '../aggregation/BucketAggregation';
import {SelectionChange} from '../util/SelectionChange';
import {LegacyElement} from './LegacyElement';

const MAX_VISIBLE_BUCKETS = 5;

interface ComponentProps {
    aggregation: BucketAggregation;
    selectedKeys: readonly string[];
    displayNamesMap: Record<string, string>;
    tooltipActive: boolean;
    showAll: boolean;
    onToggle: (bucket: Bucket, checked: boolean) => void;
    onToggleShowAll: () => void;
    showMoreLabel?: string;
    showLessLabel?: string;
};

const resolveDisplayName = (bucket: Bucket, overrides: Record<string, string>): string => {
    const key = bucket.getKey();
    const override = overrides[key.toLowerCase()];
    return override ?? bucket.getDisplayName() ?? key;
};

const BucketAggregationViewComponent = ({
    aggregation,
    selectedKeys,
    displayNamesMap,
    tooltipActive,
    showAll,
    onToggle,
    onToggleShowAll,
    showMoreLabel = 'Show more',
    showLessLabel = 'Show less',
}: ComponentProps): ReactElement => {
    const buckets = aggregation.getBuckets();
    const selected = useMemo(() => new Set(selectedKeys), [selectedKeys]);
    const visibleBuckets = showAll ? buckets : buckets.slice(0, MAX_VISIBLE_BUCKETS);
    const hasHiddenBuckets = buckets.length > MAX_VISIBLE_BUCKETS;

    return (
        <div className='buckets-container'>
            <div className='buckets-views space-y-1'>
                {visibleBuckets.map(bucket => {
                    const key = bucket.getKey();
                    const label = `${resolveDisplayName(bucket, displayNamesMap)} (${bucket.getDocCount()})`;

                    const handleCheckedChange = (value: CheckboxChecked) => {
                        onToggle(bucket, value === true);
                    };

                    return (
                        <div key={key}
                             className='aggregation-bucket-view'
                             title={tooltipActive ? key : undefined}>
                            <Checkbox
                                id={key}
                                checked={selected.has(key)}
                                label={label}
                                onCheckedChange={handleCheckedChange}
                            />
                        </div>
                    );
                })}
            </div>
            {hasHiddenBuckets && (
                <div className='pt-1'>
                    <Button className='show-more'
                            size='sm'
                            label={showAll ? showLessLabel : showMoreLabel}
                            onClick={onToggleShowAll}/>
                </div>
            )}
        </div>
    );
};
BucketAggregationViewComponent.displayName = 'BucketAggregationView';

type Props = ComponentProps;

export class BucketAggregationView
    extends LegacyElement<typeof BucketAggregationViewComponent, Props> {

    private bucketAggregation: BucketAggregation;
    private selectedKeys: Set<string> = new Set<string>();
    private displayNamesMap: Record<string, string> = {};
    private tooltipActive = false;
    private showAll = false;
    private selectionChangedListeners: ((selection: SelectionChange<Bucket>) => void)[] = [];

    constructor(bucketAggregation: BucketAggregation) {
        super(
            {
                aggregation: bucketAggregation,
                selectedKeys: [],
                displayNamesMap: {},
                tooltipActive: false,
                showAll: false,
                onToggle: () => void 0,
                onToggleShowAll: () => void 0,
            },
            BucketAggregationViewComponent
        );

        this.bucketAggregation = bucketAggregation;
        this.getHTMLElement().classList.add('aggregation-view', 'bucket-aggregation-view');

        this.setProps({
            onToggle: this.handleToggle,
            onToggleShowAll: this.handleToggleShowAll,
        });

        this.setVisible(this.hasNonEmptyBuckets());
    }

    setDisplayNamesMap(displayNameMap: Record<string, string>): void {
        this.displayNamesMap = Object.entries(displayNameMap ?? {}).reduce((acc, [key, value]) => {
            acc[key.toLowerCase()] = value;
            return acc;
        }, {} as Record<string, string>);
        this.props.setKey('displayNamesMap', {...this.displayNamesMap});
    }

    setTooltipActive(flag: boolean): void {
        this.tooltipActive = flag;
        this.props.setKey('tooltipActive', flag);
    }

    setDisplayNames(): void {
        this.props.setKey('displayNamesMap', {...this.displayNamesMap});
    }

    getDisplayNameForName(name: string): string | undefined {
        return this.displayNamesMap[name.toLowerCase()];
    }

    getAggregation(): BucketAggregation {
        return this.bucketAggregation;
    }

    getName(): string {
        return this.bucketAggregation.getName();
    }

    deselectFacet(suppressEvent?: boolean): void {
        if (this.selectedKeys.size === 0) {
            return;
        }

        const deselected = this.getSelectedValues();
        this.selectedKeys.clear();
        this.props.setKey('selectedKeys', []);

        if (!suppressEvent) {
            this.notifyBucketSelectionChanged({selected: [], deselected});
        }
    }

    hasSelectedEntry(): boolean {
        return this.selectedKeys.size > 0;
    }

    getSelectedValues(): Bucket[] {
        const selected = this.selectedKeys;
        return this.bucketAggregation.getBuckets()
            .filter(bucket => selected.has(bucket.getKey()));
    }

    update(aggregation: BucketAggregation): void {
        this.bucketAggregation = aggregation;

        const availableKeys = new Set(aggregation.getBuckets().map(bucket => bucket.getKey()));
        this.selectedKeys.forEach(key => {
            if (!availableKeys.has(key)) {
                this.selectedKeys.delete(key);
            }
        });

        this.props.setKey('aggregation', aggregation);
        this.props.setKey('selectedKeys', Array.from(this.selectedKeys));

        this.setVisible(this.hasNonEmptyBuckets());
    }

    selectBucketViewByKey(key: string, suppressEvent?: boolean): void {
        const bucket = this.bucketAggregation.getBucketByName(key);
        if (!bucket) {
            return;
        }
        this.updateSelection(bucket, true, suppressEvent === true);
    }

    protected addBucket(bucket: Bucket, isSelected: boolean): void {
        if (isSelected) {
            this.selectedKeys.add(bucket.getKey());
            this.props.setKey('selectedKeys', Array.from(this.selectedKeys));
        }
    }

    protected addBucketView(_bucket: unknown): void {
        // Retained for backwards compatibility; no-op in React-based version.
    }

    protected removeBucketView(bucketView: {getBucket?: () => Bucket}): void {
        const bucket = bucketView?.getBucket?.();
        if (!bucket) {
            return;
        }
        this.selectedKeys.delete(bucket.getKey());
        this.props.setKey('selectedKeys', Array.from(this.selectedKeys));
        this.setVisible(this.hasNonEmptyBuckets());
    }

    getSelectedBucketNames(): string[] {
        return Array.from(this.selectedKeys);
    }

    hasBucketWithId(id: string): boolean {
        return this.bucketAggregation.getBuckets()
            .some(bucket => bucket.getKey() === id);
    }

    onBucketSelectionChanged(listener: (selection: SelectionChange<Bucket>) => void): void {
        this.selectionChangedListeners.push(listener);
    }

    unBucketSelectionChanged(listener: (selection: SelectionChange<Bucket>) => void): void {
        this.selectionChangedListeners = this.selectionChangedListeners
            .filter(curr => curr !== listener);
    }

    protected notifyBucketSelectionChanged(bucketSelection: SelectionChange<Bucket>): void {
        this.selectionChangedListeners.forEach(listener => listener(bucketSelection));
    }

    private readonly handleToggle = (bucket: Bucket, checked: boolean): void => {
        this.updateSelection(bucket, checked, false);
    };

    private readonly handleToggleShowAll = (): void => {
        this.toggleShowAll();
    };

    private toggleShowAll(): void {
        this.showAll = !this.showAll;
        this.props.setKey('showAll', this.showAll);
    }

    private updateSelection(bucket: Bucket, checked: boolean, suppressEvent: boolean): void {
        const key = bucket.getKey();
        const wasSelected = this.selectedKeys.has(key);

        if (checked === wasSelected) {
            return;
        }

        if (checked) {
            this.selectedKeys.add(key);
        } else {
            this.selectedKeys.delete(key);
        }

        this.props.setKey('selectedKeys', Array.from(this.selectedKeys));

        if (!suppressEvent) {
            const selection: SelectionChange<Bucket> = checked
                ? {selected: [bucket], deselected: []}
                : {selected: [], deselected: [bucket]};
            this.notifyBucketSelectionChanged(selection);
        }
    }

    private hasNonEmptyBuckets(): boolean {
        return this.bucketAggregation.getBuckets().length > 0;
    }
}
