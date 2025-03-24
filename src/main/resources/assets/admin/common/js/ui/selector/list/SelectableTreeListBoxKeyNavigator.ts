import {SelectableListBoxKeyNavigator} from './SelectableListBoxKeyNavigator';
import {TreeListBox} from './TreeListBox';
import {SelectionMode} from './SelectableListBoxWrapper';

export class SelectableTreeListBoxKeyNavigator<I> extends SelectableListBoxKeyNavigator<I> {

    protected rootList: TreeListBox<I>;

    getNextItem(item: I, flat?: boolean): I | undefined {
        const treeListElement = this.rootList.getItemView(item);

        // If the item is expanded and has children, return the first child
        if (!flat && treeListElement?.hasChildren() && treeListElement.isExpanded()) {
            const nextItem = treeListElement.getItems()[0];

            if (nextItem) {
                return nextItem;
            }
        }

        const parentList = treeListElement?.getParentList();

        // Return next item to this one in parent list, if the item is the last in the list, return the next item in the parent list etc.
        if (parentList) {
            return super.getNextItemInTheList(parentList, item) ||
                   (parentList.getParentItem() ? this.getNextItem(parentList.getParentItem(), true) : undefined);
        }

        return undefined;
    }

    getPreviousItem(item?: I): I | undefined {
        const treeListElement = this.rootList.getItemView(item);

        const parentList = treeListElement?.getParentList();

        if (parentList) {
            const previousItem = super.getPreviousItemInTheList(parentList, item);
            return previousItem ? this.getLastAvailableItem(parentList, previousItem) : parentList.getParentItem();
        }

        return undefined;
    }

    private getLastAvailableItem(list: TreeListBox<I>, item: I): I | undefined {
        const listElement = list.getItemView(item);

        if (listElement.isExpanded() && listElement.hasChildren()) {
            const lastChild = listElement.getItems().pop();

            if (lastChild) {
                return this.getLastAvailableItem(listElement.getList(), lastChild);
            }
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
