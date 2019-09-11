import {AggregationFactory} from './AggregationFactory';
import {AggregationTypeWrapperJson} from './AggregationTypeWrapperJson';

export class Aggregation {

    private name: string;

    constructor(name: string) {
        this.name = name;
    }

    public static fromJsonArray(aggregationWrapperJsons: AggregationTypeWrapperJson[]): Aggregation[] {

        let aggregations: Aggregation[] = [];

        aggregationWrapperJsons.forEach((aggregationJson: AggregationTypeWrapperJson) => {
            aggregations.push(AggregationFactory.createFromJson(aggregationJson));
        });

        return aggregations;
    }

    public getName(): string {
        return this.name;
    }

}
