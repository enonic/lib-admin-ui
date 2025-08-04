import {DivEl} from '../dom/DivEl';
import {Tooltip} from '../ui/Tooltip';
import {Checkbox} from '../ui2/Checkbox';
import {StringHelper} from '../util/StringHelper';
import {Bucket} from './Bucket';
import {BucketViewSelectionChangedEvent} from './BucketViewSelectionChangedEvent';

export class BucketView
    extends DivEl {

    private bucket: Bucket;

    private checkbox: Checkbox;

    private selectionChangedListeners: ((event: BucketViewSelectionChangedEvent) => void)[] = [];

    private displayName: string;

    private tooltip: Tooltip;

    constructor(bucket: Bucket) {
        super('aggregation-bucket-view');
        this.bucket = bucket;

        this.displayName = bucket.getDisplayName();
        this.checkbox = new Checkbox({
            label: this.resolveLabelValue(),
            onCheckedChange: (raw) => {
                const isChecked = raw === true;

                this.selectionChangedListeners.forEach(listener => {
                    listener(
                        new BucketViewSelectionChangedEvent(
                            /* oldSelected = */ !isChecked,
                            /* newSelected = */  isChecked,
                            this
                        )
                    );
                });
            }
        });

        this.tooltip = new Tooltip(this.checkbox, bucket.getKey(), 1000);
        this.tooltip.setActive(false);

        this.appendChild(this.checkbox);

        this.updateUI();
    }

    setTooltipActive(flag: boolean): void {
        this.tooltip.setActive(flag);
    }

    setDisplayName(displayName: string): void {
        this.displayName = displayName;
        this.updateLabel();
    }

    getBucket(): Bucket {
        return this.bucket;
    }

    getName(): string {
        return this.bucket.getKey();
    }

    update(bucket: Bucket): void {
        this.bucket = bucket;
        this.updateUI();
    }

    isSelected(): boolean {
        return this.checkbox.isChecked();
    }

    deselect(supressEvent?: boolean): void {
        this.checkbox.setChecked(false, supressEvent);
    }

    select(suppressEvent?: boolean): void {
        this.checkbox.setChecked(true, suppressEvent);
    }


    unSelectionChanged(listener: (event: BucketViewSelectionChangedEvent) => void): void {
        this.selectionChangedListeners = this.selectionChangedListeners
            .filter(function (curr: (event: BucketViewSelectionChangedEvent) => void) {
                return curr !== listener;
            });
    }

    onSelectionChanged(listener: (event: BucketViewSelectionChangedEvent) => void): void {
        this.selectionChangedListeners.push(listener);
    }

    private resolveLabelValue(): string {
        if (this.displayName != null) {
            return this.displayName + ' (' + this.bucket.getDocCount() + ')';
        }

        return this.resolveKey() + ' (' + this.bucket.getDocCount() + ')';
    }

    private resolveKey(): string {
        let key = this.bucket.getKey();
        if (key.indexOf(':') > 0) {
            return StringHelper.capitalize(key.substring(key.indexOf(':') + 1));
        }

        return key;
    }

    private updateLabel(): void {
        this.checkbox.setLabel(this.resolveLabelValue());
    }

    private updateUI(): void {
        this.updateLabel();
        this.setVisible(this.bucket.getDocCount() > 0 || this.isSelected());
    }

}
