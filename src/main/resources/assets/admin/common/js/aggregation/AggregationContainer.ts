import {DivEl} from '../dom/DivEl';
import {AggregationGroupView} from './AggregationGroupView';
import {Aggregation} from './Aggregation';
import {AggregationSelection} from './AggregationSelection';

export class AggregationContainer
    extends DivEl {

    aggregationGroupViews: AggregationGroupView[] = [];

    addAggregationGroupView(aggregationGroupView: AggregationGroupView) {
        this.appendChild(aggregationGroupView);
        this.aggregationGroupViews.push(aggregationGroupView);
    }

    deselectAll(supressEvent?: boolean) {
        this.aggregationGroupViews.forEach((aggregationGroupView: AggregationGroupView) => {
            aggregationGroupView.deselectGroup(supressEvent);
        });
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

    updateAggregations(aggregations: Aggregation[]): void {
        this.aggregationGroupViews.forEach((aggregationGroupView: AggregationGroupView) => {
            const matchingAggregations: Aggregation[] = aggregations.filter((current: Aggregation) => {
                return aggregationGroupView.handlesAggregation(current);
            });

            aggregationGroupView.update(matchingAggregations);
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
}
