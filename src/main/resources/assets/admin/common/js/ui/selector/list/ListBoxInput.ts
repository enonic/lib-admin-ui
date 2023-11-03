import {SelectableListBoxDropdown, SelectableListBoxDropdownOptions} from './SelectableListBoxDropdown';
import {ListBox} from './ListBox';
import {BaseSelectedOptionsView} from '../combobox/BaseSelectedOptionsView';
import {SelectionChange} from '../../../util/SelectionChange';
import {Option} from '../Option';
import {SelectedOptionEvent} from '../combobox/SelectedOptionEvent';

export abstract class ListBoxInput<I>
    extends SelectableListBoxDropdown<I> {

    protected selectedOptionsView: BaseSelectedOptionsView<I>;

    protected constructor(listBox: ListBox<I>,
                          selectedOptionsView: BaseSelectedOptionsView<I>,
                          options?: SelectableListBoxDropdownOptions<I>) {
        super(listBox, options);

        this.selectedOptionsView = selectedOptionsView;

        this.selectedOptionsView.onOptionDeselected((event: SelectedOptionEvent<I>) => {
            this.deselect(event.getSelectedOption().getOption().getDisplayValue());
        });
    }

    protected initListeners(): void {
        super.initListeners();

        this.onSelectionChanged((selectionChange: SelectionChange<I>) => {
            selectionChange.selected?.forEach((item: I) => {
                this.selectedOptionsView.addOption(this.createOption(item), true, -1);
            });

            selectionChange.deselected?.forEach((item: I) => {
                const option = this.createOption(item);
                const existing = this.selectedOptionsView.getById(option.getId());

                if (existing) {
                    this.selectedOptionsView.removeOption(this.createOption(item), true);
                }
            });
        });
    }

    abstract createOption(item: I): Option<I>;

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
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
}
