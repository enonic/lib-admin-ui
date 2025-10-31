import {i18n} from '../util/Messages';
import {Bucket} from './Bucket';
import {BucketAggregationJson} from './BucketAggregationJson';
import {BucketWrapperJson} from './BucketWrapperJson';
import {BucketFactory} from './BucketFactory';
import {Aggregation} from './Aggregation';
import {AggregationTypeWrapperJson} from './AggregationTypeWrapperJson';

export class BucketAggregation
    extends Aggregation {

    private buckets: Bucket[] = [];

    public static fromJsonArray(aggregationWrapperJsons: AggregationTypeWrapperJson[]): BucketAggregation[] {

        let aggregations: BucketAggregation[] = [];

        aggregationWrapperJsons.forEach((aggregationJson: AggregationTypeWrapperJson) => {
            aggregations.push(BucketAggregation.createFromJson(aggregationJson));
        });

        return aggregations;
    }

    public static createFromJson(json: AggregationTypeWrapperJson): BucketAggregation {

        if (json.BucketAggregation) {
            return BucketAggregation.fromJson(json.BucketAggregation as BucketAggregationJson);
        } else {
            throw new Error(`Aggregation type not recognized: ${JSON.stringify(json)}`);
        }
    }

    public static fromJson(json: BucketAggregationJson): BucketAggregation {

        let bucketAggregation: BucketAggregation = new BucketAggregation(json.name, i18n(`field.${json.name}`));

        json.buckets.forEach((bucketWrapper: BucketWrapperJson) => {
            bucketAggregation.addBucket(BucketFactory.createFromJson(bucketWrapper));
        });

        return bucketAggregation;
    }

    public getBucketByName(name: string): Bucket {
        return this.buckets.find((bucket) => bucket.getKey() === name);
    }

    public getBuckets(): Bucket[] {
        return this.buckets;
    }

    public addBucket(bucket: Bucket) {
        this.buckets.push(bucket);
    }

    public setBuckets(buckets: Bucket[]) {
        return this.buckets = buckets;
    }
}
