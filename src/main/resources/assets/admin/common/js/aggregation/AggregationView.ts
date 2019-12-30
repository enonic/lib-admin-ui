import {DivEl} from '../dom/DivEl';
import {AggregationGroupView} from './AggregationGroupView';
import {Aggregation} from './Aggregation';
import {Bucket} from './Bucket';
import {BucketViewSelectionChangedEvent} from './BucketViewSelectionChangedEvent';

export class AggregationView
    extends DivEl {

    private parentGroupView: AggregationGroupView;

    private aggregation: Aggregation;

    private bucketSelectionChangedListeners: Function[] = [];

    private displayNameMap: { [name: string]: string } = {};

    constructor(aggregation: Aggregation, parentGroupView: AggregationGroupView) {
        super('aggregation-view');
        this.aggregation = aggregation;
        this.parentGroupView = parentGroupView;
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

    getParentGroupView() {
        return this.parentGroupView;
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

    onBucketViewSelectionChanged(listener: (event: BucketViewSelectionChangedEvent) => void) {
        this.bucketSelectionChangedListeners.push(listener);
    }

    unBucketViewSelectionChanged(listener: (event: BucketViewSelectionChangedEvent) => void) {
        this.bucketSelectionChangedListeners = this.bucketSelectionChangedListeners
            .filter(function (curr: (event: BucketViewSelectionChangedEvent) => void) {
                return curr !== listener;
            });
    }

    notifyBucketViewSelectionChanged(event: BucketViewSelectionChangedEvent) {

        this.bucketSelectionChangedListeners.forEach((listener: (event: BucketViewSelectionChangedEvent) => void) => {
            listener(event);
        });
    }
}
