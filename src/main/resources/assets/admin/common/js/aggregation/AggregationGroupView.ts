import {BucketAggregationView} from './BucketAggregationView';
import {AggregationSelection} from './AggregationSelection';
import {DivEl} from '../dom/DivEl';
import {AggregationView} from './AggregationView';
import {H2El} from '../dom/H2El';
import {BucketViewSelectionChangedEvent} from './BucketViewSelectionChangedEvent';
import {Aggregation} from './Aggregation';
import {Bucket} from './Bucket';
import {ObjectHelper} from '../ObjectHelper';

export class AggregationGroupView
    extends DivEl {

    private name: string;

    private displayName: string;

    private aggregationViews: AggregationView[] = [];

    private titleEl: H2El = new H2El();

    private bucketSelectionChangedListeners: Function[] = [];

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

    onBucketViewSelectionChanged(listener: (event: BucketViewSelectionChangedEvent) => void) {
        this.bucketSelectionChangedListeners.push(listener);
    }

    unBucketViewSelectionChanged(listener: (event: BucketViewSelectionChangedEvent) => void) {
        this.bucketSelectionChangedListeners = this.bucketSelectionChangedListeners
            .filter(function (curr: (event: BucketViewSelectionChangedEvent) => void) {
                return curr !== listener;
            });
    }

    notifyBucketViewSelectionChanged(event: BucketViewSelectionChangedEvent) {

        this.bucketSelectionChangedListeners.forEach((listener: (event: BucketViewSelectionChangedEvent) => void) => {
            listener(event);
        });
    }

    update(aggregations: Aggregation[]) {

        aggregations.forEach((aggregation: Aggregation) => {

            let existingAggregationView: AggregationView = this.getAggregationView(aggregation.getName());

            if (existingAggregationView == null) {
                this.addAggregationView(BucketAggregationView.createAggregationView(aggregation, this));
            } else {
                if (ObjectHelper.iFrameSafeInstanceOf(existingAggregationView, BucketAggregationView)) {

                    let bucketAggregationView: BucketAggregationView = <BucketAggregationView>existingAggregationView;
                    bucketAggregationView.update(aggregation);
                }
                // Here be Metric-aggregations
            }
        });
    }

    private addAggregationView(aggregationView: AggregationView) {
        this.appendChild(aggregationView);

        aggregationView.onBucketViewSelectionChanged((event: BucketViewSelectionChangedEvent) => {
                this.notifyBucketViewSelectionChanged(event);
            }
        );

        this.aggregationViews.push(aggregationView);
    }

    private getAggregationView(name: string): AggregationView {

        for (let i = 0; i < this.aggregationViews.length; i++) {
            let aggregationView: AggregationView = this.aggregationViews[i];
            if (aggregationView.getName() === name) {
                return aggregationView;
            }
        }
        return null;
    }
}
