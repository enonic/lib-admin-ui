import {BucketAggregationView} from './BucketAggregationView';
import {AggregationSelection} from './AggregationSelection';
import {DivEl} from '../dom/DivEl';
import {AggregationView} from './AggregationView';
import {H2El} from '../dom/H2El';
import {Aggregation} from './Aggregation';
import {Bucket} from './Bucket';

export class AggregationGroupView
    extends DivEl {

    private readonly name: string;

    private readonly displayName: string;

    protected aggregationViews: AggregationView[] = [];

    private titleEl: H2El = new H2El();

    private bucketSelectionChangedListeners: { (selected: Bucket[], deselected: Bucket[]): void }[] = [];

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

        let aggregationSelections: AggregationSelection[] = [];

        this.aggregationViews.forEach((bucketAggregationView: BucketAggregationView) => {

            let selectedBuckets: Bucket[] = bucketAggregationView.getSelectedValues();

            if (selectedBuckets != null) {
                let aggregationSelection: AggregationSelection = new AggregationSelection(bucketAggregationView.getName());
                aggregationSelection.setValues(selectedBuckets);

                aggregationSelections.push(aggregationSelection);
            }
        });

        return aggregationSelections;
    }

    hasSelections(): boolean {
        let hasSelections = false;
        for (let i = 0; i < this.aggregationViews.length; i++) {
            if (this.aggregationViews[i].hasSelectedEntry()) {
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

    onBucketViewSelectionChanged(listener: (selected: Bucket[], deselected: Bucket[]) => void) {
        this.bucketSelectionChangedListeners.push(listener);
    }

    unBucketViewSelectionChanged(listener: (selected: Bucket[], deselected: Bucket[]) => void) {
        this.bucketSelectionChangedListeners = this.bucketSelectionChangedListeners
            .filter((curr: (selected: Bucket[], deselected: Bucket[]) => void) => {
                return curr !== listener;
            });
    }

    notifyBucketViewSelectionChanged(selected: Bucket[], deselected: Bucket[]) {
        this.bucketSelectionChangedListeners.forEach(
            (listener: (selected: Bucket[], deselected: Bucket[]) => void) => {
                listener(selected, deselected);
            });
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

        aggregationView.onBucketSelectionChanged((selected: Bucket[], deselected: Bucket[]) => {
                this.notifyBucketViewSelectionChanged(selected, deselected);
            }
        );

        this.aggregationViews.push(aggregationView);

        return aggregationView;
    }

    protected createAggregationView(aggregation: Aggregation): AggregationView {
        return BucketAggregationView.createAggregationView(aggregation);
    }

    private getAggregationView(name: string): AggregationView {
        return this.aggregationViews.find((aggregationView: AggregationView) => aggregationView.getName() === name);
    }
}
