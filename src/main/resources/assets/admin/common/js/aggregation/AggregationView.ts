import {DivEl} from '../dom/DivEl';
import {Aggregation} from './Aggregation';
import {Bucket} from './Bucket';

export class AggregationView
    extends DivEl {

    protected aggregation: Aggregation;

    private bucketSelectionChangedListeners: { (selected: Bucket[], deselected: Bucket[]): void }[] = [];

    private displayNameMap: { [name: string]: string } = {};

    constructor(aggregation: Aggregation) {
        super('aggregation-view');
        this.aggregation = aggregation;
    }

    setDisplayNamesMap(displayNameMap: { [name: string]: string }): void {
        this.displayNameMap = displayNameMap;
        this.setDisplayNames();
    }

    setTooltipActive(flag: boolean) {
        if (flag) {
            // using var to make typescript happy
        }
    }

    setDisplayNames(): void {
        throw new Error('Must be implemented by inheritor');
    }

    getDisplayNameForName(name: string): string {
        return this.displayNameMap[name.toLowerCase()];
    }

    getAggregation(): Aggregation {
        return this.aggregation;
    }

    getName(): string {
        return this.aggregation.getName();
    }

    deselectFacet(_supressEvent?: boolean) {
        throw new Error('Must be implemented by inheritor');
    }

    hasSelectedEntry(): boolean {
        throw new Error('Must be implemented by inheritor');
    }

    getSelectedValues(): Bucket[] {
        throw new Error('Must be implemented by inheritor');
    }

    update(_aggregation: Aggregation) {
        throw new Error('Must be implemented by inheritor');
    }

    onBucketSelectionChanged(listener: (selected: Bucket[], deselected: Bucket[]) => void) {
        this.bucketSelectionChangedListeners.push(listener);
    }

    unBucketSelectionChanged(listener: (selected: Bucket[], deselected: Bucket[]) => void) {
        this.bucketSelectionChangedListeners = this.bucketSelectionChangedListeners
            .filter(function (curr: (selected: Bucket[], deselected: Bucket[]) => void) {
                return curr !== listener;
            });
    }

    notifyBucketSelectionChanged(selected: Bucket[], deselected: Bucket[]) {
        this.bucketSelectionChangedListeners.forEach((listener: (selected: Bucket[], deselected: Bucket[]) => void) => {
            listener(selected, deselected);
        });
    }
}
