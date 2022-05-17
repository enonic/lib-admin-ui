import {DivEl} from '../dom/DivEl';
import {AggregationGroupView} from './AggregationGroupView';
import {Aggregation} from './Aggregation';
import {AggregationSelection} from './AggregationSelection';
import {SelectionChange} from '../util/SelectionChange';
import {Bucket} from './Bucket';

export class AggregationContainer
    extends DivEl {

    aggregationGroupViews: AggregationGroupView[] = [];

    private lastSelectedGroupView: AggregationGroupView;

    addAggregationGroupView(aggregationGroupView: AggregationGroupView) {
        this.appendChild(aggregationGroupView);

        aggregationGroupView.onBucketViewSelectionChanged((bucketSelection: SelectionChange<Bucket>) => {
            if (bucketSelection.selected.length > 0) {
                this.lastSelectedGroupView = aggregationGroupView;
            }
        });

        this.aggregationGroupViews.push(aggregationGroupView);
    }

    deselectAll(supressEvent?: boolean) {
        this.aggregationGroupViews.forEach((aggregationGroupView: AggregationGroupView) => {
            aggregationGroupView.deselectGroup(supressEvent);
        });

        this.lastSelectedGroupView = null;
    }

    hasSelectedBuckets(): boolean {
        let hasSelected: boolean = false;
        this.aggregationGroupViews.forEach((aggregationGroupView: AggregationGroupView) => {
            if (aggregationGroupView.hasSelections()) {
                hasSelected = true;
            }
        });
        return hasSelected;
    }

    updateAggregations(aggregations: Aggregation[], doUpdateAll?: boolean) {

        this.aggregationGroupViews.forEach((aggregationGroupView: AggregationGroupView) => {

            let matchingAggregations: Aggregation[] = aggregations.filter((current: Aggregation) => {
                return aggregationGroupView.handlesAggregation(current);
            });

            if (doUpdateAll || this.isGroupUpdatable(aggregationGroupView)) {
                aggregationGroupView.update(matchingAggregations);
            }
        });
    }

    getSelectedValuesByAggregationName(): AggregationSelection[] {
        let aggregationSelections: AggregationSelection[] = [];

        this.aggregationGroupViews.forEach((aggregationGroupView: AggregationGroupView) => {
            let selectedValuesByAggregationName = aggregationGroupView.getSelectedValuesByAggregationName();
            aggregationSelections = aggregationSelections.concat(selectedValuesByAggregationName);

        });

        return aggregationSelections;
    }

    private isGroupUpdatable(aggregationGroupView: AggregationGroupView) {
        return aggregationGroupView !== this.lastSelectedGroupView;
    }
}
