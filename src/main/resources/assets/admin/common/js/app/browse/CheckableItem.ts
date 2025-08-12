import Q from 'q';
import {DivEl} from '../../dom/DivEl';
import {Checkbox} from '../../ui/Checkbox';
import {Viewer} from '../../ui/Viewer';
import {ValueChangedEvent} from '../../ValueChangedEvent';
import {ViewItem} from '../view/ViewItem';

enum CheckableItemStatus {
    READONLY = 'readonly',
    SELECTED = 'selected',
}

export interface CheckableItemConfig<Item extends ViewItem> {
    viewer: Viewer<Item>;
    item: Item;
    checkbox?: {
        checked?: boolean | (() => boolean);
        enabled?: boolean | (() => boolean),
    };
}

export class CheckableItem<Item extends ViewItem>
    extends DivEl {

    protected checkbox?: Checkbox;

    protected readonly config: CheckableItemConfig<Item>;

    private selectListeners: ((selected: boolean) => void)[];

    constructor(config: CheckableItemConfig<Item>) {
        super('checkable-item');

        this.config = config;
        this.selectListeners = [];

        this.initElements();
        this.initListeners();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then(rendered => {
            this.removeChildren();
            return this.renderContent(rendered);
        });
    }

    getItem(): Item {
        return this.config.item;
    }

    getViewer(): Viewer<Item> {
        return this.config.viewer;
    }

    setSelected(selected: boolean, force?: boolean, silent?: boolean): void {
        if (force || this.isSelectable()) {
            this.checkbox?.setChecked(selected, silent);
            if (silent) {
                this.toggleClass(CheckableItemStatus.SELECTED, selected);
            }
        }
    }

    isSelected(): boolean {
        return this.checkbox?.isChecked() === true;
    }

    isSelectable(): boolean {
        return this.checkbox?.isEnabled() === true;
    }

    onSelected(listener: (selected: boolean) => void) {
        this.selectListeners.push(listener);
    }

    unSelected(listener: (selected: boolean) => void) {
        this.selectListeners = this.selectListeners.filter((current) => {
            return current !== listener;
        });
    }

    notifySelected(selected: boolean) {
        this.selectListeners.forEach((listener) => void listener(selected));
    }

    refreshSelectable(): void {
        if (typeof this.config.checkbox?.enabled === 'function') {
            const isEnabled = this.config.checkbox.enabled();
            this.checkbox?.setEnabled(isEnabled);
            this.toggleClass(CheckableItemStatus.READONLY, !isEnabled);
        }
    }

    protected initElements(): void {
        const {checkbox} = this.config;
        if (checkbox) {
            const {checked} = checkbox;
            const isChecked = typeof checked === 'function' ? checked() : checked !== false;
            this.checkbox = Checkbox.create().build();
            this.checkbox.addClass('checkable-item-checkbox');
            this.setSelected(isChecked, true, true);
            this.refreshSelectable();
        }
    }

    protected initListeners(): void {
        this.checkbox?.onValueChanged((event: ValueChangedEvent) => {
            const isSelected = event.getNewValue() === 'true';
            this.notifySelected(isSelected);
            this.toggleClass(CheckableItemStatus.SELECTED, isSelected);
        });
    }

    protected renderContent(rendered: boolean): boolean {
        if (this.checkbox) {
            this.appendChild(this.checkbox);
        }
        this.appendChild(this.config.viewer);

        return rendered;
    }
}
