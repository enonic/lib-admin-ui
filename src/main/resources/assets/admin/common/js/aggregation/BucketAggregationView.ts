import {AggregationView} from './AggregationView';
import {BucketAggregation} from './BucketAggregation';
import {BucketView} from './BucketView';
import {Bucket} from './Bucket';
import {SelectionChange} from '../util/SelectionChange';
import {BucketViewSelectionChangedEvent} from './BucketViewSelectionChangedEvent';
import {Aggregation} from './Aggregation';
import {BucketsContainer} from './BucketsContainer';

export class BucketAggregationView
    extends AggregationView {

    protected aggregation: BucketAggregation;

    protected bucketViews: BucketView[] = [];

    protected bucketsContainer: BucketsContainer;

    private bucketSelectionChangedListeners: { (bucketSelection: SelectionChange<Bucket>): void }[] = [];

    constructor(aggregation: Aggregation) {
        super(aggregation);

        this.initElements();
        this.initListeners();
    }

    setDisplayNames(): void {
        this.bucketViews.forEach((bucketView: BucketView) =>
            bucketView.setDisplayName(this.getDisplayNameForName(bucketView.getName()))
        );
    }

    hasSelectedEntry(): boolean {
        return this.bucketViews.some((bucketView: BucketView) => bucketView.isSelected());
    }

    selectBucketViewByKey(key: string, suppressEvent?: boolean): void {
        this.bucketViews.some((bucketView: BucketView) => {
            if (bucketView.getName() === key) {
                bucketView.select(suppressEvent);
                return true;
            }

            return false;
        });
    }

    setTooltipActive(flag: boolean): void {
        this.bucketViews.forEach(bv => bv.setTooltipActive(flag));
    }

    getSelectedValues(): Bucket[] {
        return this.bucketViews
            .filter((bucketView: BucketView) => bucketView.isSelected())
            .map((bucketView: BucketView) => bucketView.getBucket());
    }

    deselectFacet(suppressEvent?: boolean): void {
        this.bucketViews.forEach((bucketView: BucketView) =>
            bucketView.deselect(suppressEvent)
        );
    }

    update(aggregation: Aggregation): void {
        const selectedBucketNames: string[] = this.getSelectedBucketNames();

        this.removeAll();
        this.aggregation = <BucketAggregation> aggregation;
        this.bucketViews = [];

        this.aggregation.getBuckets().filter((bucket: Bucket) => bucket.getDocCount() > 0).forEach((bucket: Bucket) => {
            const wasSelected: boolean = selectedBucketNames.some((selectedBucketName: string) =>  selectedBucketName === bucket.getKey());
            this.addBucket(bucket, wasSelected);
        });

        this.setVisible(this.bucketViews.length > 0);
    }

    protected initElements(): void {
        this.bucketsContainer = new BucketsContainer();
    }

    protected initListeners(): void {
    //
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
            const bucketSelection: SelectionChange<Bucket> = {selected: [], deselected: []};
            const bucket: Bucket = event.getBucketView().getBucket();

            if (event.getNewValue()) {
                bucketSelection.selected.push(bucket);
            } else {
                bucketSelection.deselected.push(bucket);
            }

            this.notifyBucketSelectionChanged(bucketSelection);
        });

        this.bucketViews.push(bucketView);
        this.bucketsContainer.addBucketView(bucketView);
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

    onBucketSelectionChanged(listener: (bucketSelection: SelectionChange<Bucket>) => void): void {
        this.bucketSelectionChangedListeners.push(listener);
    }

    unBucketSelectionChanged(listener: (bucketSelection: SelectionChange<Bucket>) => void): void {
        this.bucketSelectionChangedListeners =
            this.bucketSelectionChangedListeners.filter((curr: (bucketSelection: SelectionChange<Bucket>) => void) => curr !== listener);
    }

    notifyBucketSelectionChanged(bucketSelection: SelectionChange<Bucket>): void {
        this.bucketSelectionChangedListeners.forEach((listener: (bucketSelection: SelectionChange<Bucket>) => void) =>
            listener(bucketSelection)
        );
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChild(this.bucketsContainer);

            return rendered;
        });
    }
}
