import {i18n} from '../../util/Messages';
import {Equitable} from '../../Equitable';
import {DeckPanel} from '../../ui/panel/DeckPanel';
import {ItemStatisticsPanel} from '../view/ItemStatisticsPanel';
import {DivEl} from '../../dom/DivEl';
import {ViewItem} from '../view/ViewItem';
import {ArrayHelper} from '../../util/ArrayHelper';
import {BrowseItem} from './BrowseItem';
import {BrowseItemsChanges} from './BrowseItemsChanges';

export class BrowseItemPanel<M extends Equitable>
    extends DeckPanel {

    protected itemStatisticsPanel: ItemStatisticsPanel<M>;

    private items: BrowseItem<M>[] = [];

    private noSelectionContainer: DivEl;

    constructor() {
        super('browse-item-panel no-selection');

        this.itemStatisticsPanel = this.createItemStatisticsPanel();

        this.noSelectionContainer = new DivEl('no-selection-container');
        this.noSelectionContainer.setHtml(i18n('panel.noselection'));

        this.addPanel(this.itemStatisticsPanel);
        this.appendChild(this.noSelectionContainer);

        this.showPanelByIndex(0);
    }

    createItemStatisticsPanel(): ItemStatisticsPanel<M> {
        return new ItemStatisticsPanel<M>();
    }

    togglePreviewForItem(item?: BrowseItem<M>) {
        if (item) {
            this.removeClass('no-selection');
        } else {
            this.showNoSelectionMessage();
        }
        this.setStatisticsItem(item);
    }

    updatePreviewPanel() {
        this.togglePreviewForItem(this.items.length > 0 ? this.items[this.items.length - 1] : null);
    }

    setStatisticsItem(item: BrowseItem<M>) {
        if (item) {
            this.itemStatisticsPanel.setItem(item);
        } else {
            this.itemStatisticsPanel.clearItem();
        }
    }

    getStatisticsItem(): ViewItem<M> {
        return this.itemStatisticsPanel.getItem();
    }

    getItemStatisticsPanel(): ItemStatisticsPanel<M> {
        return this.itemStatisticsPanel;
    }

    updateItems(items: BrowseItem<M>[]) {
        items.forEach((item) => {
            let index = this.indexOf(item);
            if (index >= 0) {
                this.items[index] = item;
            }
        });
    }

    getItems(): BrowseItem<M>[] {
        return this.items;
    }

    setItems(items: BrowseItem<M>[]): BrowseItemsChanges<M> {
        let changes = new BrowseItemsChanges<M>();

        let doFilter = (valueLeft: BrowseItem<M>, valueRight: BrowseItem<M>) => {
            if (valueLeft.getPath() && valueLeft.getPath() === valueRight.getPath()) {
                return true;
            } else if (valueLeft.getId() === valueRight.getId()) {
                return true;
            }

            return false;
        };

        let itemsToRemove = ArrayHelper.difference(this.items, items, doFilter);

        let itemsToAdd = ArrayHelper.difference(items, this.items, doFilter);

        let itemsUpdated = ArrayHelper.intersection(items, this.items, doFilter);

        itemsToRemove.forEach((item: BrowseItem<M>) => {
            this.removeItem(item);
        });

        itemsToAdd.forEach((item: BrowseItem<M>) => {
            this.addItem(item);
        });

        itemsUpdated.forEach((item: BrowseItem<M>) => {
            // addItem() will update the item, if there is a difference between them
            this.addItem(item);
        });

        changes.setAdded(itemsToAdd);
        changes.setRemoved(itemsToRemove);

        return changes;
    }

    protected compareItems(currentItem: BrowseItem<M>, updatedItem: BrowseItem<M>): boolean {
        return updatedItem.equals(currentItem);
    }

    private showNoSelectionMessage() {
        this.addClass('no-selection');
    }

    private addItem(item: BrowseItem<M>) {
        const index = this.indexOf(item);
        if (index >= 0) {
            // item already exist
            const currentItem = this.items[index];
            if (!this.compareItems(currentItem, item)) {
                // update current item
                this.items[index] = item;
            }
            return;
        }

        this.items.push(item);
    }

    private removeItem(item: BrowseItem<M>) {
        const index = this.indexOf(item);
        if (index < 0) {
            return;
        }

        this.items.splice(index, 1);
    }

    private indexOf(item: BrowseItem<M>): number {
        for (let i = 0; i < this.items.length; i++) {
            if (item.getPath() && item.getPath() === this.items[i].getPath() ||
                item.getId() === this.items[i].getId()) {
                return i;
            }
        }
        return -1;
    }
}
