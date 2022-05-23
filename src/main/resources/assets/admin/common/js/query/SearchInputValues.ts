import {AggregationSelection} from '../aggregation/AggregationSelection';
import {Bucket} from '../aggregation/Bucket';

export class SearchInputValues {

    textSearchFieldValue: string;

    aggregationSelections: AggregationSelection[];

    public setAggregationSelections(aggregationSelections: AggregationSelection[]): void {
        this.aggregationSelections = aggregationSelections;
    }

    public setTextSearchFieldValue(textSearchFieldValue: string): void {
        this.textSearchFieldValue = textSearchFieldValue;
    }

    public getTextSearchFieldValue(): string {
        return this.textSearchFieldValue;
    }

    public getSelectedValuesForAggregationName(name: string): Bucket[] {
        return this.aggregationSelections.find(
            (aggregationSelection: AggregationSelection) => aggregationSelection.getName() === name)?.getSelectedBuckets();
    }
}
