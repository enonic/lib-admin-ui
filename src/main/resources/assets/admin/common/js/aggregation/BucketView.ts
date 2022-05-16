import {Tooltip} from '../ui/Tooltip';
import {DivEl} from '../dom/DivEl';
import {Bucket} from './Bucket';
import {Checkbox} from '../ui/Checkbox';
import {ValueChangedEvent} from '../ValueChangedEvent';
import {StringHelper} from '../util/StringHelper';
import {BucketViewSelectionChangedEvent} from './BucketViewSelectionChangedEvent';

export class BucketView
    extends DivEl {

    private bucket: Bucket;

    private checkbox: Checkbox;

    private selectionChangedListeners: Function[] = [];

    private displayName: string;

    private tooltip: Tooltip;

    constructor(bucket: Bucket) {
        super('aggregation-bucket-view');
        this.bucket = bucket;

        this.displayName = bucket.getDisplayName();
        this.checkbox = Checkbox.create().setLabelText(this.resolveLabelValue()).build();
        this.tooltip = new Tooltip(this.checkbox, bucket.getKey(), 1000);
        this.tooltip.setActive(false);

        this.checkbox.onValueChanged((event: ValueChangedEvent) => {
            this.notifySelectionChanged(eval(event.getOldValue()), eval(event.getNewValue()));
        });
        this.appendChild(this.checkbox);

        this.updateUI();
    }

    setTooltipActive(flag: boolean) {
        this.tooltip.setActive(flag);
    }

    setDisplayName(displayName: string) {
        this.displayName = displayName;
        this.updateLabel();
    }

    getBucket(): Bucket {
        return this.bucket;
    }

    getName(): string {
        return this.bucket.getKey();
    }

    update(bucket: Bucket) {
        this.bucket = bucket;
        this.updateUI();
    }

    isSelected(): boolean {
        return this.checkbox.isChecked();
    }

    deselect(supressEvent?: boolean) {
        this.checkbox.setChecked(false, supressEvent);
    }

    select(supressEvent?: boolean) {
        this.checkbox.setChecked(true, supressEvent);
    }

    notifySelectionChanged(oldValue: boolean, newValue: boolean) {
        this.selectionChangedListeners.forEach((listener: (event: BucketViewSelectionChangedEvent) => void) => {
            listener(new BucketViewSelectionChangedEvent(oldValue, newValue, this));
        });
    }

    unSelectionChanged(listener: (event: BucketViewSelectionChangedEvent) => void) {
        this.selectionChangedListeners = this.selectionChangedListeners
            .filter(function (curr: (event: BucketViewSelectionChangedEvent) => void) {
                return curr !== listener;
            });
    }

    onSelectionChanged(listener: (event: BucketViewSelectionChangedEvent) => void) {
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

    private updateUI() {

        this.updateLabel();

        if (this.bucket.getDocCount() > 0 || this.isSelected()) {
            this.show();
        } else {
            this.hide();
        }
    }

}
