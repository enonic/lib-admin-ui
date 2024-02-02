import {ListBox} from './ListBox';
import {BaseSelectedOptionsView} from '../combobox/BaseSelectedOptionsView';
import {SelectionChange} from '../../../util/SelectionChange';
import {Option} from '../Option';
import {SelectedOptionEvent} from '../combobox/SelectedOptionEvent';
import {FilterableListBoxOptions, FilterableListBoxWrapper} from './FilterableListBoxWrapper';
import {SelectedOption} from '../combobox/SelectedOption';

export interface ListBoxInputOptions<I> extends FilterableListBoxOptions<I> {
    selectedOptionsView: BaseSelectedOptionsView<I>
}

export abstract class FilterableListBoxWrapperWithSelectedView<I>
    extends FilterableListBoxWrapper<I> {

    public static LIMIT_REACHED_CLASS: string = 'selection-limit-reached';

    protected selectedOptionsView: BaseSelectedOptionsView<I>;

    protected options: ListBoxInputOptions<I>;

    protected selectionLimitReached: boolean = false;

    protected constructor(listBox: ListBox<I>, options?: ListBoxInputOptions<I>) {
        super(listBox, options);
    }

    protected initElements() {
        super.initElements();

        this.selectedOptionsView = this.options.selectedOptionsView;
        this.selectedOptionsView.setMaximumOccurrences(this.options.maxSelected);
    }

    protected initListeners(): void {
        super.initListeners();

        this.selectedOptionsView.onOptionDeselected((event: SelectedOptionEvent<I>) => {
            this.deselect(event.getSelectedOption().getOption().getDisplayValue());
        });
    }

    protected doSelect(itemToSelect: I): void {
        super.doSelect(itemToSelect);

        this.selectedOptionsView.addOption(this.createSelectedOption(itemToSelect), true, -1);
        this.checkSelectionLimitReached();
    }

    protected doDeselect(itemToDeselect: I): void {
        super.doDeselect(itemToDeselect);

        const option = this.createSelectedOption(itemToDeselect);
        const existing = this.selectedOptionsView.getById(option.getId());

        if (existing) {
            this.selectedOptionsView.removeOption(this.createSelectedOption(itemToDeselect), true);
        }
        this.checkSelectionLimitReached();
    }

    abstract createSelectedOption(item: I): Option<I>;

    protected checkSelectionLimitReached(): void {
        const isMaxOccurrencesReached = this.maximumOccurrencesReached();

        if (this.selectionLimitReached && !isMaxOccurrencesReached) {
            this.selectionLimitReached = false;
            this.handleSelectionLimitIsNoLongerReached();
        } else if (!this.selectionLimitReached && isMaxOccurrencesReached) {
            this.selectionLimitReached = true;
            this.handleSelectionLimitReached();
        }
    }

    protected handleSelectionLimitReached(): void {
        this.filterAndListContainer.hide();
        this.toggleClass(FilterableListBoxWrapperWithSelectedView.LIMIT_REACHED_CLASS, true);
    }

    protected handleSelectionLimitIsNoLongerReached(): void {
        this.filterAndListContainer.show();
        this.toggleClass(FilterableListBoxWrapperWithSelectedView.LIMIT_REACHED_CLASS, false);
    }

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

    maximumOccurrencesReached(): boolean {
        return this.selectedOptionsView.maximumOccurrencesReached();
    }

    getSelectedOptions(): SelectedOption<I>[] {
        return this.selectedOptionsView.getSelectedOptions();
    }

    getSelectedOptionsView(): BaseSelectedOptionsView<I> {
        return this.selectedOptionsView;
    }
}
