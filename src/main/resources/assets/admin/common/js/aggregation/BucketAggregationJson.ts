import {BucketWrapperJson} from './BucketWrapperJson';

export interface BucketAggregationJson {
    name: string;
    buckets: BucketWrapperJson[];
}
