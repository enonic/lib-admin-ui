import * as Q from 'q';
import {OptionFilterInputValueChangedEvent} from '../OptionFilterInputValueChangedEvent';
import {Viewer} from '../../Viewer';
import {SelectedOption} from './SelectedOption';
import {Option} from '../Option';
import {PostLoader} from '../../../util/loader/PostLoader';
import {LoaderErrorEvent} from '../../../util/loader/event/LoaderErrorEvent';
import {GridColumn} from '../../grid/GridColumn';
import {StringHelper} from '../../../util/StringHelper';
import {i18n} from '../../../util/Messages';
import {KeyEventsHandler} from '../../../event/KeyEventsHandler';
import {CompositeFormInputEl} from '../../../dom/CompositeFormInputEl';
import {BaseLoader} from '../../../util/loader/BaseLoader';
import {DivEl} from '../../../dom/DivEl';
import {ObjectHelper} from '../../../ObjectHelper';
import {ElementHelper} from '../../../dom/ElementHelper';
import {DefaultErrorHandler} from '../../../DefaultErrorHandler';
import {LoadingDataEvent} from '../../../util/loader/event/LoadingDataEvent';
import {LoadedDataEvent} from '../../../util/loader/event/LoadedDataEvent';
import {SelectedOptionsView} from './SelectedOptionsView';
import {ComboBox, ComboBoxConfig} from './ComboBox';
import {SelectedOptionEvent} from './SelectedOptionEvent';
import {OptionDataHelper} from '../OptionDataHelper';
import {BaseLoaderComboBox} from './BaseLoaderComboBox';
import {OptionDataLoader} from '../OptionDataLoader';

