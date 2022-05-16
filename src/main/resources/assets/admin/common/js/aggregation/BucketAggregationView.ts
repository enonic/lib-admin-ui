import {AggregationView} from './AggregationView';
import {BucketAggregation} from './BucketAggregation';
import {BucketView} from './BucketView';
import {Bucket} from './Bucket';
import {BucketViewSelectionChangedEvent} from './BucketViewSelectionChangedEvent';
import {Aggregation} from './Aggregation';
import {ObjectHelper} from '../ObjectHelper';

export class BucketAggregationView
    extends AggregationView {

    protected aggregation: BucketAggregation;

    protected bucketViews: BucketView[] = [];

    constructor(bucketAggregation: BucketAggregation) {
        super(bucketAggregation);
    }

    static createAggregationView(aggregation: Aggregation): BucketAggregationView {
        if (ObjectHelper.iFrameSafeInstanceOf(aggregation, BucketAggregation)) {
            return new BucketAggregationView(<BucketAggregation>aggregation);
        } else {
            throw Error('Creating BucketAggregationView of this type of Aggregation is not supported: ' + aggregation);
        }
    }

    setDisplayNames(): void {
        this.bucketViews.forEach((bucketView: BucketView) => {
            bucketView.setDisplayName(this.getDisplayNameForName(bucketView.getName()));
        });
    }

    hasSelectedEntry(): boolean {
        let isSelected: boolean = false;
        this.bucketViews.forEach((bucketView: BucketView) => {
            if (bucketView.isSelected()) {
                isSelected = true;
            }
        });
        return isSelected;
    }

    selectBucketViewByKey(key: string, supressEvent?: boolean) {
        this.bucketViews.some((bucketView: BucketView) => {
            if (bucketView.getName() === key) {
                bucketView.select(supressEvent);
                return true;
            }

            return false;
        });
    }

    setTooltipActive(flag: boolean) {
        this.bucketViews.forEach(bv => bv.setTooltipActive(flag));
    }

    getSelectedValues(): Bucket[] {
        return this.bucketViews
            .filter((bucketView: BucketView) => bucketView.isSelected())
            .map((bucketView: BucketView) => bucketView.getBucket());
    }

    deselectFacet(supressEvent?: boolean) {
        this.bucketViews.forEach((bucketView: BucketView) => {
            bucketView.deselect(supressEvent);
        });
    }

    update(aggregation: Aggregation) {
        const selectedBucketNames: string[] = this.getSelectedBucketNames();

        this.removeAll();
        this.aggregation = <BucketAggregation> aggregation;
        this.bucketViews = [];

        this.aggregation.getBuckets().forEach((bucket: Bucket) => {
            const wasSelected: boolean = selectedBucketNames.some((selectedBucketName: string) =>  selectedBucketName === bucket.getKey());
            this.addBucket(bucket, wasSelected);
        });

        this.setVisible(this.aggregation.getBuckets().some((bucket: Bucket) => bucket.getDocCount() > 0));
    }

    protected removeAll(): void {
        this.bucketViews.forEach((bucketView: BucketView) => bucketView.remove());
    }

    protected addBucket(bucket: Bucket, isSelected?: boolean): void {
        const bucketView: BucketView = new BucketView(bucket);

        if (isSelected) {
            bucketView.select(true);
        }

        this.addBucketView(bucketView);
    }

    protected addBucketView(bucketView: BucketView): void {
        bucketView.onSelectionChanged((event: BucketViewSelectionChangedEvent) => {
                const selected: Bucket[] = [];
                const deselected: Bucket[] = [];

                if (event.getNewValue()) {
                    selected.push(event.getBucketView().getBucket());
                } else {
                    deselected.push(event.getBucketView().getBucket());
                }

                this.notifyBucketSelectionChanged(selected, deselected);
            }
        );

        this.bucketViews.push(bucketView);
        this.appendBucketView(bucketView);
    }

    protected appendBucketView(bucketView: BucketView): void {
        this.appendChild(bucketView);
    }

    private getSelectedBucketNames(): string[] {
        return this.getSelectedValues().map((bucket: Bucket) => bucket.getKey());
    }

    protected hasBucketWithId(id: string): boolean {
        return this.bucketViews.some((bucketView: BucketView) => bucketView.getBucket().getKey() === id);
    }

    protected removeBucketView(bucketView: BucketView): void {
        this.bucketViews = this.bucketViews.filter((view: BucketView) => view !== bucketView);
        bucketView.remove();
    }
}
