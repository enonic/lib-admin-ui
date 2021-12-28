import {UlEl} from '../../../dom/UlEl';
import {Element} from '../../../dom/Element';
import {DivEl} from '../../../dom/DivEl';
import {H5El} from '../../../dom/H5El';

export class ListBox<I>
    extends UlEl {

    private items: I[] = [];

    protected itemViews: Map<string, Element> = new Map<string, Element>();

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

    setItems(items: I[], silent?: boolean): void {
        this.clearItems(silent);
        this.items = items;
        this.layoutList();

        if (items.length > 0 && !silent) {
            this.notifyItemsAdded(items);
        }
    }

    getItems(): I[] {
        return this.items.slice();
    }

    getItem(id: string): I {
        return this.items.find((item: I) => this.getItemId(item) === id);
    }

    clearItems(silent?: boolean): void {
        const removedItems: I[] = this.items.slice();

        this.items = [];
        this.itemViews = new Map<string, Element>();

        if (removedItems.length > 0 && !silent) {
            this.notifyItemsRemoved(removedItems);
        }

        this.removeChildren();
        this.addEmptyView();
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

    removeItems(itemsToRemove: I[], silent?: boolean): void {
        const itemsRemoved: I[] = this.doRemoveItems(itemsToRemove);

        if (itemsRemoved.length > 0) {
            if (!silent) {
                this.notifyItemsRemoved(itemsRemoved);
            }

            if (this.getItemCount() === 0) {
                this.addEmptyView();
            }
        }
    }

    private doRemoveItems(itemsToRemove: I[]): I[] {
        const itemsLeft: I[] = [];
        const itemsRemoved: I[] = [];

        this.items.forEach((item: I) => {
            const itemId: string = this.getItemId(item);

            if (itemsToRemove.some((itemToRemove: I) => itemId === this.getItemId(itemToRemove))) {
                this.removeItemView(item);
                itemsRemoved.push(item);
            } else {
                itemsLeft.push(item);
            }
        });

        this.items = itemsLeft;

        return itemsRemoved;
    }

    replaceItem(item: I, append: boolean = false, silent?: boolean) {
        this.replaceItems([item], append, silent);
    }

    replaceItems(items: I[], append: boolean = false, silent?: boolean) {
        const indexes: string[] = this.items.map(value => this.getItemId(value));

        items.forEach((item: I) => {
            const index: number = indexes.indexOf(this.getItemId(item));

            if (index > -1) {
                if (append) {
                    this.items.splice(index, 1);
                    this.items.unshift(item);
                } else {
                    this.items[index] = item;
                }

                const itemView: Element = this.getItemView(item);

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

    getItemView(item: I): Element {
        return this.itemViews.get(this.getItemId(item));
    }

    getItemViews(): Element[] {
        return Array.from(this.itemViews.values());
    }

    refreshList() {
        this.removeChildren();
        this.layoutList();
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

    private doAddItem(readOnly: boolean, items: I[], silent: boolean = false): void {
        if (this.getItemCount() === 0) {
            this.removeEmptyView();
        }

        this.items = this.items.concat(items);

        items.forEach((item: I) => {
            this.addItemView(item, readOnly);
        });

        if (items.length > 0 && !silent) {
            this.notifyItemsAdded(items);
        }
    }

    private layoutList() {
        if (this.items.length > 0) {
            this.items.forEach((item: I) => this.addItemView(item));
        } else {
            this.addEmptyView();
        }
    }

    private removeItemView(item: I) {
        const id: string = this.getItemId(item);
        const itemView: Element = this.itemViews.get(id);

        if (itemView) {
            this.removeChild(itemView);
            this.itemViews.delete(id);
        }
    }

    protected addItemView(item: I, readOnly: boolean = false): Element {
        const itemView: Element = this.createItemView(item, readOnly);
        this.itemViews.set(this.getItemId(item), itemView);

        if (this.sortFunc) {
            const pos: number = this.items.sort(this.sortFunc).indexOf(item);
            this.insertChild(itemView, pos);
        } else {
            this.appendChild(itemView);
        }

        return itemView;
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
