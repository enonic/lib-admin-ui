import {ListBox} from './ListBox';
import {OptionFilterInput} from '../OptionFilterInput';
import {DropdownHandle} from '../../button/DropdownHandle';
import {DivEl} from '../../../dom/DivEl';
import {Element} from '../../../dom/Element';
import {ValueChangedEvent} from '../../../ValueChangedEvent';
import {KeyHelper} from '../../KeyHelper';
import {SelectableListBoxDropdownOptions, SelectableListBoxWrapper} from './SelectableListBoxWrapper';
import {Button} from '../../button/Button';
import {i18n} from '../../../util/Messages';
import {Body} from '../../../dom/Body';
import {SelectionChange} from '../../../util/SelectionChange';
import {LoadMask} from '../../mask/LoadMask';
import {SelectableListBoxNavigator} from './SelectableListBoxNavigator';
import {AriaHasPopup, AriaRole} from '../../WCAG';

export interface FilterableListBoxOptions<I>
    extends SelectableListBoxDropdownOptions<I> {
    filter?: (item: I, searchString: string) => boolean;
    loadWhenListShown?: boolean;
}

export interface SelectionDeltaItem<I> {
    item: I,
    selected: boolean
}

export class FilterableListBoxWrapper<I>
    extends SelectableListBoxWrapper<I> {

    protected options: FilterableListBoxOptions<I>;

    protected optionFilterInput: OptionFilterInput;

    protected filterContainer: Element;

    protected selectionDelta = new Map<string, SelectionDeltaItem<I>>();

    protected applyButton: Button;

    protected dropdownHandle: DropdownHandle;

    protected dropdownVisibilityChangedListeners: ((isVisible: boolean) => void)[];

    protected dropdownShown: boolean = false;

    protected loadMask: LoadMask;

    protected loadWhenListShown: boolean;

    protected selectionNavigator?: SelectableListBoxNavigator<I>;

    protected filterAndListContainer: Element;

    constructor(listBox: ListBox<I>, options?: FilterableListBoxOptions<I>) {
        super(listBox, options);

        this.applyWCAGAttributes({
            role: AriaRole.COMBOBOX,
            ariaHasPopup: AriaHasPopup.LISTBOX,
            ariaExpanded: false
        });
    }

    protected initElements(): void {
        super.initElements();

        this.loadWhenListShown = this.options.loadWhenListShown ?? true;
        this.loadMask = new LoadMask(this);

        this.listBox.applyWCAGAttributes({
            role: AriaRole.LISTBOX,
            ariaHidden: true
        });

        this.listBox.hide();

        this.filterContainer = new DivEl('filter-container');
        this.filterAndListContainer = new DivEl('filter-and-list-container');

        this.dropdownVisibilityChangedListeners = [];
        this.optionFilterInput = new OptionFilterInput();
        this.dropdownHandle = new DropdownHandle();
        this.applyButton = new Button(i18n('action.apply'));
        this.applyButton.hide();
        this.handleEmptyList();
    }

    protected handleEmptyList(): void {
        this.listBox.setEmptyText(i18n('field.option.noitems'));
    }

    protected initListeners(): void {
        super.initListeners();

        this.listBox.onShown(() => {
            this.selectionDelta = new Map();
            this.setAriaExpanded(true);
            this.listBox.setAriaHidden(false);
        });

        this.listBox.onHidden(() => {
            this.resetSelection();
            this.selectionDelta = new Map();
            this.setAriaExpanded(false);
            this.listBox.setAriaHidden(true);
        });

        this.applyButton.onClicked(this.applySelection.bind(this));

        this.dropdownHandle.onClicked(() => {
            this.handleDropdownHandleClicked();
        });

        this.optionFilterInput.onValueChanged((event: ValueChangedEvent) => {
            this.handleValueChange(event);
        });

        this.optionFilterInput.onKeyDown((event: KeyboardEvent) => {
            this.handleKeyDown(event);
        });

        this.listenClickOutside();

        this.addKeyNavigation();
    }

    protected showDropdown(): void {
        this.dropdownHandle.down();
        this.dropdownShown = true;
        this.doShowDropdown();
        this.notifyDropdownVisibilityChanged(true);
    }

    protected doShowDropdown(): void {
        if (!this.filterAndListContainer.hasChild(this.listBox)) {
            this.attachListBoxOnShown();
        }

        this.listBox.show();

        if (this.loadWhenListShown) {
            this.loadListOnShown();
            this.loadWhenListShown = false;
        }
    }

    protected attachListBoxOnShown(): void {
        this.filterAndListContainer.appendChild(this.listBox);
    }

    protected loadListOnShown(): void {
        //
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
        this.listBox.remove();
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

    protected resetSelection(): void {
        this.selectionDelta.forEach((value: SelectionDeltaItem<I>, id: string) => {
            this.toggleItemWrapperSelected(id, !value.selected);
        });

        this.selectionDelta = new Map();
    }

    protected handleValueChange(event: ValueChangedEvent): void {
        this.showDropdown();

        if (this.options.filter) {
            this.filterItems(event.getNewValue());

        }
    }

    protected handleDropdownHandleClicked(): void {
        this.dropdownHandle.toggle();

        if (this.dropdownHandle.isDown()) {
            this.showDropdown();
        } else {
            this.hideDropdown();
        }
    }

    protected filterItems(searchString: string): void {
        this.listBox.getItems().forEach((item: I) => {
            this.filterItem(item, searchString);
        });

        let visible = 0;
        this.itemsWrappers.forEach((itemWrappers: Element[]) => {
            if (itemWrappers.some((itemWrapper: Element) => itemWrapper.isVisible())) {
                visible++;
            }
        });

        if (visible > 0) {
            this.listBox.removeEmptyView();
        } else {
            this.listBox.showEmptyView();
        }
    }

    protected filterItem(item: I, searchString: string): void {
        this.itemsWrappers.get(this.listBox.getIdOfItem(item))?.forEach(itemView => itemView.setVisible(this.options.filter(item, searchString)));
    }

    protected handleKeyDown(event: KeyboardEvent): void {
        if (!this.dropdownShown && KeyHelper.isArrowDownKey(event)) {
            this.showDropdown();
        }
    }

    protected handlerEnterPressed(): boolean {
        if (this.applyButton.hasFocus()) {
            this.applySelection();
            return true;
        }

        const focusedItem: I = this.selectionNavigator?.getFocusedItem();

        if (focusedItem) {
            if (this.selectionDelta.size === 0) {
                this.handleUserToggleAction(focusedItem);
            }

            if (this.selectionDelta.size !== 0) {
                this.applySelection();
            }
        }

        return true;
    }

    protected handleClickOutside(): boolean {
        this.hideDropdown();
        return true;
    }

    handleUserSelected(item: I): void {
        const id: string = this.listBox.getIdOfItem(item);
        this.toggleItemWrapperSelected(id, true);

        if (super.isSelected(id)) {
            this.selectionDelta.delete(id);
        } else {
            this.selectionDelta.set(id, {item, selected: true});
        }

        if (this.isMultiSelect()) {
            this.applyButton.setVisible(this.selectionDelta.size > 0);
        } else {
            this.applySelection();
        }
    }

    handleUserDeselected(item: I): void {
        const id: string = this.listBox.getIdOfItem(item);
        this.toggleItemWrapperSelected(id, false);

        if (super.isSelected(id)) {
            this.selectionDelta.set(id, {item, selected: false});
        } else {
            this.selectionDelta.delete(id);
        }

        this.applyButton.setVisible(this.selectionDelta.size > 0);
    }

    isSelected(id: string): boolean {
        return this.selectionDelta.has(id) ? this.selectionDelta.get(id).selected : super.isSelected(id);
    }

    protected getCurrentlySelectedItems(): I[] {
        return super.getCurrentlySelectedItems()
                   .filter((savedItem: I) => this.isItemSelected(savedItem))
                   .concat(this.getSelectedDeltaItems()) || [];
    }

    private getSelectedDeltaItems(): I[] {
        const result: I[] = [];

        this.selectionDelta.forEach((value: SelectionDeltaItem<I>) => {
            if (value.selected) {
                result.push(value.item);
            }
        });

        return result;
    }

    protected applySelection(): void {
        const selectionChange: SelectionChange<I> = {selected: [], deselected: []};

        // deselecting items first to free selection space for new items if limits are set
        this.selectionDelta.forEach((value: SelectionDeltaItem<I>) => {
            if (!value.selected) {
                selectionChange.deselected.push(value.item);
                this.doDeselect(value.item);
            }
        });

        // then selecting items until max limit is reached
        this.selectionDelta.forEach((value: SelectionDeltaItem<I>, id: string) => {
            if (value.selected) {
                if (this.selectionLimitReached) {
                    this.toggleItemWrapperSelected(id, false);
                } else {
                    selectionChange.selected.push(value.item);
                    this.doSelect(value.item);
                }
            }
        });

        this.selectionDelta = new Map();
        this.doHideDropdown();
        this.dropdownHandle.up();

        Array.from(this.itemsWrappers.values()).forEach(
            (itemWrappers: Element[]) => itemWrappers.forEach(itemWrapper => itemWrapper.setVisible(true)));

        if (selectionChange.selected.length > 0 || selectionChange.deselected.length > 0) {
            this.notifySelectionChanged(selectionChange);
        }

        this.applyButton.hide();
    }

    protected getItemById(id: string): I {
        return this.listBox.getItem(id);
    }

    setLoadWhenListShown(): void {
        if (this.dropdownShown) {
            this.loadListOnShown();
        } else {
            this.loadWhenListShown = true;
        }
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass('filterable-listbox-wrapper');
            this.listBox.addClass('filterable-listbox');
            this.filterContainer.appendChildren(this.optionFilterInput, this.dropdownHandle as Element);
            this.filterAndListContainer.appendChildren(this.filterContainer, this.listBox);
            this.appendChild(this.filterAndListContainer);

            this.applyButton.addClass('apply-selection-button');
            this.applyButton.insertAfterEl(this.optionFilterInput);

            return rendered;
        });
    }

    setEnabled(enable: boolean): void {
        this.optionFilterInput.setEnabled(enable);
        this.dropdownHandle.setEnabled(enable);
    }

    cleanInput(): void {
        this.optionFilterInput.clear();
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

    protected createSelectionNavigator(): SelectableListBoxNavigator<I> {
        return new SelectableListBoxNavigator(this.listBox, this.itemsWrappers)
            .setClickOutsideHandler(this.handleClickOutside.bind(this))
            .setEnterKeyHandler(this.handlerEnterPressed.bind(this))
            .setSpaceHandler(this.handleSpacePressed.bind(this))
    }

    protected addKeyNavigation(): void {
        this.selectionNavigator = this.createSelectionNavigator();
    }

    protected addItemWrapper(id: string, wrapper: Element): void {
        super.addItemWrapper(id, wrapper);

        // if list is already shown and new item added to it then add tabindex manually
        this.selectionNavigator?.notifyItemWrapperAdded(wrapper);
    }

    protected handleSpacePressed(): boolean {
        const focusedItem: I = this.selectionNavigator.getFocusedItem();

        if (focusedItem) {
            this.handleUserToggleAction(focusedItem);
            return false;
        }

        return true;
    }

    getOptionFilterInput(): OptionFilterInput {
        return this.optionFilterInput;
    }
}
