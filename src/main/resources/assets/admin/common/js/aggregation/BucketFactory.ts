import {BucketWrapperJson} from './BucketWrapperJson';
import {Bucket} from './Bucket';
import {DateRangeBucketJson} from './DateRangeBucketJson';
import {BucketJson} from './BucketJson';
import {DateRangeBucket} from './DateRangeBucket';

export class BucketFactory {

    public static createFromJson(json: BucketWrapperJson): Bucket {

        if (json.DateRangeBucket) {
            return DateRangeBucket.fromDateRangeJson(<DateRangeBucketJson>json.DateRangeBucket);
        } else if (json.BucketJson) {
            return Bucket.fromJson(<BucketJson>json.BucketJson);
        } else {
            throw new Error('Bucket-type not recognized: ' + json);
        }
    }
}
