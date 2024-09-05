import * as Q from 'q';
import {Option} from '../selector/Option';
import {Principal} from '../../security/Principal';
import {PrincipalLoader} from '../../security/PrincipalLoader';
import {SelectedOption} from '../selector/combobox/SelectedOption';
import {BaseSelectedOptionsView} from '../selector/combobox/BaseSelectedOptionsView';
import {PrincipalKey} from '../../security/PrincipalKey';
import {SelectedOptionView} from '../selector/combobox/SelectedOptionView';
import {PrincipalViewer} from './PrincipalViewer';
import {FilterableListBoxWrapperWithSelectedView, ListBoxInputOptions} from '../selector/list/FilterableListBoxWrapperWithSelectedView';
import {PrincipalType} from '../../security/PrincipalType';
import {PrincipalsListBox} from './PrincipalsListBox';
import {FormInputEl} from '../../dom/FormInputEl';
import {LoadedDataEvent} from '../../util/loader/event/LoadedDataEvent';
import {AppHelper} from '../../util/AppHelper';
import {ValueChangedEvent} from '../../ValueChangedEvent';
import {DefaultErrorHandler} from '../../DefaultErrorHandler';
import {StringHelper} from '../../util/StringHelper';
import {GetPrincipalsByKeysRequest} from '../../security/GetPrincipalsByKeysRequest';

export interface PrincipalComboBoxParams {
    maxSelected?: number;
    allowedTypes?: PrincipalType[];
    skipPrincipals?: PrincipalKey[];
    postfixUri?: string;
    selectedOptionsView?: PrincipalSelectedOptionsView;
}

interface PrincipalComboBoxOptions extends ListBoxInputOptions<Principal> {
    loader: PrincipalLoader;
}

export class PrincipalComboBox
    extends FilterableListBoxWrapperWithSelectedView<Principal> {

    private preSelectedItems: PrincipalKey[] = [];

    private postfixUri: string;

    protected readonly options: PrincipalComboBoxOptions;

    constructor(options?: PrincipalComboBoxParams) {
        const loader = new PrincipalLoader(options.postfixUri);
        loader.setAllowedTypes(options?.allowedTypes);

        if (options.skipPrincipals?.length > 0) {
            loader.skipPrincipals(options?.skipPrincipals);
        }

        super(new PrincipalsListBox(loader), {
            maxSelected: options?.maxSelected ?? 0,
            selectedOptionsView: options?.selectedOptionsView || new PrincipalSelectedOptionsView(),
            className: 'principal-combobox',
            loader: loader
        } as PrincipalComboBoxOptions);

        this.postfixUri = options?.postfixUri;
    }

    protected initListeners(): void {
        super.initListeners();

        this.options.loader.onLoadedData((event: LoadedDataEvent<Principal>) => {
            if (event.isPostLoad()) {
                this.listBox.addItems(event.getData());
            } else {
                this.listBox.setItems(event.getData());
            }
            return Q.resolve(null);
        });

        this.listBox.whenShown(() => {
            // if not empty then search will be performed after finished typing
            if (StringHelper.isBlank(this.optionFilterInput.getValue())) {
                this.search(this.optionFilterInput.getValue());
            }
        });

        let searchValue = '';

        const debouncedSearch = AppHelper.debounce(() => {
            this.search(searchValue);
        }, 300);

        this.optionFilterInput.onValueChanged((event: ValueChangedEvent) => {
            searchValue = event.getNewValue();
            debouncedSearch();
        });
    }

    protected search(value?: string): void {
        this.options.loader.search(value).catch(DefaultErrorHandler.handle);
    }

    createSelectedOption(item: Principal): Option<Principal> {
        return Option.create<Principal>()
            .setValue(item.getKey().toString())
            .setDisplayValue(item)
            .build();
    }

    getLoader(): PrincipalLoader {
        return this.options.loader;
    }

    setSelectedItems(items: PrincipalKey[]): void {
        this.preSelectedItems = items || [];

        new GetPrincipalsByKeysRequest(items).setPostfixUri(this.postfixUri).sendAndParse().then((principals: Principal[]) => {
            this.select(principals, true);
        }).catch(DefaultErrorHandler.handle);
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

export class PrincipalComboBoxWrapper extends FormInputEl {

    private readonly selector: PrincipalComboBox;

    constructor(selector: PrincipalComboBox) {
        super('div', 'principal-selector-wrapper');

        this.selector = selector;
        this.appendChild(this.selector);
    }

    getComboBox(): PrincipalComboBox {
        return this.selector;
    }

    getValue(): string {
        return this.selector.getSelectedOptions().length > 0 ? 'mock' : '';
    }
}
