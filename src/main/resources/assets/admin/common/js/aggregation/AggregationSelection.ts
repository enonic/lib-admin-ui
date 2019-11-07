import {Bucket} from './Bucket';

export class AggregationSelection {

    name: string;
    selectedBuckets: Bucket[];

    constructor(name: string) {
        this.name = name;
    }

    public setValues(selectedBuckets: Bucket[]) {
        this.selectedBuckets = selectedBuckets;
    }

    public getName(): string {
        return this.name;
    }

    public getSelectedBuckets(): Bucket[] {
        return this.selectedBuckets;
    }

}
