import Q from 'q';
import {DefaultErrorHandler} from '../../DefaultErrorHandler';
import {FormInputEl} from '../../dom/FormInputEl';
import {GetPrincipalsByKeysRequest} from '../../security/GetPrincipalsByKeysRequest';
import {Principal, PrincipalBuilder} from '../../security/Principal';
import {PrincipalKey} from '../../security/PrincipalKey';
import {PrincipalLoader} from '../../security/PrincipalLoader';
import {PrincipalType} from '../../security/PrincipalType';
import {AppHelper} from '../../util/AppHelper';
import {LoadedDataEvent} from '../../util/loader/event/LoadedDataEvent';
import {StringHelper} from '../../util/StringHelper';
import {ValueChangedEvent} from '../../ValueChangedEvent';
import {BaseSelectedOptionsView} from '../selector/combobox/BaseSelectedOptionsView';
import {SelectedOption} from '../selector/combobox/SelectedOption';
import {SelectedOptionView} from '../selector/combobox/SelectedOptionView';
import {FilterableListBoxWrapperWithSelectedView, ListBoxInputOptions} from '../selector/list/FilterableListBoxWrapperWithSelectedView';
import {Option} from '../selector/Option';
import {PrincipalsListBox} from './PrincipalsListBox';
import {PrincipalViewer} from './PrincipalViewer';

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

    declare protected readonly options: PrincipalComboBoxOptions;

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

        this.options.loader.onLoadingData(() => {
            this.loadMask.show();
        });

        this.options.loader.onErrorOccurred(() => {
            this.loadMask.hide();
        });

        this.options.loader.onLoadedData((event: LoadedDataEvent<Principal>) => {
            if (event.isPostLoad()) {
                this.listBox.addItems(event.getData());
            } else {
                this.listBox.setItems(event.getData());
            }

            this.loadMask.hide();
            return Q.resolve(null);
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

    protected loadListOnShown(): void {
        // if not empty then search will be performed after finished typing
        if (StringHelper.isBlank(this.optionFilterInput.getValue())) {
            this.search(this.optionFilterInput.getValue());
        }
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
        this.deselectAll();

        if (items.length === 0) {
            return;
        }

        new GetPrincipalsByKeysRequest(items).setPostfixUri(this.postfixUri).sendAndParse().then((principals: Principal[]) => {
            const itemsToSelect = [];

            items.forEach((item: PrincipalKey) => {
                const principal = principals.find((p) => p.getKey().equals(item));

                itemsToSelect.push(principal || new MissingPrincipal(item));
            });

            this.select(itemsToSelect);
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
        let optionView = option.getDisplayValue() instanceof MissingPrincipal ? new RemovedPrincipalSelectedOptionView(option) : new PrincipalSelectedOptionView(option);

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
        return this.selector.getSelectedOptions().map((option) => option.getOption().getValue()).join(';');
    }
}

class MissingPrincipal extends Principal {
    constructor(key: PrincipalKey) {
        super(new PrincipalBuilder().setKey(key).setDisplayName(key.toString()));
    }
}
