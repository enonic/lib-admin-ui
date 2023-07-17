import {Element} from '../../../dom/Element';
import {Option} from '../Option';

export interface SelectedOptionView<T>
    extends Element {

    setOption(option: Option<T>);

    getOption(): Option<T>;

    onRemoveClicked(listener: () => void);

    unRemoveClicked(listener: () => void);

    setReadonly(readonly: boolean);

    setEditable(editable: boolean);
}
