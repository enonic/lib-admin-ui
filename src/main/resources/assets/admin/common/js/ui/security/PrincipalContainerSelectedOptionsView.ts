import {BaseSelectedOptionsView} from '../selector/combobox/BaseSelectedOptionsView';
import {PrincipalContainer} from './PrincipalContainer';
import {SelectedOption} from '../selector/combobox/SelectedOption';
import {Option} from '../selector/Option';
import {PrincipalContainerSelectedEntryView} from './PrincipalContainerSelectedEntryView';
import {PrincipalContainerSelectedOptionView} from './PrincipalContainerSelectedOptionView';

export class PrincipalContainerSelectedOptionsView<T extends PrincipalContainer>
    extends BaseSelectedOptionsView<T> {

    private itemValueChangedListeners: ((item: T) => void)[] = [];

    createSelectedOption(option: Option<T>): SelectedOption<T> {
        const selectedOptionView = new PrincipalContainerSelectedOptionView<T>(option,
            this.createSelectedEntryView(option));

        selectedOptionView.onValueChanged((item: T) => {
            // update our selected options list with new values
            const selectedOption = this.getById(item.getPrincipalKey().toString());
            if (selectedOption) {
                selectedOption.getOption().setDisplayValue(item);
            }
            this.notifyItemValueChanged(item);
        });

        return new SelectedOption<T>(selectedOptionView, this.count());
    }

    protected createSelectedEntryView(option: Option<T>): PrincipalContainerSelectedEntryView<T> {
        return new PrincipalContainerSelectedEntryView(option.getDisplayValue(), option.isReadOnly());
    }

    onItemValueChanged(listener: (item: T) => void) {
        this.itemValueChangedListeners.push(listener);
    }

    unItemValueChanged(listener: (item: T) => void) {
        this.itemValueChangedListeners = this.itemValueChangedListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    notifyItemValueChanged(item: T) {
        this.itemValueChangedListeners.forEach((listener) => {
            listener(item);
        });
    }

}
