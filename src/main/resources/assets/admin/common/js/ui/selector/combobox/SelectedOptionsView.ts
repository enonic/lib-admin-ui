import {DivEl} from '../../../dom/DivEl';
import {Option} from '../Option';
import {SelectedOption} from './SelectedOption';
import {SelectedOptionEvent} from './SelectedOptionEvent';

export interface SelectedOptionsView<T>
    extends DivEl {

    setMaximumOccurrences(value: number);

    getMaximumOccurrences(): number;

    createSelectedOption(option: Option<T>): SelectedOption<T>;

    addOptions(option: Option<T>[], silent: boolean, keyCode: number): boolean;

    addOption(option: Option<T>, silent: boolean, keyCode: number): boolean;

    updateOption(option: Option<T>, newOption: Option<T>, silent?: boolean);

    removeOption(optionToRemove: Option<T>, silent: boolean);

    count(): number;

    getSelectedOptions(): SelectedOption<T>[];

    getByOption(option: Option<T>): SelectedOption<T>;

    getById(id: string): SelectedOption<T>;

    getByIndex(index: number): SelectedOption<T>;

    isSelected(option: Option<T>): boolean;

    maximumOccurrencesReached(): boolean;

    moveOccurrence(formIndex: number, toIndex: number);

    onOptionSelected(listener: (added: SelectedOptionEvent<T>) => void);

    unOptionSelected(listener: (added: SelectedOptionEvent<T>) => void);

    onOptionDeselected(listener: (removed: SelectedOptionEvent<T>) => void);

    unOptionDeselected(listener: (removed: SelectedOptionEvent<T>) => void);

    onOptionMoved(listener: (moved: SelectedOption<T>, fromIndex: number) => void);

    unOptionMoved(listener: (moved: SelectedOption<T>, fromIndex: number) => void);

    setReadonly(readonly: boolean);

    setEditable(editable: boolean);

    refreshSortable();
}
