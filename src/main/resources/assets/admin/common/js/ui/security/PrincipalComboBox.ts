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

    listUri: string;

    getUri: string;

    maximumOccurrences: number = 0;

    value: string;

    identifierMethod: string = 'getKey';

    comboBoxName: string = 'principalSelector';

    delayedInputValueChangedHandling: number = 500;

    optionDisplayValueViewer: Viewer<Principal> = new PrincipalViewer();

    selectedOptionsView: SelectedOptionsView<Principal> = new PrincipalSelectedOptionsView();

    build(): PrincipalComboBox {
        this.initLoader();
        return new PrincipalComboBox(this);
    }

    protected initLoader(): void {
        if (this.listUri) {
            this.loader.setListUri(this.listUri);
        }
        if (this.getUri) {
            this.loader.setGetUri(this.getUri);
        }
    }

    setListUri(listUri: string): PrincipalComboBoxBuilder {
        this.listUri = listUri;
        return this;
    }

    setGetUri(getUri: string): PrincipalComboBoxBuilder {
        this.getUri = getUri;
        return this;
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
        return new SelectedOption<Principal>(<any>optionView, this.count());
    }

    makeEmptyOption(id: string): Option<Principal> {

        let key = PrincipalKey.fromString(id);

        return Option.create<Principal>()
            .setValue(id)
            .setDisplayValue(Principal.create().setKey(key).setDisplayName(key.getId()).build())
            .setEmpty(true)
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
