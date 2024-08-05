import {SelectableListBoxKeyNavigator} from './SelectableListBoxKeyNavigator';
import {TreeListBox} from './TreeListBox';
import {SelectionMode} from './SelectableListBoxWrapper';

export class SelectableTreeListBoxKeyNavigator<I> extends SelectableListBoxKeyNavigator<I> {

    protected rootList: TreeListBox<I>;

    getNextItem(list: TreeListBox<I>, item?: I, flat?: boolean): I | undefined {
        if (!item) {
            return list.getItems()[0];
        }

        const isItemInThisList = this.findItemIndex(list, item) !== -1;

        if (isItemInThisList) {
            const treeListElement = list.getItemView(item);

            if (!flat && treeListElement?.hasChildren() && treeListElement.isExpanded()) {
                return treeListElement.getItems()[0];
            }

            return super.getNextItem(list, item) || this.getNextItemInParentList(list);
        }

        const parentList = list.findParentList(item);

        return parentList ? this.getNextItem(parentList, item) : undefined;
    }

    private getNextItemInParentList(list: TreeListBox<I>): I | undefined {
        if (list.getParentList()) {
            return this.getNextItem(list.getParentList(), list.getParentItem(), true);
        }

        return undefined;
    }


    getPreviousItem(list: TreeListBox<I>, item?: I): I | undefined {
        if (!item) {
            return list.getItems()[0];
        }

        const isItemInThisList = this.findItemIndex(list, item) !== -1;

        if (isItemInThisList) {
            const previousItem = super.getPreviousItem(list, item);
            return previousItem ? this.getLastAvailableItem(list, previousItem) : list.getParentItem();
        }

        const parentList = list.findParentList(item);

        return parentList ? this.getPreviousItem(parentList, item) : undefined;
    }

    private getLastAvailableItem(list: TreeListBox<I>, item: I): I | undefined {
        const listElement = list.getItemView(item);

        if (listElement.isExpanded() && listElement.hasChildren()) {
            const lastChild = listElement.getItems().pop();
            return this.getLastAvailableItem(listElement.getList(), lastChild);
        }

        return item;
    }

    protected onLeftKeyPress(): void {
        const lastSelectedItem  = this.selectableWrapper.getSelectedItems().pop();

        if (lastSelectedItem) {
            const listElement = this.rootList.getItemView(lastSelectedItem);

            if (listElement?.isExpanded()) {
                listElement.collapse();
            }
        }
    }

    protected onRightKeyPress(): void {
        const lastSelectedItem  = this.selectableWrapper.getSelectedItems().pop();

        if (lastSelectedItem) {
            const listElement = this.rootList.getItemView(lastSelectedItem);

            if (listElement && !listElement.isExpanded()) {
                listElement.expand();
            }
        }
    }

    protected onSpaceKeyPress(event: Mousetrap.ExtendedKeyboardEvent): void {
        const lastSelectedItem  = this.selectableWrapper.getSelectedItems().pop();

        if (lastSelectedItem) {
            event.preventDefault();

            this.selectableWrapper.setSelectionMode(
                this.selectableWrapper.getSelectionMode() === SelectionMode.HIGHLIGHT ? SelectionMode.SELECT : SelectionMode.HIGHLIGHT);
            this.selectableWrapper.select(lastSelectedItem);
        }
    }
}