export class BaseRichComboBox<OPTION_DATA_TYPE, LOADER_DATA_TYPE>
    extends CompositeFormInputEl {

    public static debug: boolean = false;
    private loader: BaseLoader<any, LOADER_DATA_TYPE>;
    private selectedOptionsView: SelectedOptionsView<OPTION_DATA_TYPE>;
    private comboBox: BaseLoaderComboBox<OPTION_DATA_TYPE, LOADER_DATA_TYPE>;
    private errorContainer: DivEl;
    private identifierMethod: string;
    private loadingListeners: { (): void; }[];
    private loadedListeners: { (items: OPTION_DATA_TYPE[], postLoaded?: boolean): void; }[];
    private interval: number;

    constructor(builder: BaseRichComboBoxBuilder<OPTION_DATA_TYPE, LOADER_DATA_TYPE>) {
        super();

        this.comboBox = this.createCombobox(builder);
        this.loader = builder.loader;
        this.loadedListeners = [];
        this.loadingListeners = [];
        this.identifierMethod = builder.identifierMethod;
        this.selectedOptionsView = builder.selectedOptionsView;
        this.errorContainer = new DivEl('error-container');

        this.setupLoader();
        this.setWrappedInput(this.comboBox);
        this.setAdditionalElements(this.errorContainer, this.selectedOptionsView);

        if (!StringHelper.isBlank(builder.comboBoxName)) {
            this.setName(builder.comboBoxName);
        }
        if (!StringHelper.isBlank(builder.value)) {
            this.setIgnoreNextFocus(true); // do not move focus when setting original value
        }

        this.addClass('rich-combobox');
    }

    setIgnoreNextFocus(value: boolean = true): BaseRichComboBox<OPTION_DATA_TYPE, LOADER_DATA_TYPE> {
        this.comboBox.setIgnoreNextFocus(value);
        return this;
    }

    isIgnoreNextFocus(): boolean {
        return this.comboBox.isIgnoreNextFocus();
    }

    getSelectedDisplayValues(): OPTION_DATA_TYPE[] {
        return this.comboBox.getSelectedOptions().map((option: Option<OPTION_DATA_TYPE>) => {
            return option.displayValue;
        });
    }

    getSelectedValues(): string[] {
        return this.comboBox.getSelectedOptions().map((option: Option<OPTION_DATA_TYPE>) => {
            return option.value;
        });
    }

    getDisplayValues(): OPTION_DATA_TYPE[] {
        return this.comboBox.getOptions().map((option: Option<OPTION_DATA_TYPE>) => {
            return option.displayValue;
        });
    }

    getSelectedOptions(): SelectedOption<OPTION_DATA_TYPE>[] {
        return this.selectedOptionsView.getSelectedOptions();
    }

    getSelectedOption(option: Option<OPTION_DATA_TYPE>): SelectedOption<OPTION_DATA_TYPE> {
        return this.selectedOptionsView.getByOption(option);
    }

    getSelectedOptionByValue(value: string): SelectedOption<OPTION_DATA_TYPE> {
        const option = this.getOptionByValue(value);
        return option && this.selectedOptionsView.getByOption(option);
    }

    getSelectedOptionView(): SelectedOptionsView<OPTION_DATA_TYPE> {
        return this.selectedOptionsView;
    }

    isOptionSelected(option: Option<OPTION_DATA_TYPE>): boolean {
        return this.comboBox.isOptionSelected(option);
    }

    maximumOccurrencesReached(): boolean {
        return this.comboBox.maximumOccurrencesReached();
    }

    getComboBox(): ComboBox<OPTION_DATA_TYPE> {
        return this.comboBox;
    }

    addOption(option: Option<OPTION_DATA_TYPE>) {
        this.comboBox.addOption(option);
    }

    updateOption(option: Option<OPTION_DATA_TYPE>, displayValue: Object) {
        this.comboBox.updateOption(option, this.createOption(displayValue));
    }

    selectOption(option: Option<OPTION_DATA_TYPE>, silent: boolean = false) {
        this.comboBox.selectOption(option, silent);
    }

    selectOptionByValue(value: string, silent: boolean = false) {
        const option: Option<OPTION_DATA_TYPE> = this.getOptionByValue(value);
        if (option) {
            this.selectOption(option, silent);
        }
    }

    hasOptions(): boolean {
        return this.comboBox.hasOptions();
    }

    getOptionCount(): number {
        return this.comboBox.getOptionCount();
    }

    getOptions(): Option<OPTION_DATA_TYPE>[] {
        return this.comboBox.getOptions();
    }

    getOptionByValue(value: string): Option<OPTION_DATA_TYPE> {
        return this.comboBox.getOptionByValue(value);
    }

    getOptionByRow(rowIndex: number): Option<OPTION_DATA_TYPE> {
        return this.comboBox.getOptionByRow(rowIndex);
    }

    countSelected(): number {
        return this.comboBox.countSelectedOptions();
    }

    select(value: OPTION_DATA_TYPE, readOnly?: boolean, silent?: boolean) {
        this.comboBox.selectOption(this.createOption(value, readOnly), silent);
    }

    deselect(value: OPTION_DATA_TYPE, silent?: boolean) {
        this.comboBox.deselectOption(this.createOption(value), silent);
    }

    clearCombobox() {
        this.clearSelection(true);
        this.comboBox.getInput().getEl().setValue('');
    }

    clearSelection(forceClear: boolean = false) {
        this.comboBox.clearSelection(false, true, forceClear);
    }

    removeAllOptions() {
        this.comboBox.removeAllOptions();
    }

    isSelected(value: OPTION_DATA_TYPE): boolean {
        let selectedValues = this.getSelectedValues();
        let valueToFind = this.getDisplayValueId(value);
        for (let i = 0; i < selectedValues.length; i++) {
            if (selectedValues[i] === valueToFind) {
                return true;
            }
        }
        return false;
    }

    setKeyEventsHandler(handler: KeyEventsHandler) {
        this.comboBox.setKeyEventsHandler(handler);
    }

    getLoader(): BaseLoader<any, LOADER_DATA_TYPE> {
        return this.loader;
    }

    setInputIconUrl(url: string) {
        this.comboBox.setInputIconUrl(url);
    }

    onOptionDeselected(listener: { (option: SelectedOptionEvent<OPTION_DATA_TYPE>): void; }) {
        this.comboBox.onOptionDeselected(listener);
    }

    unOptionDeselected(listener: { (removed: SelectedOptionEvent<OPTION_DATA_TYPE>): void; }) {
        this.comboBox.unOptionDeselected(listener);
    }

    onOptionSelected(listener: { (option: SelectedOptionEvent<OPTION_DATA_TYPE>): void; }) {
        this.comboBox.onOptionSelected(listener);
    }

    unOptionSelected(listener: { (option: SelectedOptionEvent<OPTION_DATA_TYPE>): void; }) {
        this.comboBox.unOptionSelected(listener);
    }

    onOptionMoved(listener: { (option: SelectedOption<OPTION_DATA_TYPE>, fromIndex: number): void; }) {
        this.comboBox.onOptionMoved(listener);
    }

    unOptionMoved(listener: { (option: SelectedOption<OPTION_DATA_TYPE>, fromIndex: number): void; }) {
        this.comboBox.unOptionMoved(listener);
    }

    onLoading(listener: { (): void; }) {
        this.loadingListeners.push(listener);
    }

    unLoading(listener: { (): void; }) {
        let index = this.loadedListeners.indexOf(listener);
        this.loadedListeners.splice(index, 1);
    }

    onLoaded(listener: { (items: OPTION_DATA_TYPE[], postLoaded?: boolean): void; }) {
        this.loadedListeners.push(listener);
    }

    unLoaded(listenerToBeRemoved: { (items: OPTION_DATA_TYPE[], postLoaded?: boolean): void; }) {
        let index = this.loadedListeners.indexOf(listenerToBeRemoved);
        this.loadedListeners.splice(index, 1);
    }

    onValueLoaded(listener: (options: Option<OPTION_DATA_TYPE>[]) => void) {
        this.comboBox.onValueLoaded(listener);
    }

    unValueLoaded(listener: (options: Option<OPTION_DATA_TYPE>[]) => void) {
        this.comboBox.unValueLoaded(listener);
    }

    giveFocus(): boolean {
        return this.comboBox.giveFocus();
    }

    onFocus(listener: (event: FocusEvent) => void) {
        this.comboBox.onFocus(listener);
    }

    unFocus(listener: (event: FocusEvent) => void) {
        this.comboBox.unFocus(listener);
    }

    onBlur(listener: (event: FocusEvent) => void) {
        this.comboBox.onBlur(listener);
    }

    unBlur(listener: (event: FocusEvent) => void) {
        this.comboBox.unBlur(listener);
    }

    protected createComboboxConfig(builder: BaseRichComboBoxBuilder<OPTION_DATA_TYPE, LOADER_DATA_TYPE>): ComboBoxConfig<OPTION_DATA_TYPE> {
        return {
            maximumOccurrences: builder.maximumOccurrences,
            selectedOptionsView: builder.selectedOptionsView,
            optionDisplayValueViewer: builder.optionDisplayValueViewer,
            hideComboBoxWhenMaxReached: builder.hideComboBoxWhenMaxReached,
            setNextInputFocusWhenMaxReached: builder.nextInputFocusWhenMaxReached,
            delayedInputValueChangedHandling: builder.delayedInputValueChangedHandling,
            minWidth: builder.minWidth,
            value: builder.value,
            noOptionsText: builder.noOptionsText,
            maxHeight: builder.maxHeight,
            displayMissingSelectedOptions: builder.displayMissingSelectedOptions,
            removeMissingSelectedOptions: builder.removeMissingSelectedOptions,
            skipAutoDropShowOnValueChange: true,
            optionDataHelper: builder.optionDataHelper,
            optionDataLoader: ObjectHelper.iFrameSafeInstanceOf(builder.loader, OptionDataLoader)
                              ? <OptionDataLoader<any>>builder.loader
                              : null,
            onDropdownShownCallback: this.loadOptionsAfterShowDropdown.bind(this),
            createColumns: builder.createColumns,
            requestMissingOptions: builder.requestMissingOptions
        };
    }

    protected getDisplayValueId(value: Object): string {
        let val = value[this.identifierMethod]();
        return typeof val === 'object' && val['toString'] ? val.toString() : val;
    }

    protected createOptions(items: any[]): Q.Promise<Option<OPTION_DATA_TYPE>[]> {
        let options = [];
        items.forEach((itemInst: any) => {
            options.push(this.createOption(itemInst));
        });
        return Q(options);
    }

    protected createOption(value: Object, readOnly?: boolean): Option<OPTION_DATA_TYPE> {
        return {
            value: this.getDisplayValueId(value),
            displayValue: <OPTION_DATA_TYPE>value,
            readOnly: readOnly
        };
    }

    protected loadedItemToDisplayValue(value: LOADER_DATA_TYPE): OPTION_DATA_TYPE {
        throw new Error('Must be implemented by inheritor');
    }

    protected loadOptionsAfterShowDropdown(): Q.Promise<void> {
        return this.reload(this.comboBox.getInput().getValue());
    }

    protected reload(inputValue: string): Q.Promise<any> {
        let loadPromise;
        if (!this.loader.isLoaded()) {
            this.loader.setSearchString(inputValue);
            loadPromise = this.loader.load();
        } else {
            loadPromise = Q(null);
        }

        return loadPromise.then(() => {
            return this.loader.search(inputValue);
        }).catch(DefaultErrorHandler.handle);
    }

    protected notifyLoaded(items: OPTION_DATA_TYPE[], postLoaded?: boolean) {
        this.loadedListeners.forEach((listener) => {
            listener(items, postLoaded);
        });
    }

    private createCombobox(builder: BaseRichComboBoxBuilder<OPTION_DATA_TYPE, LOADER_DATA_TYPE>): BaseLoaderComboBox<OPTION_DATA_TYPE,
        LOADER_DATA_TYPE> {
        const comboBox = new BaseLoaderComboBox<OPTION_DATA_TYPE, LOADER_DATA_TYPE>(builder.comboBoxName, this.createComboboxConfig(
            builder), builder.loader);

        comboBox.onClicked(() => comboBox.giveFocus());

        return comboBox;
    }

    private handleLastRange(handler: () => void) {
        let grid = this.getComboBox().getComboBoxDropdownGrid().getGrid();

        grid.onShown(() => {
            if (this.interval) {
                clearInterval(this.interval);
            }
            this.interval = setInterval(() => {
                grid = this.getComboBox().getComboBoxDropdownGrid().getGrid();
                let canvas = grid.getCanvasNode();
                let canvasEl = new ElementHelper(canvas);
                let viewportEl = new ElementHelper(canvas.parentElement);

                let isLastRange = viewportEl.getScrollTop() >= canvasEl.getHeight() - 3 * viewportEl.getHeight();

                if (isLastRange) {
                    handler();
                }
            }, 200);
        });

        grid.onHidden(() => {
            if (this.interval) {
                clearInterval(this.interval);
            }
        });
    }

    private setupLoader() {

        this.comboBox.onOptionFilterInputValueChanged((event: OptionFilterInputValueChangedEvent) => {
            return this.reload(event.getNewValue());
        });

        this.loader.onLoadingData((event: LoadingDataEvent) => {
            if (!event.isPostLoad()) {
                this.comboBox.setEmptyDropdownText(i18n('field.search.inprogress'));
            }
            this.notifyLoading();
        });

        this.loader.onLoadedData(this.handleLoadedData.bind(this));

        this.loader.onErrorOccurred((event: LoaderErrorEvent) => {
            this.comboBox.hideDropdown();
            this.errorContainer.setHtml(event.getTextStatus()).show();
        });

        if (ObjectHelper.iFrameSafeInstanceOf(this.loader, PostLoader)) {
            this.handleLastRange((<PostLoader<any, LOADER_DATA_TYPE>>this.loader).postLoad.bind(this.loader));
        }
    }

    private handleLoadedData(event: LoadedDataEvent<LOADER_DATA_TYPE>) {
        this.errorContainer.hide();
        return this.createOptions(event.getData().map(this.loadedItemToDisplayValue.bind(this))).then(
            (options: Option<OPTION_DATA_TYPE>[]) => {
                this.comboBox.setOptions(options, event.isPostLoad());
                this.notifyLoaded(options.map((option) => option.displayValue), event.isPostLoad());
                return;
            });
    }

    private notifyLoading() {
        this.loadingListeners.forEach((listener) => {
            listener();
        });
    }
}

