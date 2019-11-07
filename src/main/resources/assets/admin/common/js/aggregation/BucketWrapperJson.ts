import {BucketJson} from './BucketJson';
import {DateRangeBucketJson} from './DateRangeBucketJson';

export interface BucketWrapperJson {

    BucketJson?: BucketJson;
    DateRangeBucket?: DateRangeBucketJson;

}
