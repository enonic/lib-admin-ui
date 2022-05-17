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
            return BucketAggregation.fromJson(<BucketAggregationJson>json.BucketAggregation);
        } else {
            throw new Error('Aggregation type not recognized: ' + json);
        }
    }

    public static fromJson(json: BucketAggregationJson): BucketAggregation {

        let bucketAggregation: BucketAggregation = new BucketAggregation(json.name);

        json.buckets.forEach((bucketWrapper: BucketWrapperJson) => {
            bucketAggregation.addBucket(BucketFactory.createFromJson(bucketWrapper));
        });

        return bucketAggregation;
    }

    public getBucketByName(name: string): Bucket {
        for (let i = 0; i < this.buckets.length; i++) {
            let bucket: Bucket = this.buckets[i];
            if (bucket.getKey() === name) {
                return bucket;
            }
        }
        return null;
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
