import {PrincipalContainer} from './PrincipalContainer';
import {PrincipalLoader} from '../../security/PrincipalLoader';
import {BaseRichComboBox, BaseRichComboBoxBuilder} from '../selector/combobox/BaseRichComboBox';
import {Principal} from '../../security/Principal';
import {PrincipalContainerViewer} from './PrincipalContainerViewer';
import {Viewer} from '../Viewer';
import {BaseLoader} from '../../util/loader/BaseLoader';
import {PrincipalContainerSelectedOptionsView} from './PrincipalContainerSelectedOptionsView';

export class PrincipalContainerCombobox<T extends PrincipalContainer>
    extends BaseRichComboBox<T, Principal> {

    constructor(builder: PrincipalContainerComboboxBuilder<T>) {
        super(builder);
    }

    onOptionValueChanged(listener: (item: T) => void) {
        (this.getSelectedOptionView() as PrincipalContainerSelectedOptionsView<T>).onItemValueChanged(listener);
    }

    unItemValueChanged(listener: (item: T) => void) {
        (this.getSelectedOptionView() as PrincipalContainerSelectedOptionsView<T>).unItemValueChanged(listener);
    }
}

export class PrincipalContainerComboboxBuilder<T extends PrincipalContainer>
    extends BaseRichComboBoxBuilder<T, Principal> {

    comboBoxName: string = 'principalSelector';

    identifierMethod: string = 'getPrincipalKey';

    loader: BaseLoader<Principal> = new PrincipalLoader();

    hideComboBoxWhenMaxReached: boolean = false;

    optionDisplayValueViewer: Viewer<T> = new PrincipalContainerViewer<T>();

    delayedInputValueChangedHandling: number = 500;

    selectedOptionsView: PrincipalContainerSelectedOptionsView<T>;

    build(): PrincipalContainerCombobox<T> {
        return new PrincipalContainerCombobox(this);
    }
}
