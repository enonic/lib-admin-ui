import {LazyListBox} from './LazyListBox';
import {Element} from '../../../dom/Element';
import {LiEl} from '../../../dom/LiEl';
import {ResponsiveManager} from '../../responsive/ResponsiveManager';
import {DivEl} from '../../../dom/DivEl';

export interface TreeListBoxParams<I> {
    scrollParent?: Element,
    level?: number,
    className?: string,
    parentItem?: I,
    parentList?: TreeListBox<I>,
}

export abstract class TreeListBox<I> extends LazyListBox<I> {

    protected scrollParent: Element;

    protected level: number;

    protected readonly options: TreeListBoxParams<I>;

    protected constructor(params?: TreeListBoxParams<I>) {
        super('tree-list ' + (params?.className || ''));

        this.options = params || {};

        this.initElements();
        this.initListeners();
    }

    protected initElements(): void {
        this.scrollParent = this.options?.scrollParent || this;
        this.level = this.options?.level ?? 0;
    }

    protected initListeners(): void {
        this.whenShown(() => {
            this.handleLazyLoad();
        });
    }

    protected abstract createItemView(item: I, readOnly: boolean): TreeListElement<I>;

    protected addItemView(item: I, readOnly: boolean = false): TreeListElement<I> {
        const itemView = super.addItemView(item, readOnly) as TreeListElement<I>;

        itemView.onItemsAdded((items) => this.notifyItemsAdded(items));
        itemView.onItemsRemoved((items) => this.notifyItemsRemoved(items));
        itemView.onItemsChanged((items) => this.notifyItemsChanged(items));

        return itemView;
    }

    getItemView(item: I): TreeListElement<I> {
        return super.getItemView(item) as TreeListElement<I> || this.findItemView(item);
    }

    protected findItemView(item: I): TreeListElement<I> {
        let result: TreeListElement<I> = null;

        this.itemViews.forEach((itemView: TreeListElement<I>) => {
            const value: TreeListElement<I> = itemView.findItemView(item);

            if (value) {
                result = value;
            }
        });

        return result;
    }

    getItem(id: string): I {
        return super.getItem(id) || this.findItem(id);
    }

    protected findItem(id: string): I {
        let result: I = null;

        this.itemViews.forEach((itemView: TreeListElement<I>) => {
            const item: I = itemView.findItem(id);

            if (item) {
                result = item;
            }
        });

        return result;
    }

    getItems(deep?: boolean): I[] {
        return deep ? this.getAllItems() : super.getItems();
    }

    private getAllItems(): I[] {
        const items: I[] = super.getItems();

        this.itemViews.forEach((itemView: TreeListElement<I>) => {
            items.push(...itemView.getItems(true));
        });

        return items;
    }

    getDataView(item: I): Element {
        return this.getItemView(item)?.getDataView();
    }

    addItems(toAdd: I[] | I, silent: boolean = false): void {
        const items = Array.isArray(toAdd) ? toAdd : [toAdd];

        items.forEach((item: I) => { // searching for the correct parent to add the item
            const parentList = this.findParentList(item);

            if (parentList === this) {
                super.addItems(item, silent);
            } else {
                this.getItemViews().forEach((listElement: TreeListElement<I>) => {
                    listElement.addItems(item, silent);
                });
            }
        });
    }

    replaceItems(toReplace: I | I[], append: boolean = false, silent?: boolean) {
        const items = Array.isArray(toReplace) ? toReplace : [toReplace];

        items.forEach((item: I) => {
            const itemId = this.getIdOfItem(item);

            if (this.getItems().some((i: I) => this.getIdOfItem(i) === itemId)) {
                super.replaceItems(item, append, silent);
            } else {
                this.getItemViews().forEach((listElement: TreeListElement<I>) => {
                    listElement.replaceItems(item, append, silent);
                });
            }
        });
    }

    removeItems(toRemove: I | I[], silent?: boolean): I[] {
        const removed = super.removeItems(toRemove, silent);

        this.getItemViews().forEach((listElement: TreeListElement<I>) => {
            const removedInChild = listElement.removeItems(toRemove, silent);

            if (removedInChild.length > 0) {
                removed.push(...removedInChild);
            }
        });

        return removed;
    }

    getParentList(): TreeListBox<I> | undefined {
        return this.options.parentList;
    }

