import {BucketWrapperJson} from './BucketWrapperJson';
import {Bucket} from './Bucket';
import {DateRangeBucket} from './DateRangeBucket';

export class BucketFactory {

    public static createFromJson(json: BucketWrapperJson): Bucket {

        if (json.DateRangeBucket) {
            return DateRangeBucket.fromDateRangeJson(json.DateRangeBucket);
        } else if (json.BucketJson) {
            return Bucket.fromJson(json.BucketJson);
        } else {
            throw new Error(`Bucket-type not recognized: ${JSON.stringify(json)}`);
        }
    }
}