export class BaseRichComboBoxBuilder<OPTION_DATA_TYPE, LOADER_DATA_TYPE> {

    comboBoxName: string;

    loader: BaseLoader<any, LOADER_DATA_TYPE>;

    selectedOptionsView: SelectedOptionsView<OPTION_DATA_TYPE>;

    identifierMethod: string = 'getId';

    maximumOccurrences: number = 0;

    optionDisplayValueViewer: Viewer<OPTION_DATA_TYPE>;

    delayedInputValueChangedHandling: number;

    nextInputFocusWhenMaxReached: boolean = true;

    hideComboBoxWhenMaxReached: boolean = true;

    minWidth: number;

    maxHeight: number;

    value: string;

    noOptionsText: string;

    displayMissingSelectedOptions: boolean;

    removeMissingSelectedOptions: boolean;

    skipAutoDropShowOnValueChange: boolean;

    optionDataHelper: OptionDataHelper<OPTION_DATA_TYPE>;

    createColumns: GridColumn<OPTION_DATA_TYPE>[];

    requestMissingOptions: (missingOptionIds: string[]) => Q.Promise<Object>;

    setComboBoxName(comboBoxName: string): BaseRichComboBoxBuilder<OPTION_DATA_TYPE, LOADER_DATA_TYPE> {
        this.comboBoxName = comboBoxName;
        return this;
    }

