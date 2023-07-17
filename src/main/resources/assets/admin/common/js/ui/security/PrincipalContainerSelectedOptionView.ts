import {PrincipalContainer} from './PrincipalContainer';
import {SelectedOptionView} from '../selector/combobox/SelectedOptionView';
import {Option} from '../selector/Option';
import {PrincipalContainerSelectedEntryView} from './PrincipalContainerSelectedEntryView';
import {DivEl} from '../../dom/DivEl';

export class PrincipalContainerSelectedOptionView<T extends PrincipalContainer>
    extends DivEl
    implements SelectedOptionView<T> {

    private option: Option<T>;

    private view: PrincipalContainerSelectedEntryView<T>;

    constructor(option: Option<T>, view: PrincipalContainerSelectedEntryView<T>) {
        super();
        this.option = option;
        this.view = view;
    }

    setOption(option: Option<T>) {
        this.option = option;
        this.view.setItem(option.getDisplayValue());
    }

    getOption(): Option<T> {
        return this.option;
    }

    onRemoveClicked(listener: () => void) {
        this.view.onRemoveClicked(listener);
    }

    setEditable(editable: boolean) {
        this.view.setEditable(editable);
    }

    setReadonly(readonly: boolean) {
        this.view.setReadonly(readonly);
    }

    unRemoveClicked(listener: () => void) {
        this.view.unRemoveClicked(listener);
    }

    onValueChanged(listener: (item: T) => void) {
        this.view.onValueChanged(listener);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.appendChild(this.view);

            return rendered;
        });
    }

}
