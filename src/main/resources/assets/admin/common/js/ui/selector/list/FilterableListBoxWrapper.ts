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

export interface FilterableListBoxOptions<I> extends SelectableListBoxDropdownOptions<I> {
    filter?: (item: I, searchString: string) => boolean;
}

export class FilterableListBoxWrapper<I> extends SelectableListBoxWrapper<I> {

    protected readonly listBox: ListBox<I>;

    protected options: FilterableListBoxOptions<I>;

    protected optionFilterInput: OptionFilterInput;

    protected applyButton: Button;

    protected dropdownHandle: DropdownHandle;

    constructor(listBox: ListBox<I>, options?: FilterableListBoxOptions<I>) {
        super(listBox, options);
    }

    protected initElements(): void {
        super.initElements();

        this.optionFilterInput = new OptionFilterInput();
        this.dropdownHandle = new DropdownHandle();
        this.applyButton = new Button(i18n('action.ok'));
        this.applyButton.hide();
    }

    protected initListeners(): void {
        super.initListeners();

        this.applyButton.onClicked(this.applySelection.bind(this));

        this.dropdownHandle.onClicked(() => {
            this.listBox.setVisible(!this.listBox.isVisible());
        });

        this.listBox.onShown(() => {
            this.dropdownHandle.down();
        });

        this.listBox.onHidden(() => {
            this.dropdownHandle.up();
        });

        this.optionFilterInput.onValueChanged((event: ValueChangedEvent) => {
           this.handleValueChange(event);
        });

        this.optionFilterInput.onKeyDown((event: KeyboardEvent) => {
            this.handleKeyDown(event);
        });
    }

    protected handleValueChange(event: ValueChangedEvent): void {
        this.listBox.setVisible(true);

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

        super.handlerEnterPressed();
    }

    protected handleClickOutside(): void {
        super.handleClickOutside();
        this.applyButton.hide();
    }

    protected handleItemMarkedSelected(item: I): void {
        super.handleItemMarkedSelected(item);

        this.applyButton.setVisible(this.selectionDelta.size > 0);
    }

    protected handleItemMarkedDeselected(item: I): void {
        super.handleItemMarkedDeselected(item);

        this.applyButton.setVisible(this.selectionDelta.size > 0);
    }

    protected applySelection(): void {
        super.applySelection();

        this.applyButton.hide();
        this.optionFilterInput.setValue('', true);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass('filterable-listbox-wrapper');
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
}