    setIdentifierMethod(identifierMethod: string): BaseRichComboBoxBuilder<OPTION_DATA_TYPE, LOADER_DATA_TYPE> {
        this.identifierMethod = identifierMethod;
        return this;
    }

    setLoader(loader: BaseLoader<any, LOADER_DATA_TYPE>): BaseRichComboBoxBuilder<OPTION_DATA_TYPE, LOADER_DATA_TYPE> {
        this.loader = loader;
        return this;
    }

    setSelectedOptionsView(selectedOptionsView: SelectedOptionsView<OPTION_DATA_TYPE>): BaseRichComboBoxBuilder<OPTION_DATA_TYPE,
        LOADER_DATA_TYPE> {
        this.selectedOptionsView = selectedOptionsView;
        return this;
    }

    getSelectedOptionsView(): SelectedOptionsView<OPTION_DATA_TYPE> {
        return this.selectedOptionsView;
    }

    setMaximumOccurrences(maximumOccurrences: number): BaseRichComboBoxBuilder<OPTION_DATA_TYPE, LOADER_DATA_TYPE> {
        this.maximumOccurrences = maximumOccurrences;
        return this;
    }

    setOptionDisplayValueViewer(value: Viewer<OPTION_DATA_TYPE>): BaseRichComboBoxBuilder<OPTION_DATA_TYPE, LOADER_DATA_TYPE> {
        this.optionDisplayValueViewer = value;
        return this;
    }

