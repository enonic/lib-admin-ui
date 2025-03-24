import {ListBox} from './ListBox';
import {BaseSelectedOptionsView} from '../combobox/BaseSelectedOptionsView';
import {Option} from '../Option';
import {SelectedOptionEvent} from '../combobox/SelectedOptionEvent';
import {FilterableListBoxOptions, FilterableListBoxWrapper} from './FilterableListBoxWrapper';
import {SelectedOption} from '../combobox/SelectedOption';

export interface ListBoxInputOptions<I> extends FilterableListBoxOptions<I> {
    selectedOptionsView: BaseSelectedOptionsView<I>
}

export abstract class FilterableListBoxWrapperWithSelectedView<I>
    extends FilterableListBoxWrapper<I> {

    protected selectedOptionsView: BaseSelectedOptionsView<I>;

    protected options: ListBoxInputOptions<I>;

    protected constructor(listBox: ListBox<I>, options?: ListBoxInputOptions<I>) {
        super(listBox, options);
    }

    protected initElements() {
        super.initElements();

        this.selectedOptionsView = this.options?.selectedOptionsView || new BaseSelectedOptionsView<I>();
        this.selectedOptionsView.setMaximumOccurrences(this.options.maxSelected);
    }

    protected initListeners(): void {
        super.initListeners();

        this.selectedOptionsView.onOptionDeselected((event: SelectedOptionEvent<I>) => {
            this.deselect(event.getSelectedOption().getOption().getDisplayValue());
        });
    }

    protected handleSelectionLimitReached(): void {
        super.handleSelectionLimitReached();

        this.filterContainer.hide();
        this.optionFilterInput.clear();
    }

    protected handleSelectionLimitIsNoLongerReached(): void {
        super.handleSelectionLimitIsNoLongerReached();

        this.filterContainer.show();
        this.optionFilterInput.giveFocus();
    }

    protected doSelect(itemToSelect: I): void {
        super.doSelect(itemToSelect);

        const optionToSelect = this.createSelectedOption(itemToSelect);

        if (!this.selectedOptionsView.isSelected(optionToSelect)) {
            if (!this.isMultiSelect() && this.countSelected() > 0) {
                this.selectedOptionsView.updateOption(this.selectedOptionsView.getByIndex(0).getOption(), optionToSelect);
            } else {
                this.selectedOptionsView.addOption(optionToSelect, true, -1);
            }
        }
    }

    protected doDeselect(itemToDeselect: I): void {
        const option = this.createSelectedOption(itemToDeselect);
        const existing = this.selectedOptionsView.getById(option.getId());

        if (existing) {
            this.selectedOptionsView.removeOption(this.createSelectedOption(itemToDeselect), true);
        }

        super.doDeselect(itemToDeselect);
    }

    abstract createSelectedOption(item: I): Option<I>;

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass('filterable-listbox-wrapper-with-selected-view');
            this.appendChild(this.selectedOptionsView);

            return rendered;
        });
    }

    countSelected(): number {
        return this.selectedOptionsView.count();
    }

    getSelectedOptions(): SelectedOption<I>[] {
        return this.selectedOptionsView.getSelectedOptions();
    }

    getSelectedOptionsView(): BaseSelectedOptionsView<I> {
        return this.selectedOptionsView;
    }

    setEnabled(enable: boolean): void {
        super.setEnabled(enable);

        this.selectedOptionsView.setReadonly(!enable);
    }

    maximumOccurrencesReached(): boolean {
        if (this.options.maxSelected === 0) {
            return false;
        }

        return super.maximumOccurrencesReached() || this.selectedOptionsView.count() >= this.options.maxSelected;
    }
}
