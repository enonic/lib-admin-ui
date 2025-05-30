import {LazyListBox} from './LazyListBox';
import {Element} from '../../../dom/Element';
import {LiEl} from '../../../dom/LiEl';
import {ResponsiveManager} from '../../responsive/ResponsiveManager';
import {DivEl} from '../../../dom/DivEl';

export interface TreeListBoxParams<I> {
    scrollParent?: Element,
    className?: string,
    parentListElement?: TreeListElement<I>,
    expandedContext?: TreeListBoxExpandedHolder,
}

export abstract class TreeListBox<I> extends LazyListBox<I> {

    protected scrollParent: Element;

    protected readonly options: TreeListBoxParams<I>;

    protected constructor(params?: TreeListBoxParams<I>) {
        super('tree-list ' + (params?.className || ''));

        this.options = params || {};

        this.initElements();
        this.initListeners();
    }

    protected initElements(): void {
        this.scrollParent = this.options?.scrollParent || this;
    }

    protected initListeners(): void {
        //
    }

    protected abstract createItemView(item: I, readOnly: boolean): TreeListElement<I>;

    protected updateItemView(itemView: TreeListElement<I>, item: I): void {
        itemView.setItem(item);
    }

    protected addItemView(item: I, readOnly: boolean = false, index: number = -1): TreeListElement<I> {
        const itemView = super.addItemView(item, readOnly, index) as TreeListElement<I>;

        itemView.onItemsAdded((items, itemViews) => this.notifyItemsAdded(items, itemViews));
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

    load(): void {
        this.handleLazyLoad();
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

    getParentList(): TreeListBox<I> | undefined {
        return this.getParentListElement()?.getParentList();
    }

    getParentItem(): I | undefined {
        return this.getParentListElement()?.getItem();
    }

    getParentListElement(): TreeListElement<I> | undefined {
        return this.options.parentListElement;
    }

    protected getScrollContainer(): Element {
        return this.scrollParent;
    }

    getLevel(): number {
        const parent = this.getParentList();
        return parent ? parent.getLevel() + 1 : 0;
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            const level = this.getLevel();

            if (level === 0) {
                ResponsiveManager.onAvailableSizeChanged(this);
            }

            this.getEl().setData('level', level.toString());

            return rendered;
        });
    }
}

export interface TreeListElementParams<I> {
    scrollParent: Element,
    parentItem?: I,
    parentList: TreeListBox<I>,
    expandedContext?: TreeListBoxExpandedHolder,
}

export abstract class TreeListElement<I>
    extends LiEl {

    protected elementsWrapper: Element;

    protected toggleElement: Element;

    protected itemViewer: Element;

    protected childrenList: TreeListBox<I>;

    protected expanded: boolean;

    protected wasExpanded: boolean;

    protected item: I;

    protected readonly options: TreeListElementParams<I>;

    protected constructor(content: I, options: TreeListElementParams<I>) {
        super('tree-list-element');

        this.item = content;
        this.options = options;
        this.expanded = false;
        this.wasExpanded = false;
        this.initElements();
        this.initListeners();
    }

    protected initElements(): void {
        this.elementsWrapper = new DivEl('toggle-and-item-wrapper');
        this.toggleElement = new DivEl('toggle');
        this.itemViewer = this.createItemViewer(this.item);
        this.childrenList = this.createChildrenList(this.createChildrenListParams());

        this.updateExpandableState();
        this.appendChild(this.elementsWrapper);
    }

    protected createChildrenListParams(): TreeListBoxParams<I> {
        return {
            scrollParent: this.options.scrollParent,
            parentListElement: this,
            expandedContext: this.options.expandedContext,
        };
    }

    protected abstract createChildrenList(params?: TreeListBoxParams<I>): TreeListBox<I>;

    abstract hasChildren(): boolean;

    protected abstract createItemViewer(item: I): Element;

    protected initListeners(): void {
        this.toggleElement.onClicked(() => {
            if (this.expanded) {
                this.collapse();
            } else {
                this.expand();
            }
        });

        this.childrenList.onItemsRemoved(() => {
            this.updateExpandableState();
        });

        this.childrenList.onItemsAdded(() => {
            this.updateExpandableState();
        });
    }

    expand(): void {
        this.setExpanded(true);
    }

    collapse(): void {
        this.setExpanded(false);
    }

    protected setExpanded(expanded: boolean): void {
        if (this.expanded !== expanded) {
            const itemId = this.getParentList()?.getIdOfItem(this.item);

            if (expanded) {
                this.options.expandedContext?.add(itemId);
            } else  {
                this.options.expandedContext?.remove(itemId);
            }

            this.expanded = expanded;
            this.childrenList.setVisible(this.expanded);
            this.toggleElement.toggleClass('expanded', this.expanded);


            if (expanded && !this.wasExpanded) {
                this.wasExpanded = true;
                this.childrenList.load();
            }
        }
    }

    isExpanded(): boolean {
        return this.expanded;
    }

    isExpandedAtLeastOnce(): boolean {
        return this.wasExpanded;
    }

    updateExpandableState(): void {
        this.toggleElement.toggleClass('icon-arrow_drop_up', this.hasChildren());
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

    setItem(item: I): void {
        this.item = item;
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

    onItemsAdded(handler: (items: I[], itemViews: Element[]) => void): void {
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

    getParentList(): TreeListBox<I> {
        return this.options.parentList;
    }

    getLevel(): number {
        return this.getParentList()?.getLevel() ?? 0;
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.childrenList.hide();

            this.elementsWrapper.appendChildren(this.toggleElement, this.itemViewer);
            this.appendChild(this.childrenList);

            return rendered;
        });
    }
}

export class TreeListBoxExpandedHolder {

    protected expandedIds: Set<string>;

    constructor() {
        this.expandedIds = new Set<string>();
    }

    add(ids: string | string[]): void {
        const items = Array.isArray(ids) ? ids : [ids];
        items.filter(id => !!id).forEach((id: string) => this.expandedIds.add(id));
    }

    remove(ids: string | string[]): void {
        const items = Array.isArray(ids) ? ids : [ids];
        items.filter(id => !!id).forEach((id: string) => this.expandedIds.delete(id));
    }

    isExpanded(id: string): boolean {
        return this.expandedIds.has(id);
    }

    reset(): void {
        this.expandedIds.clear();
    }

}
