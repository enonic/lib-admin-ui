import {LoadedDataEvent} from '../../../util/loader/event/LoadedDataEvent';
import {i18n} from '../../../util/Messages';
import {BaseLoader} from '../../../util/loader/BaseLoader';
import {Dropdown, DropdownConfig} from './Dropdown';
import {Option} from '../Option';

export class RichDropdown<OPTION_DISPLAY_VALUE>
    extends Dropdown<OPTION_DISPLAY_VALUE> {

    protected loader: BaseLoader<OPTION_DISPLAY_VALUE>;

    constructor(dropdownConfig: DropdownConfig<OPTION_DISPLAY_VALUE>, name: string = '') {
        super(name, dropdownConfig);

        this.loader = this.createLoader();

        this.initLoaderListeners();
    }

    load() {
        this.loader.load();
    }

    showDropdown() {
        super.showDropdown();
        this.load();
    }

    protected createLoader(): BaseLoader<OPTION_DISPLAY_VALUE> {
        throw new Error('Must be implemented by inheritors');
    }

    protected getLoader(): BaseLoader<OPTION_DISPLAY_VALUE> {
        return this.loader;
    }

    protected handleLoadedData(event: LoadedDataEvent<OPTION_DISPLAY_VALUE>) {
        this.setOptions(this.createOptions(event.getData()));
    }

    protected createOption(_value: OPTION_DISPLAY_VALUE): Option<OPTION_DISPLAY_VALUE> {
        throw new Error('Must be implemented by inheritors');
    }

    private initLoaderListeners() {
        this.loader.onLoadedData(this.handleLoadedData.bind(this));

        this.loader.onLoadingData(() => {
            this.setEmptyDropdownText(i18n('field.search.inprogress'));
        });
    }

    private createOptions(values: OPTION_DISPLAY_VALUE[]): Option<OPTION_DISPLAY_VALUE>[] {
        let options = [];

        values.forEach((value: OPTION_DISPLAY_VALUE) => {
            options.push(this.createOption(value));
        });

        return options;
    }

}
