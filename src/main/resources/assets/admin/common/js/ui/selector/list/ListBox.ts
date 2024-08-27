import {UlEl} from '../../../dom/UlEl';
import {Element} from '../../../dom/Element';
import {DivEl} from '../../../dom/DivEl';
import {H5El} from '../../../dom/H5El';

export abstract class ListBox<I>
    extends UlEl {

    private items: I[] = [];

    protected itemViews: Map<string, Element> = new Map<string, Element>();

    private itemsAddedListeners: ((items: I[], itemViews: Element[]) => void)[] = [];
    private itemsRemovedListeners: ((items: I[]) => void)[] = [];
    private itemsChangedListeners: ((items: I[]) => void)[] = [];

    private emptyText: string;
    private emptyView: DivEl;

    constructor(className?: string) {
        super(className);
    }

    public setReadOnly(value: boolean): void {
        this.toggleClass('readonly', value);
    }

    setEmptyText(text: string): void {
        this.emptyText = text;

        if (this.emptyView) {
            this.emptyView.setHtml(text);
        }
    }

    setItems(items: I[], silent?: boolean): void {
        this.clearItems(silent);
        this.items = items;
        const itemViews = this.layoutList();

        if (items.length > 0 && !silent) {
            this.notifyItemsAdded(items, itemViews);
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
        this.showEmptyView();
    }

    addItems(toAdd: I | I[], silent: boolean = false, index: number = -1): void {
        const items = Array.isArray(toAdd) ? toAdd : [toAdd];
        this.doAddItem(false, items, silent, index);
    }

    removeItems(toRemove: I | I[], silent?: boolean): I[] {
        const itemsToRemove = Array.isArray(toRemove) ? toRemove : [toRemove];
        const itemsRemoved: I[] = this.doRemoveItems(itemsToRemove);

        if (itemsRemoved.length > 0) {
            if (!silent) {
                this.notifyItemsRemoved(itemsRemoved);
            }

            if (this.getItemCount() === 0) {
                this.showEmptyView();
            }
        }

        return itemsRemoved;
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

    replaceItems(toReplace: I | I[], append: boolean = false, silent?: boolean): void {
        const items = Array.isArray(toReplace) ? toReplace : [toReplace];
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

    getItemCount(): number {
        return this.items.length;
    }

    getItemView(item: I): Element {
        return this.itemViews.get(this.getItemId(item));
    }

    getItemViews(): Element[] {
        return Array.from(this.itemViews.values());
    }

    refreshList(): void {
        this.removeChildren();
        this.layoutList();
    }

    findItemIndex(item: I): number {
        const itemId = this.getItemId(item);
        return this.items.findIndex((it) => this.getItemId(it) === itemId);
    }

    public onItemsAdded(listener: (items: I[], itemViews?: Element[]) => void): void {
        this.itemsAddedListeners.push(listener);
    }

    public unItemsAdded(listener: (items: I[]) => void): void {
        this.itemsAddedListeners = this.itemsAddedListeners.filter((current) => {
            return current !== listener;
        });
    }

    public onItemsRemoved(listener: (items: I[]) => void): void {
        this.itemsRemovedListeners.push(listener);
    }

    public unItemsRemoved(listener: (items: I[]) => void): void {
        this.itemsRemovedListeners = this.itemsRemovedListeners.filter((current) => {
            return current !== listener;
        });
    }

    public onItemsChanged(listener: (items: I[]) => void): void {
        this.itemsChangedListeners.push(listener);
    }

    public unItemsChanged(listener: (items: I[]) => void): void {
        this.itemsChangedListeners = this.itemsChangedListeners.filter((current) => {
            return current !== listener;
        });
    }

    protected abstract createItemView(_item: I, _readOnly: boolean): Element;

    protected updateItemView(_itemView: Element, _item: I) {
        // override to update item view when data item has been changed
    }

    protected abstract getItemId(_item: I): string;

    // public method to not break compatibility by removing 'protected' from getItemId()
    public getIdOfItem(item: I): string {
        return this.getItemId(item);
    }

    protected createEmptyView(text: string): Element {
        const view = new H5El('empty-list-item');
        view.setHtml(text);
        return view;
    }

    private doAddItem(readOnly: boolean, items: I[], silent: boolean = false, index: number = -1): void {
        if (this.getItemCount() === 0) {
            this.removeEmptyView();
        }

        if (index > -1) {
            this.items.splice(index, 0, ...items);
        } else {
            this.items = this.items.concat(items);
        }

        const itemViews = items.map((item: I) => this.addItemView(item, readOnly, index));

        if (items.length > 0 && !silent) {
            this.notifyItemsAdded(items, itemViews);
        }
    }

    private layoutList(): Element[] {
        if (this.items.length > 0) {
            this.removeEmptyView();
            return this.items.map((item: I) => this.addItemView(item));
        }

        this.showEmptyView();
        return [];
    }

    protected removeItemView(item: I): void {
        const id: string = this.getItemId(item);
        const itemView: Element = this.itemViews.get(id);

        if (itemView) {
            this.removeChild(itemView);
            this.itemViews.delete(id);
        }
    }

    protected addItemView(item: I, readOnly: boolean = false, index: number = -1): Element {
        const itemView: Element = this.createItemView(item, readOnly);
        this.itemViews.set(this.getItemId(item), itemView);
        this.insertItemView(itemView, index);

        return itemView;
    }

    protected insertItemView(itemView: Element, index: number = -1): void {
        if (index > -1) {
            this.insertChild(itemView, index);
        } else {
            this.appendChild(itemView);
        }
    }

    private showEmptyView(): void {
        if (!this.emptyText) {
            return;
        }

        if (!this.emptyView) {
            this.emptyView = this.createEmptyView(this.emptyText);
        }

        if (!this.hasChild(this.emptyView)) {
            this.appendChild(this.emptyView);
        }
    }

    private removeEmptyView(): void {
        if (this.emptyView) {
            this.removeChild(this.emptyView);
        }
    }

    protected notifyItemsAdded(items: I[], itemViews: Element[]): void {
        this.itemsAddedListeners.forEach((listener) => {
            listener(items, itemViews);
        });
    }

    protected notifyItemsRemoved(items: I[]): void {
        this.itemsRemovedListeners.forEach((listener) => {
            listener(items);
        });
    }

    protected notifyItemsChanged(items: I[]): void {
        this.itemsChangedListeners.forEach((listener) => {
            listener(items);
        });
    }
}
