import {Bucket} from './Bucket';

export class BucketViewSelectionChangedEvent {

    private oldValue: boolean;

    private newValue: boolean;

    private bucket: Bucket;

    constructor(oldValue: boolean, newValue: boolean, bucket: Bucket) {
        this.oldValue = oldValue;
        this.newValue = newValue;
        this.bucket = bucket;
    }

    getOldValue(): boolean {
        return this.oldValue;
    }

    getNewValue(): boolean {
        return this.newValue;
    }

    getBucket(): Bucket {
        return this.bucket;
    }
}
