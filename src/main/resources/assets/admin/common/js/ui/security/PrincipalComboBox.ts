import {Option} from '../selector/Option';
import {Principal} from '../../security/Principal';
import {PrincipalLoader} from '../../security/PrincipalLoader';
import {SelectedOption} from '../selector/combobox/SelectedOption';
import {BaseSelectedOptionsView} from '../selector/combobox/BaseSelectedOptionsView';
import {PrincipalKey} from '../../security/PrincipalKey';
import {SelectedOptionView} from '../selector/combobox/SelectedOptionView';
import {RichComboBox, RichComboBoxBuilder} from '../selector/combobox/RichComboBox';
import {PrincipalViewer} from './PrincipalViewer';
import {Viewer} from '../Viewer';
import {SelectedOptionsView} from '../selector/combobox/SelectedOptionsView';

export class PrincipalComboBox
    extends RichComboBox<Principal> {
    constructor(builder: PrincipalComboBoxBuilder = new PrincipalComboBoxBuilder()) {
        super(builder);
        this.addClass('principal-combobox');
    }

    static create(): PrincipalComboBoxBuilder {
        return new PrincipalComboBoxBuilder();
    }
}

export class PrincipalComboBoxBuilder
    extends RichComboBoxBuilder<Principal> {

    loader: PrincipalLoader = new PrincipalLoader();

    maximumOccurrences: number = 0;

    value: string;

    identifierMethod: string = 'getKey';

    comboBoxName: string = 'principalSelector';

    delayedInputValueChangedHandling: number = 500;

    optionDisplayValueViewer: Viewer<Principal> = new PrincipalViewer();

    selectedOptionsView: SelectedOptionsView<Principal> = new PrincipalSelectedOptionsView();

    build(): PrincipalComboBox {
        return new PrincipalComboBox(this);
    }
}

export class PrincipalSelectedOptionView
    extends PrincipalViewer
    implements SelectedOptionView<Principal> {

    private option: Option<Principal>;

    constructor(option: Option<Principal>) {
        super('selected-option principal-selected-option-view');
        this.setOption(option);
        this.appendRemoveButton();
    }

    setOption(option: Option<Principal>) {
        this.option = option;
        this.setObject(option.getDisplayValue());
    }

    getOption(): Option<Principal> {
        return this.option;
    }

}

export class PrincipalSelectedOptionsView
    extends BaseSelectedOptionsView<Principal> {

    constructor() {
        super('principal-selected-options-view');
    }

    createSelectedOption(option: Option<Principal>): SelectedOption<Principal> {
        let optionView = !option.isEmpty() ? new PrincipalSelectedOptionView(option) : new RemovedPrincipalSelectedOptionView(option);
        if (this.readonly) {
            optionView.setReadonly(true);
        }
        return new SelectedOption<Principal>(optionView as any, this.count());
    }

    protected getEmptyDisplayValue(id: string): Principal {
        const key: PrincipalKey = PrincipalKey.fromString(id);

        return Principal
            .create()
            .setKey(key)
            .setDisplayName(id)
            .build();
    }
}

export class RemovedPrincipalSelectedOptionView
    extends PrincipalSelectedOptionView {

    constructor(option: Option<Principal>) {
        super(option);
        this.addClass('removed');
    }

    resolveSubName(): string {
        return 'This user is deleted';
    }
}
