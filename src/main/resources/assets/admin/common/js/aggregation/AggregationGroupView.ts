import {BucketAggregationView} from './BucketAggregationView';
import {AggregationSelection} from './AggregationSelection';
import {DivEl} from '../dom/DivEl';
import {AggregationView} from './AggregationView';
import {H2El} from '../dom/H2El';
import {Aggregation} from './Aggregation';
import {Bucket} from './Bucket';
import {SelectionChange} from '../util/SelectionChange';
import {BucketAggregation} from './BucketAggregation';

export class AggregationGroupView
    extends DivEl {

    private readonly name: string;

    private readonly displayName: string;

    protected aggregationViews: AggregationView[] = [];

    private titleEl: H2El = new H2El();

    private bucketSelectionChangedListeners: ((bucketSelection: SelectionChange<Bucket>) => void)[] = [];

    constructor(name: string, displayName: string) {
        super('aggregation-group-view');

        this.name = name;
        this.displayName = displayName;

        this.titleEl.getEl().setInnerHtml(this.displayName);
        this.appendChild(this.titleEl);
    }

    setTooltipActive(flag: boolean) {
        this.aggregationViews.forEach(av => av.setTooltipActive(flag));
    }

    initialize(): void {
        // must be implemented by children
    }

    getAggregationViews(): AggregationView[] {
        return this.aggregationViews;
    }

    getName(): string {
        return this.name;
    }

    /*
     * Override this method to give other criteria for this group to display given facet.
     */
    handlesAggregation(aggregation: Aggregation) {
        return aggregation.getName() === this.name;
    }

    getSelectedValuesByAggregationName(): AggregationSelection[] {
        const aggregationSelections: AggregationSelection[] = [];

        this.aggregationViews.forEach((bucketAggregationView: BucketAggregationView) => {
            const selectedBuckets: Bucket[] = bucketAggregationView.getSelectedValues();

            if (selectedBuckets != null) {
                const aggregationSelection: AggregationSelection = new AggregationSelection(bucketAggregationView.getName());
                aggregationSelection.setValues(selectedBuckets);

                aggregationSelections.push(aggregationSelection);
            }
        });

        return aggregationSelections;
    }

    hasSelections(): boolean {
        let hasSelections = false;
        for (const aggregationView of this.aggregationViews) {
            if (aggregationView.hasSelectedEntry()) {
                hasSelections = true;
                break;
            }
        }
        return hasSelections;
    }

    deselectGroup(supressEvent?: boolean) {
        this.aggregationViews.forEach((aggregationView: AggregationView) => {
            aggregationView.deselectFacet(supressEvent);
        });
    }

    onBucketViewSelectionChanged(listener: (bucketSelection: SelectionChange<Bucket>) => void): void {
        this.bucketSelectionChangedListeners.push(listener);
    }

    unBucketViewSelectionChanged(listener: (bucketSelection: SelectionChange<Bucket>) => void): void {
        this.bucketSelectionChangedListeners = this.bucketSelectionChangedListeners
            .filter((curr: (bucketSelection: SelectionChange<Bucket>) => void) => curr !== listener);
    }

    notifyBucketViewSelectionChanged(bucketSelection: SelectionChange<Bucket>): void {
        this.bucketSelectionChangedListeners.forEach(
            (listener: (bucketSelection: SelectionChange<Bucket>) => void) => listener(bucketSelection)
        );
    }

    update(aggregations: Aggregation[]) {
        aggregations.forEach((aggregation: Aggregation) => {
            const aggregationView: AggregationView =
                this.getAggregationView(aggregation.getName()) || this.addAggregationView(aggregation);

            aggregationView.update(aggregation);
        });
    }

    private addAggregationView(aggregation: Aggregation): AggregationView {
        const aggregationView: AggregationView = this.createAggregationView(aggregation);

        this.appendChild(aggregationView);
        this.aggregationViews.push(aggregationView);

        return aggregationView;
    }

    protected createAggregationView(aggregation: Aggregation): AggregationView {
        if (aggregation instanceof BucketAggregation) {
            const bucketAggregationView: BucketAggregationView = new BucketAggregationView(aggregation);

            bucketAggregationView.onBucketSelectionChanged((bucketSelection: SelectionChange<Bucket>) =>
                this.notifyBucketViewSelectionChanged(bucketSelection)
            );

            return bucketAggregationView;
        } else {
            throw Error(`Creating this type of Aggregation view is not supported: ${aggregation.getName()}`);
        }
    }

    private getAggregationView(name: string): AggregationView {
        return this.aggregationViews.find((aggregationView: AggregationView) => aggregationView.getName() === name);
    }
}
