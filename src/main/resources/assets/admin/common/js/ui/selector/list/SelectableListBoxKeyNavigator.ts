import {SelectableListBoxWrapper, SelectionMode} from './SelectableListBoxWrapper';
import {KeyBinding} from '../../KeyBinding';
import {KeyBindings} from '../../KeyBindings';
import {ListBox} from './ListBox';

export class SelectableListBoxKeyNavigator<I> {

    protected selectableWrapper: SelectableListBoxWrapper<I>;

    protected rootList: ListBox<I>;

    protected keyBindings: KeyBinding[] = [];

    protected keysBound: boolean = false;

    protected hotkeysEnabled: boolean = true;

    constructor(selectableListBoxWrapper: SelectableListBoxWrapper<I>) {
        this.selectableWrapper = selectableListBoxWrapper;
        this.rootList = selectableListBoxWrapper.getList();

        this.initKeyListeners();
    }

    protected initKeyListeners(): void {
        this.selectableWrapper.onShown(() => {
            this.enableKeys();
        });

        this.selectableWrapper.onHidden(() => {
            this.disableKeys();
        });

        if (this.selectableWrapper.isMultiSelect()) {
            this.keyBindings = [
                new KeyBinding('shift+up', this.handleKeyUpWithShift.bind(this)),
                new KeyBinding('shift+down', this.handleKeyDownWithShift.bind(this)),
            ];
        }

        this.keyBindings = this.keyBindings.concat(this.createKeyBindings());
    }

    protected createKeyBindings(): KeyBinding[] {
        return [
            new KeyBinding('up', this.handleKeyUpWithoutShift.bind(this)),
            new KeyBinding('down', this.handleKeyDownWithoutShift.bind(this)),
            new KeyBinding('left', this.onLeftKeyPress.bind(this)),
            new KeyBinding('right', this.onRightKeyPress.bind(this)),
            new KeyBinding('space', this.onSpaceKeyPress.bind(this)),
        ];
    }

    enableKeys() {
        this.hotkeysEnabled = true;
        this.bindKeys();
    }

    private bindKeys() {
        if (!this.hotkeysEnabled || this.keysBound) {
            return;
        }

        this.keysBound = true;

        KeyBindings.get().shelveBindings(this.keyBindings);
        KeyBindings.get().bindKeys(this.keyBindings);
    }

    disableKeys() {
        this.unbindKeys();
        this.hotkeysEnabled = false;
    }

    private unbindKeys() {
        if (!this.hotkeysEnabled || !this.keysBound) {
            return;
        }

        this.keysBound = false;

        KeyBindings.get().unbindKeys(this.keyBindings);
        KeyBindings.get().unshelveBindings(this.keyBindings);
    }

    protected handleKeyUpWithoutShift(event: Mousetrap.ExtendedKeyboardEvent): void {
        //if (!this.list.isActive()) {
        //  return;
        //  }

        this.selectableWrapper.setSelectionMode(SelectionMode.HIGHLIGHT);
        const lastSelectedItem = this.selectableWrapper.getSelectedItems().pop();
        const itemToSelect = this.getPreviousItem(this.rootList, lastSelectedItem);

        if (itemToSelect) {
            this.selectableWrapper.deselectAll();
            this.selectableWrapper.select(itemToSelect);
        }
    }

    protected handleKeyUpWithShift(event: Mousetrap.ExtendedKeyboardEvent): void {
        const lastSelectedItem = this.selectableWrapper.getSelectedItems().pop();

        if (!lastSelectedItem) {
            return;
        }

        const wasHighlightMode = this.selectableWrapper.getSelectionMode() === SelectionMode.HIGHLIGHT;
        this.selectableWrapper.setSelectionMode(SelectionMode.SELECT);

        if (wasHighlightMode) { // first need to set checkbox to selected if it was not checked
            this.selectableWrapper.select(lastSelectedItem);
        } else { // looking  non-selected item to select in up direction
            let itemToSelect = this.getPreviousItem(this.rootList, lastSelectedItem);

            while (itemToSelect && this.selectableWrapper.isItemSelected(itemToSelect)) {
                itemToSelect = this.getPreviousItem(this.rootList, itemToSelect);
            }

            if (itemToSelect) {
                this.selectableWrapper.select(itemToSelect);
            }
        }
    }

    getNextItem(list: ListBox<I>, item?: I): I | undefined { // Used for keyboard navigation
        if (!item) {
            return list.getItems()[0];
        }

        // using id to get the next item in case item is not fully equal to the item in the list
        const itemIndex = this.findItemIndex(list, item);
        return itemIndex === -1 ? undefined : list.getItems()[itemIndex + 1];
    }

    protected findItemIndex(list: ListBox<I>, item: I): number {
        const itemId = list.getIdOfItem(item);
        return list.getItems().findIndex((it) => list.getIdOfItem(it) === itemId);
    }

    getPreviousItem(list: ListBox<I>, item?: I): I | undefined {
        if (!item) {
            return list.getItems().pop();
        }

        const itemIndex = this.findItemIndex(list, item);
        return itemIndex === -1 ? undefined : list.getItems()[itemIndex - 1];
    }

    protected handleKeyDownWithShift(event: Mousetrap.ExtendedKeyboardEvent): void {
        const lastSelectedItem = this.selectableWrapper.getSelectedItems().pop();

        if (!lastSelectedItem) {
            return;
        }

        const wasHighlightMode = this.selectableWrapper.getSelectionMode() === SelectionMode.HIGHLIGHT;
        this.selectableWrapper.setSelectionMode(SelectionMode.SELECT);

        if (wasHighlightMode) { // first need to set checkbox to selected if it was not checked
            this.selectableWrapper.select(lastSelectedItem);
        } else { // looking next non-selected item to select
            let itemToSelect = this.getNextItem(this.rootList, lastSelectedItem);

            while (itemToSelect && this.selectableWrapper.isItemSelected(itemToSelect)) {
                itemToSelect = this.getNextItem(this.rootList, itemToSelect);
            }

            if (itemToSelect) {
                this.selectableWrapper.select(itemToSelect);
            }
        }
    }

    protected handleKeyDownWithoutShift(event: Mousetrap.ExtendedKeyboardEvent): void {
        this.selectableWrapper.setSelectionMode(SelectionMode.HIGHLIGHT);
        const lastSelectedItem = this.selectableWrapper.getSelectedItems().pop();
        const itemToSelect = this.getNextItem(this.rootList, lastSelectedItem);

        if (itemToSelect) {
            this.selectableWrapper.deselectAll();
            this.selectableWrapper.select(itemToSelect);
        }
    }

    protected onLeftKeyPress() {
        //
    }

    protected onRightKeyPress() {
        //
    }

    protected onSpaceKeyPress(event: Mousetrap.ExtendedKeyboardEvent) {
        //
    }


}