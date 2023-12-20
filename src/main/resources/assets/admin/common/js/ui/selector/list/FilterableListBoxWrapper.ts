import {ListBox} from './ListBox';
import {OptionFilterInput} from '../OptionFilterInput';
import {DropdownHandle} from '../../button/DropdownHandle';
import {DivEl} from '../../../dom/DivEl';
import {Element} from '../../../dom/Element';
import {ValueChangedEvent} from '../../../ValueChangedEvent';
import {KeyHelper} from '../../KeyHelper';
import {SelectableListBoxWrapper, SelectableListBoxDropdownOptions} from './SelectableListBoxWrapper';
import {Button} from '../../button/Button';
import {i18n} from '../../../util/Messages';
import {Body} from '../../../dom/Body';
import {KeyBinding} from '../../KeyBinding';
import {ExtendedKeyboardEvent} from 'mousetrap';
import {KeyBindings} from '../../KeyBindings';
import {SelectionChange} from '../../../util/SelectionChange';

export interface FilterableListBoxOptions<I>
    extends SelectableListBoxDropdownOptions<I> {
    filter?: (item: I, searchString: string) => boolean;
}

export class FilterableListBoxWrapper<I>
    extends SelectableListBoxWrapper<I> {

    protected readonly listBox: ListBox<I>;

    protected options: FilterableListBoxOptions<I>;

    protected optionFilterInput: OptionFilterInput;

    protected selectionDelta = new Map<string, boolean>();

    protected applyButton: Button;

    protected dropdownHandle: DropdownHandle;

    protected dropdownVisibilityChangedListeners: ((isVisible: boolean) => void)[];

    protected dropdownShown: boolean = false;

    constructor(listBox: ListBox<I>, options?: FilterableListBoxOptions<I>) {
        super(listBox, options);
    }

    protected initElements(): void {
        super.initElements();

        this.dropdownVisibilityChangedListeners = [];
        this.optionFilterInput = new OptionFilterInput();
        this.dropdownHandle = new DropdownHandle();
        this.applyButton = new Button(i18n('action.ok'));
        this.applyButton.hide();
    }

    protected initListeners(): void {
        super.initListeners();

        this.addKeyboardNavigation();

        this.applyButton.onClicked(this.applySelection.bind(this));

        this.dropdownHandle.onClicked(() => {
            this.dropdownHandle.toggle();

            if (this.dropdownHandle.isDown()) {
                this.showDropdown();
            } else {
                this.hideDropdown();
            }
        });

        this.optionFilterInput.onValueChanged((event: ValueChangedEvent) => {
            this.handleValueChange(event);
        });

        this.optionFilterInput.onKeyDown((event: KeyboardEvent) => {
            this.handleKeyDown(event);
        });

        this.listenClickOutside();
    }

    protected showDropdown(): void {
        this.dropdownHandle.down();
        this.dropdownShown = true;
        this.doShowDropdown();
        this.notifyDropdownVisibilityChanged(true);
    }

    protected doShowDropdown(): void {
        this.listBox.show();
    }

    protected hideDropdown(): void {
        this.dropdownHandle.up();
        this.applyButton.hide();
        this.dropdownShown = false;
        this.doHideDropdown();
        this.notifyDropdownVisibilityChanged(false);
    }

    protected doHideDropdown(): void {
        this.listBox.hide();
    }

    protected listenClickOutside(): void {
        const mouseClickListener: (event: MouseEvent) => void = (event: MouseEvent) => {
            for (let element = event.target; element; element = (element as any).parentNode) {
                if (element === this.getHTMLElement()) {
                    return;
                }
            }
            this.hideDropdown();
        };

        this.onDropdownVisibilityChanged((isVisible: boolean) => {
            if (isVisible) {
                Body.get().onMouseDown(mouseClickListener);
            } else {
                Body.get().unMouseDown(mouseClickListener);
            }
        });
    }

    private addKeyboardNavigation(): void {
        let isShowListBoxEvent: boolean = false;

        const navigationKeyBindings = [
            new KeyBinding('esc').setGlobal(true).setCallback(this.handleClickOutside.bind(this)),
            new KeyBinding('up').setGlobal(true).setCallback((e: ExtendedKeyboardEvent) => {
                e.stopPropagation();
                this.focusPrevious();
                return false;
            }),
            new KeyBinding('down').setGlobal(true).setCallback(() => {
                if (!isShowListBoxEvent) {
                    this.focusNext();
                }
                return false;
            }),
            new KeyBinding('enter').setGlobal(true).setCallback(() => {
                this.handlerEnterPressed();
                return false;
            }),
        ];

        if (!this.isMultiSelect()) { // when multiple is on then space works for checkboxes automatically
            const spaceKeyBinding: KeyBinding = new KeyBinding('space')
                .setGlobal(true)
                .setCallback(() => {
                    const focusedItem: I = this.getFocusedItem();

                    if (focusedItem) {
                        this.toggleSelection(focusedItem, this.isItemSelected(focusedItem));
                    }
                    return false;
                });

            navigationKeyBindings.push(spaceKeyBinding);
        }

        this.listBox.onShown(() => {
            this.selectionDelta = new Map();
            isShowListBoxEvent = true;
            KeyBindings.get().shelveBindings();
            KeyBindings.get().bindKeys(navigationKeyBindings);

            setTimeout(() => { // if open by arrow key then wait for event to finish
                isShowListBoxEvent = false;
            }, 1);
        });

        this.listBox.onHidden(() => {
            this.resetSelection();
            this.selectionDelta = new Map();
            KeyBindings.get().unbindKeys(navigationKeyBindings);
            KeyBindings.get().unshelveBindings();
        });
    }

    protected resetSelection(): void {
        this.selectionDelta.forEach((value: boolean, id: string) => {
            this.toggleItemWrapperSelected(id, !value);
        });

        this.selectionDelta = new Map();
    }

    protected handleValueChange(event: ValueChangedEvent): void {
        this.showDropdown();

        if (this.options.filter) {
            this.filterItems(event.getNewValue());
        }
    }

    protected filterItems(searchString: string): void {
        this.listBox.getItems().forEach((item: I) => {
            this.filterItem(item, searchString);
        });
    }

    protected filterItem(item: I, searchString: string): void {
        this.itemsWrappers.get(this.listBox.getIdOfItem(item))?.setVisible(this.options.filter(item, searchString));
    }

    protected handleKeyDown(event: KeyboardEvent): void {
        if (!this.listBox.isVisible() && KeyHelper.isArrowDownKey(event)) {
            this.listBox.setVisible(true);
        }
    }

    protected handlerEnterPressed(): void {
        if (this.applyButton.hasFocus()) {
            this.applySelection();
            return;
        }

        const focusedItem: I = this.getFocusedItem();

        if (focusedItem) {
            if (this.selectionDelta.size === 0) {
                if (this.isItemSelected(focusedItem)) {
                    this.deselect(focusedItem);
                } else {
                    this.select(focusedItem);
                }
            }

            this.applySelection();
        }
    }

    protected handleClickOutside(): void {
        this.dropdownHandle.up();
        this.applyButton.hide();
        this.listBox.hide();
    }

    handleUserSelected(item: I): void {
        const id: string = this.listBox.getIdOfItem(item);
        this.toggleItemWrapperSelected(id, true);

        if (super.isSelected(id)) {
            this.selectionDelta.delete(id);
        } else {
            this.selectionDelta.set(id, true);
        }

        this.applyButton.setVisible(this.selectionDelta.size > 0);
    }

    handleUserDeselected(item: I): void {
        const id: string = this.listBox.getIdOfItem(item);
        this.toggleItemWrapperSelected(id, false);

        if (super.isSelected(id)) {
            this.selectionDelta.set(id, false);
        } else {
            this.selectionDelta.delete(id);
        }

        this.applyButton.setVisible(this.selectionDelta.size > 0);
    }

    protected isSelected(id: string): boolean {
        return this.selectionDelta.has(id) ? this.selectionDelta.get(id) : super.isSelected(id);
    }

    protected getCurrentlySelectedItems(): I[] {
        return super.getCurrentlySelectedItems()
            .filter((savedItem: I) => this.isItemSelected(savedItem))
            .concat(this.getSelectedDeltaItems());
    }

    private getSelectedDeltaItems(): I[] {
        const result: I[] = [];

        this.selectionDelta.forEach((isSelected: boolean, id: string) => {
            const item: I = this.listBox.getItem(id);

            if (isSelected) {
                result.push(item);
            }
        });

        return result;
    }

    protected applySelection(): void {
        const selectionChange: SelectionChange<I> = {selected: [], deselected: []};

        this.selectionDelta.forEach((isSelected: boolean, id: string) => {
            const item: I = this.getItemById(id);

            if (isSelected) {
                selectionChange.selected.push(item);
                this.selectedItems.set(id, item);
            } else {
                selectionChange.deselected.push(item);
                this.selectedItems.delete(id);
            }
        });

        this.selectionDelta = new Map();
        this.listBox.hide();
        this.dropdownHandle.up();

        Array.from(this.itemsWrappers.values()).forEach((itemWrapper: Element) => itemWrapper.setVisible(true));

        if (selectionChange.selected.length > 0 || selectionChange.deselected.length > 0) {
            this.notifySelectionChanged(selectionChange);
        }

        this.applyButton.hide();
        this.optionFilterInput.setValue('', true);
    }

    protected getItemById(id: string): I {
        return this.listBox.getItem(id);
    }

    private focusNext(): void {
        const focusedItemIndex: number = this.getFocusedItemIndex();
        const arrayAfterFocusedItem: Element[] = focusedItemIndex > -1 ? this.listBox.getChildren().slice(focusedItemIndex + 1) : [];
        const arrayToLookForItemToFocus: Element[] = arrayAfterFocusedItem.concat(this.listBox.getChildren());
        this.focusFirstAvailableItem(arrayToLookForItemToFocus);
    }

    private focusFirstAvailableItem(items: Element[]): void {
        items.filter((el: Element) => el.isVisible()).some((itemWrapper: Element) => {
            return this.isMultiSelect() ? itemWrapper.getFirstChild().giveFocus() : itemWrapper.giveFocus();
        });
    }

    private focusPrevious(): void {
        const focusedItemIndex: number = this.getFocusedItemIndex();
        const arrayBeforeFocusedItem: Element[] = focusedItemIndex > -1 ? this.listBox.getChildren().slice(0, focusedItemIndex) : [];
        const arrayToLookForItemToFocus: Element[] =
            arrayBeforeFocusedItem.reverse().concat(this.listBox.getChildren().slice().reverse());
        this.focusFirstAvailableItem(arrayToLookForItemToFocus);
    }

    private getFocusedItemIndex(): number {
        let focusedItemIndex: number = -1;

        this.listBox.getChildren().find((itemWrapper: Element, index: number) => {
            focusedItemIndex = index;
            const elemToCheck: HTMLElement = this.isMultiSelect() ? itemWrapper.getFirstChild()?.getFirstChild()?.getHTMLElement() :
                                             itemWrapper.getHTMLElement();
            return elemToCheck === document.activeElement;
        });

        return focusedItemIndex;
    }

    private getFocusedItem(): I {
        let focusedItem: I = null;

        this.itemsWrappers.forEach((itemWrapper: Element, key: string) => {
            const elemToCheck: HTMLElement =
                this.isMultiSelect() ? itemWrapper.getFirstChild()?.getFirstChild()?.getHTMLElement() : itemWrapper.getHTMLElement();

            if (elemToCheck === document.activeElement) {
                focusedItem = this.listBox.getItem(key);
            }
        });

        return focusedItem;
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass('filterable-listbox-wrapper');
            this.listBox.addClass('filterable-listbox');
            const filterContainer: DivEl = new DivEl('filter-container');
            filterContainer.appendChildren(this.optionFilterInput, this.dropdownHandle as Element);
            this.appendChildren(filterContainer, this.listBox);

            this.applyButton.addClass('apply-selection-button');
            this.applyButton.insertAfterEl(this.optionFilterInput);

            return rendered;
        });
    }

    setEnabled(enable: boolean): void {
        this.optionFilterInput.setEnabled(enable);
        this.dropdownHandle.setEnabled(enable);
    }

    onFocus(listener: (event: FocusEvent) => void) {
        this.optionFilterInput.onFocus(listener);
    }

    unFocus(listener: (event: FocusEvent) => void) {
        this.optionFilterInput.unFocus(listener);
    }

    onBlur(listener: (event: FocusEvent) => void) {
        this.optionFilterInput.onBlur(listener);
    }

    unBlur(listener: (event: FocusEvent) => void) {
        this.optionFilterInput.unBlur(listener);
    }

    giveFocus(): boolean {
        return this.optionFilterInput.giveFocus();
    }

    notifyDropdownVisibilityChanged(isVisible: boolean): void {
        this.dropdownVisibilityChangedListeners.forEach((listener: (isVisible: boolean) => void) => {
            listener(isVisible);
        });
    }

    onDropdownVisibilityChanged(listener: (isVisible: boolean) => void): void {
        this.dropdownVisibilityChangedListeners.push(listener);
    }

    unDropdownVisibilityChanged(listener: (isVisible: boolean) => void): void {
        this.dropdownVisibilityChangedListeners = this.dropdownVisibilityChangedListeners
            .filter((currentListener: (isVisible: boolean) => void) => currentListener !== listener);
    }

    isDropdownShown(): boolean {
        return this.dropdownShown;
    }
}