    getParentItem(): I | undefined {
        return this.options.parentItem;
    }

    protected getScrollContainer(): Element {
        return this.scrollParent;
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            if (this.level === 0) {
                ResponsiveManager.onAvailableSizeChanged(this);
            }

            return rendered;
        });
    }

    findParentList(item: I): TreeListBox<I> {
        return this;
    }
}

export interface TreeListElementParams<I> {
    scrollParent: Element,
    level: number,
    parentItem?: I,
    parentList?: TreeListBox<I>,
}

export abstract class TreeListElement<I>
    extends LiEl {

    protected elementsWrapper: Element;

    protected toggleElement: Element;

    protected itemViewer: Element;

    protected childrenList: TreeListBox<I>;

    protected expanded: boolean = false;

    protected readonly item: I;

    protected readonly options: TreeListElementParams<I>;

    protected constructor(content: I, options: TreeListElementParams<I>) {
        super('tree-list-element');

        this.item = content;
        this.options = options;
        this.initElements();
        this.initListeners();
    }

    protected initElements(): void {
        this.elementsWrapper = new DivEl('toggle-and-item-wrapper');
        this.toggleElement = new DivEl(`toggle ${this.hasChildren() ? 'icon-arrow_drop_up' : ''}`);
        this.itemViewer = this.createItemViewer(this.item);
        this.childrenList = this.createChildrenList(this.createChildrenListParams());

        this.appendChild(this.elementsWrapper);
    }

    protected createChildrenListParams(): TreeListBoxParams<I> {
        return {
            scrollParent: this.options.scrollParent,
            level: this.options.level + 1,
            parentItem: this.item,
            parentList: this.options.parentList
        };
    }

    protected abstract createChildrenList(params?: TreeListBoxParams<I>): TreeListBox<I>;

    abstract hasChildren(): boolean;

    protected abstract createItemViewer(item: I): Element;

    protected initListeners(): void {
        this.toggleElement.onClicked(() => {
            this.expanded ? this.collapse() : this.expand();
        });

        this.childrenList.onItemsRemoved(() => {
            this.updateExpandedState();
        });

        this.childrenList.onItemsAdded(() => {
            this.updateExpandedState();
        });
    }

    expand(): void {
        if (!this.expanded) {
            this.setExpanded(true);
        }
    }

    collapse(): void {
        this.setExpanded(false);
    }

    setExpanded(expanded: boolean): void {
        if (this.expanded !== expanded) {
            this.expanded = expanded;
            this.childrenList.setVisible(this.expanded);
            this.toggleElement.toggleClass('expanded', this.expanded);
        }
    }

    isExpanded(): boolean {
        return this.expanded;
    }

    private updateExpandedState(): void {
        this.setExpanded(this.hasChildren());
        this.toggleElement.toggleClass('icon-arrow_drop_up', this.expanded);
    }

    getDataView(): Element {
        return this.elementsWrapper;
    }

    findItemView(item: I): TreeListElement<I> {
        return this.childrenList.getItemView(item);
    }

    findItem(id: string): I {
        return this.childrenList.getItem(id);
    }

    getItem(): I {
        return this.item;
    }

    removeItems(toRemove: I | I[], silent?: boolean): I[] {
        return this.childrenList.removeItems(toRemove, silent);
    }

    replaceItems(items: I | I[], append: boolean = false, silent?: boolean): void {
        this.childrenList.replaceItems(items, append, silent);
    }

    addItems(items: I[] | I, silent: boolean = false): void {
        this.childrenList.addItems(items, silent);
    }

    getItems(deep?: boolean): I[] {
        return this.childrenList.getItems(deep);
    }

    onItemsAdded(handler: (items: I[]) => void): void {
        this.childrenList.onItemsAdded(handler);
    }

    onItemsRemoved(handler: (items: I[]) => void): void {
        this.childrenList.onItemsRemoved(handler);
    }

    onItemsChanged(handler: (items: I[]) => void): void {
        this.childrenList.onItemsChanged(handler);
    }

    getList(): TreeListBox<I> {
        return this.childrenList;
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.childrenList.hide();

            this.elementsWrapper.appendChildren(this.toggleElement, this.itemViewer);
            this.elementsWrapper.getEl().setPaddingLeft(`${this.options.level * 24}px`);
            this.appendChild(this.childrenList);

            return rendered;
        });
    }
}
