import {AggregationTypeWrapperJson} from './AggregationTypeWrapperJson';
import {Aggregation} from './Aggregation';
import {BucketAggregation} from './BucketAggregation';
import {BucketAggregationJson} from './BucketAggregationJson';

export class AggregationFactory {

    public static createFromJson(json: AggregationTypeWrapperJson): Aggregation {

        if (json.BucketAggregation) {
            return BucketAggregation.fromJson(<BucketAggregationJson>json.BucketAggregation);
        } else {
            throw new Error('Aggregation type not recognized: ' + json);
        }
    }
}