    setDelayedInputValueChangedHandling(value: number): BaseRichComboBoxBuilder<OPTION_DATA_TYPE, LOADER_DATA_TYPE> {
        this.delayedInputValueChangedHandling = value;
        return this;
    }

    setNextInputFocusWhenMaxReached(value: boolean): BaseRichComboBoxBuilder<OPTION_DATA_TYPE, LOADER_DATA_TYPE> {
        this.nextInputFocusWhenMaxReached = value;
        return this;
    }

    setHideComboBoxWhenMaxReached(value: boolean): BaseRichComboBoxBuilder<OPTION_DATA_TYPE, LOADER_DATA_TYPE> {
        this.hideComboBoxWhenMaxReached = value;
        return this;
    }

    setMinWidth(value: number): BaseRichComboBoxBuilder<OPTION_DATA_TYPE, LOADER_DATA_TYPE> {
        this.minWidth = value;
        return this;
    }

    setMaxHeight(value: number): BaseRichComboBoxBuilder<OPTION_DATA_TYPE, LOADER_DATA_TYPE> {
        this.maxHeight = value;
        return this;
    }

    setValue(value: string): BaseRichComboBoxBuilder<OPTION_DATA_TYPE, LOADER_DATA_TYPE> {
        this.value = value;
        return this;
    }

    setNoOptionsText(value: string): BaseRichComboBoxBuilder<OPTION_DATA_TYPE, LOADER_DATA_TYPE> {
        this.noOptionsText = value;
        return this;
    }

    setDisplayMissingSelectedOptions(value: boolean): BaseRichComboBoxBuilder<OPTION_DATA_TYPE, LOADER_DATA_TYPE> {
        this.displayMissingSelectedOptions = value;
        return this;
    }

    setRemoveMissingSelectedOptions(value: boolean): BaseRichComboBoxBuilder<OPTION_DATA_TYPE, LOADER_DATA_TYPE> {
        this.removeMissingSelectedOptions = value;
        return this;
    }

    setSkipAutoDropShowOnValueChange(value: boolean): BaseRichComboBoxBuilder<OPTION_DATA_TYPE, LOADER_DATA_TYPE> {
        this.skipAutoDropShowOnValueChange = value;
        return this;
    }

    setOptionDataHelper(value: OptionDataHelper<OPTION_DATA_TYPE>): BaseRichComboBoxBuilder<OPTION_DATA_TYPE, LOADER_DATA_TYPE> {
        this.optionDataHelper = value;
        return this;
    }

    setCreateColumns(value: GridColumn<OPTION_DATA_TYPE>[]): BaseRichComboBoxBuilder<OPTION_DATA_TYPE, LOADER_DATA_TYPE> {
        this.createColumns = value;
        return this;
    }

    setRequestMissingOptions(requestMissingOptions: (missingOptionIds: string[]) => Q.Promise<Object>): BaseRichComboBoxBuilder<OPTION_DATA_TYPE, LOADER_DATA_TYPE> {
        this.requestMissingOptions = requestMissingOptions;
        return this;
    }

    build(): BaseRichComboBox<OPTION_DATA_TYPE, LOADER_DATA_TYPE> {
        return new BaseRichComboBox(this);
    }
}
