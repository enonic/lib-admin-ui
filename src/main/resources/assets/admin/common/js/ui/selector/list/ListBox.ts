import {UlEl} from '../../../dom/UlEl';
import {Element} from '../../../dom/Element';
import {DivEl} from '../../../dom/DivEl';
import {H5El} from '../../../dom/H5El';

export class ListBox<I>
    extends UlEl {

    private items: I[] = [];

    private itemViews: { [key: string]: Element } = {};

    private itemsAddedListeners: { (items: I[]): void }[] = [];
    private itemsRemovedListeners: { (items: I[]): void }[] = [];
    private itemsChangedListeners: { (items: I[]): void }[] = [];

    private emptyText: string;
    private emptyView: DivEl;

    private sortFunc: (a: I, b: I) => number;

    constructor(className?: string) {
        super(className);
    }

    public setReadOnly(value: boolean) {
        this.toggleClass('readonly', value);
    }

    setEmptyText(text: string) {
        this.emptyText = text;
        this.addEmptyView();
    }

    setItems(items: I[], silent?: boolean) {
        this.clearItems(silent);

        this.items = items;
        if (items.length > 0) {
            this.layoutList(items);
            if (!silent) {
                this.notifyItemsAdded(items);
            }
        }
    }

    getItems(): I[] {
        return this.items.slice();
    }

    getItem(id: string): I {
        for (let i = 0; i < this.items.length; i++) {
            let item = this.items[i];
            if (this.getItemId(item) === id) {
                return item;
            }
        }
        return undefined;
    }

    clearItems(silent?: boolean) {
        if (this.items.length > 0) {
            let removedItems = this.items.slice();
            // correct way to empty array
            this.items.length = 0;
            this.itemViews = {};
            if (!silent) {
                this.notifyItemsRemoved(removedItems);
            }
        }
        this.layoutList(this.items);
    }

    addItem(item: I, silent: boolean = false) {
        this.doAddItem(false, [item], silent);
    }

    addItems(items: I[], silent: boolean = false) {
        this.doAddItem(false, items, silent);
    }

    addItemReadOnly(...items: I[]) {
        this.doAddItem(true, items);
    }

    removeItem(item: I, silent?: boolean) {
        this.removeItems([item], silent);
    }

    removeItems(items: I[], silent?: boolean) {
        let itemsRemoved: I[] = [];
        this.items = this.items.filter((item) => {
            for (let i = 0; i < items.length; i++) {
                if (this.getItemId(item) === this.getItemId(items[i])) {
                    this.removeItemView(item);
                    itemsRemoved.push(item);
                    return false;
                }
            }
            return true;
        });
        if (itemsRemoved.length > 0) {
            if (!silent) {
                this.notifyItemsRemoved(itemsRemoved);
            }
            if (this.getItemCount() === 0) {
                this.addEmptyView();
            }
        }
    }

    replaceItem(item: I, append: boolean = false, silent?: boolean) {
        this.replaceItems([item], append, silent);
    }

    replaceItems(items: I[], append: boolean = false, silent?: boolean) {
        const indexes = this.items.map(value => this.getItemId(value));
        items.forEach((item) => {
            const index = indexes.indexOf(this.getItemId(item));
            if (index > -1) {
                if (append) {
                    this.items.splice(index, 1);
                    this.items.unshift(item);
                } else {
                    this.items[index] = item;
                }

                const itemView = this.getItemView(item);
                if (itemView) {
                    this.updateItemView(itemView, item);
                }
            } else if (append) {
                this.items.unshift(item);
            }
        });
        if (!silent) {
            this.notifyItemsChanged(items);
        }
    }

    setSortItemViewsFunc(sortFunc: (a: I, b: I) => number) {
        this.sortFunc = sortFunc;
    }

    getItemCount(): number {
        return this.items.length;
    }

    getItemView(item: I) {
        return this.itemViews[this.getItemId(item)];
    }

    getItemViews() {
        return this.getItems().map((item) => this.getItemView(item));
    }

    refreshList() {
        this.layoutList(this.items);
    }

    public onItemsAdded(listener: (items: I[]) => void) {
        this.itemsAddedListeners.push(listener);
    }

    public unItemsAdded(listener: (items: I[]) => void) {
        this.itemsAddedListeners = this.itemsAddedListeners.filter((current) => {
            return current !== listener;
        });
    }

    public onItemsRemoved(listener: (items: I[]) => void) {
        this.itemsRemovedListeners.push(listener);
    }

    public unItemsRemoved(listener: (items: I[]) => void) {
        this.itemsRemovedListeners = this.itemsRemovedListeners.filter((current) => {
            return current !== listener;
        });
    }

    public onItemsChanged(listener: (items: I[]) => void) {
        this.itemsChangedListeners.push(listener);
    }

    public unItemsChanged(listener: (items: I[]) => void) {
        this.itemsChangedListeners = this.itemsChangedListeners.filter((current) => {
            return current !== listener;
        });
    }

    protected createItemView(_item: I, _readOnly: boolean): Element {
        throw new Error('You must override createListItem to create views for list items');
    }

    protected updateItemView(_itemView: Element, _item: I) {
        // override to update item view when data item has been changed
    }

    protected getItemId(_item: I): string {
        throw new Error('You must override getItemId to find item views by items');
    }

    protected createEmptyView(text: string) {
        const view = new H5El('empty-list-item');
        view.setHtml(text);
        return view;
    }

    private doAddItem(readOnly: boolean, items: I[], silent: boolean = false) {
        if (this.getItemCount() === 0) {
            this.removeEmptyView();
        }
        this.items = this.items.concat(items);
        items.forEach((item) => {
            this.addItemView(item, readOnly);
        });
        if (items.length > 0) {
            if (!silent) {
                this.notifyItemsAdded(items);
            }
        }
    }

    private layoutList(items: I[]) {
        this.removeChildren();
        if (items.length > 0) {
            for (let i = 0; i < items.length; i++) {
                this.addItemView(items[i]);
            }
        } else {
            this.addEmptyView();
        }
    }

    private removeItemView(item: I) {
        let itemView = this.itemViews[this.getItemId(item)];
        if (itemView) {
            this.removeChild(itemView);
            delete this.itemViews[this.getItemId(item)];
        }
    }

    private addItemView(item: I, readOnly: boolean = false) {
        let itemView = this.createItemView(item, readOnly);
        this.itemViews[this.getItemId(item)] = itemView;
        if (this.sortFunc) {
            const pos: number = this.items.sort(this.sortFunc).indexOf(item);
            this.insertChild(itemView, pos);
        } else {
            this.appendChild(itemView);
        }

    }

    private addEmptyView() {
        if (this.emptyText) {
            this.emptyView = this.createEmptyView(this.emptyText);
            this.appendChild(this.emptyView);
        }
    }

    private removeEmptyView() {
        if (this.emptyView) {
            this.removeChild(this.emptyView);
        }
    }

    private notifyItemsAdded(items: I[]) {
        this.itemsAddedListeners.forEach((listener) => {
            listener(items);
        });
    }

    private notifyItemsRemoved(items: I[]) {
        this.itemsRemovedListeners.forEach((listener) => {
            listener(items);
        });
    }

    private notifyItemsChanged(items: I[]) {
        this.itemsChangedListeners.forEach((listener) => {
            listener(items);
        });
    }
}

