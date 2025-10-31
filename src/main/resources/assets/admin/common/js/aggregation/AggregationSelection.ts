import {Bucket} from './Bucket';

export class AggregationSelection {

    private readonly name: string;
    private readonly selectedBuckets: Bucket[];

    constructor(name: string, selectedBuckets: Bucket[]) {
        this.name = name;
        this.selectedBuckets = selectedBuckets;
    }

    public getName(): string {
        return this.name;
    }

    public getSelectedBuckets(): Bucket[] {
        return this.selectedBuckets;
    }

}
