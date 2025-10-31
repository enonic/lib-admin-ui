import {Checkbox} from '@enonic/ui';
import type {CheckboxChecked} from '@enonic/ui';
import type {ReactElement} from 'react';
import {useCallback, useMemo} from 'react';
import {Bucket} from '../aggregation/Bucket';
import {BucketViewSelectionChangedEvent} from '../aggregation/BucketViewSelectionChangedEvent';
import {StringHelper} from '../util/StringHelper';
import {LegacyElement} from './LegacyElement';

interface BucketViewComponentProps {
    bucket: Bucket;
    displayName?: string;
    selected: boolean;
    onToggle: (checked: boolean) => void;
}

const resolveKey = (bucket: Bucket): string => {
    const key = bucket.getKey();
    if (key.includes(':')) {
        const colonIndex = key.indexOf(':') + 1;
        return StringHelper.capitalize(key.substring(colonIndex));
    }
    return key;
};

const resolveLabelValue = (bucket: Bucket, displayName?: string): string => {
    const name = displayName ?? resolveKey(bucket);
    return `${name} (${bucket.getDocCount()})`;
};

const BucketViewComponent = ({
    bucket,
    displayName,
    selected,
    onToggle,
}: BucketViewComponentProps): ReactElement => {
    const label = useMemo(
        () => resolveLabelValue(bucket, displayName),
        [bucket, displayName]
    );

    const handleCheckedChange = useCallback(
        (value: CheckboxChecked) => {
            onToggle(value === true);
        },
        [onToggle]
    );

    return (
        <Checkbox
            key={bucket.getKey()}
            checked={selected}
            label={label}
            onCheckedChange={handleCheckedChange}
        />
    );
};
BucketViewComponent.displayName = 'BucketView';

export class BucketView
    extends LegacyElement<typeof BucketViewComponent, BucketViewComponentProps> {

    private bucket: Bucket;
    private displayName?: string;
    private selected = false;
    private tooltipActive = false;
    private readonly selectionChangedListeners: ((event: BucketViewSelectionChangedEvent) => void)[] = [];

    constructor(bucket: Bucket) {
        super(
            {
                bucket,
                displayName: bucket.getDisplayName(),
                selected: false,
                onToggle: () => void 0,
            },
            BucketViewComponent
        );

        this.bucket = bucket;
        this.displayName = bucket.getDisplayName();

        this.getHTMLElement().classList.add('aggregation-bucket-view');
        this.applyTooltip();

        this.setProps({
            onToggle: (checked: boolean) => this.handleToggle(checked),
        });

        this.updateVisibility();
    }

    setTooltipActive(flag: boolean): void {
        this.tooltipActive = flag;
        this.applyTooltip();
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
        if (this.displayName == null) {
            this.displayName = bucket.getDisplayName();
        }
        this.setProps({bucket});
        this.applyTooltip();
        this.updateUI();
    }

    isSelected(): boolean {
        return this.selected;
    }

    deselect(suppressEvent?: boolean): void {
        this.setSelected(false, suppressEvent === true);
    }

    select(suppressEvent?: boolean): void {
        this.setSelected(true, suppressEvent === true);
    }

    unSelectionChanged(listener: (event: BucketViewSelectionChangedEvent) => void): void {
        const index = this.selectionChangedListeners.indexOf(listener);
        if (index >= 0) {
            this.selectionChangedListeners.splice(index, 1);
        }
    }

    onSelectionChanged(listener: (event: BucketViewSelectionChangedEvent) => void): void {
        this.selectionChangedListeners.push(listener);
    }

    private handleToggle(checked: boolean): void {
        this.setSelected(checked, false);
    }

    private setSelected(checked: boolean, suppressEvent: boolean): void {
        const previous = this.selected;
        this.selected = checked;
        this.setProps({selected: checked});
        this.updateVisibility();

        if (!suppressEvent && previous !== checked) {
            const event = new BucketViewSelectionChangedEvent(previous, checked, this.getBucket());
            this.selectionChangedListeners.forEach(listener => listener(event));
        }
    }

    private updateLabel(): void {
        this.setProps({displayName: this.displayName});
    }

    private updateUI(): void {
        this.updateLabel();
        this.updateVisibility();
    }

    private updateVisibility(): void {
        this.setVisible(this.bucket.getDocCount() > 0 || this.selected);
    }

    private applyTooltip(): void {
        const element = this.getHTMLElement();
        if (this.tooltipActive) {
            element.setAttribute('title', this.bucket.getKey());
        } else {
            element.removeAttribute('title');
        }
    }
}
