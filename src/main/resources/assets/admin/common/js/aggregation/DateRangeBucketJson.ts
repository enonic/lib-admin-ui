import {BucketJson} from './BucketJson';

export interface DateRangeBucketJson
    extends BucketJson {
    from: Date;
    to: Date;
}
