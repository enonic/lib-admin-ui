import {Option} from '../Option';
import {DropdownList} from '../DropdownList';
import {DropdownGridMultipleSelectionEvent} from '../DropdownGridMultipleSelectionEvent';

export class ComboBoxDropdown<OPTION_DISPLAY_VALUE>
    extends DropdownList<OPTION_DISPLAY_VALUE> {

    setOptions(options: Option<OPTION_DISPLAY_VALUE>[], noOptionsText: string, selectedOptions: Option<OPTION_DISPLAY_VALUE>[] = [],
               saveSelection?: boolean) {

        selectedOptions.forEach((selectedOption: Option<OPTION_DISPLAY_VALUE>) => {
            if (selectedOption.isReadOnly()) {
                for (const option of options) {
                    if (selectedOption.getValue() === option.getValue()) {
                        option.setReadOnly(true);
                        break;
                    }
                }
            }
        });

        // `from` is used to determine, from which point should selection be updated
        const from = this.getDropdownGrid().getOptionCount();

        const gridSelection = this.getDropdownGrid().getSelectedOptions();

        this.getDropdownGrid().setOptions(options);

        if (this.isDropdownShown()) {
            let selected = selectedOptions;

            // Save the current grid selection and restore the selection for the new items,
            // according to the selected options
            if (saveSelection) {
                const newSelection = selectedOptions.filter((option) => {
                    return this.getDropdownGrid().getRowByValue(option.getValue()) >= from;
                });

                selected = gridSelection.concat(newSelection);
            }

            this.showDropdown(selected, noOptionsText);
        }
    }

    getSelectedOptionCount(): number {
        return this.getDropdownGrid().getSelectedOptionCount();
    }

    toggleRowSelection(row: number, isMaximumReached: boolean = false) {
        this.getDropdownGrid().toggleRowSelection(row, isMaximumReached);
    }

    resetActiveSelection() {
        this.getDropdownGrid().resetActiveSelection();
    }

    onMultipleSelection(listener: (event: DropdownGridMultipleSelectionEvent) => void) {
        this.getDropdownGrid().onMultipleSelection(listener);
    }

    unMultipleSelection(listener: (event: DropdownGridMultipleSelectionEvent) => void) {
        this.getDropdownGrid().unMultipleSelection(listener);
    }
}
