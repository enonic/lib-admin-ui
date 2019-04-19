module api.ui.selector.combobox {

    import OptionFilterInputValueChangedEvent = api.ui.selector.OptionFilterInputValueChangedEvent;
    import Viewer = api.ui.Viewer;
    import SelectedOption = api.ui.selector.combobox.SelectedOption;
    import Option = api.ui.selector.Option;
    import PostLoader = api.util.loader.PostLoader;
    import LoaderErrorEvent = api.util.loader.event.LoaderErrorEvent;
    import GridColumn = api.ui.grid.GridColumn;
    import StringHelper = api.util.StringHelper;
    import i18n = api.util.i18n;
    import KeyEventsHandler = api.event.KeyEventsHandler;

    export class RichComboBox<OPTION_DISPLAY_VALUE>
        extends api.dom.CompositeFormInputEl {

        private loader: api.util.loader.BaseLoader<any, OPTION_DISPLAY_VALUE>;

        private selectedOptionsView: SelectedOptionsView<OPTION_DISPLAY_VALUE>;

        private comboBox: LoaderComboBox<OPTION_DISPLAY_VALUE>;

        private errorContainer: api.dom.DivEl;

        private identifierMethod: string;

        private loadingListeners: { (): void; }[];

        private loadedListeners: { (items: OPTION_DISPLAY_VALUE[], postLoaded?: boolean): void; }[];

        private interval: number;

        public static debug: boolean = false;

        constructor(builder: RichComboBoxBuilder<OPTION_DISPLAY_VALUE>) {
            super();

            this.comboBox = this.createCombobox(builder);
            this.loader = builder.loader;
            this.loadedListeners = [];
            this.loadingListeners = [];
            this.identifierMethod = builder.identifierMethod;
            this.selectedOptionsView = builder.selectedOptionsView;
            this.errorContainer = new api.dom.DivEl('error-container');

            this.setupLoader();
            this.setWrappedInput(this.comboBox);
            this.setAdditionalElements(this.errorContainer, this.selectedOptionsView);

            if (!api.util.StringHelper.isBlank(builder.comboBoxName)) {
                this.setName(builder.comboBoxName);
            }
            if (!api.util.StringHelper.isBlank(builder.value)) {
                this.setIgnoreNextFocus(true); // do not move focus when setting original value
            }

            this.addClass('rich-combobox');
        }

        private createCombobox(builder: RichComboBoxBuilder<OPTION_DISPLAY_VALUE>): LoaderComboBox<OPTION_DISPLAY_VALUE> {
            let comboBox = new LoaderComboBox<OPTION_DISPLAY_VALUE>(builder.comboBoxName, this.createComboboxConfig(
                builder), builder.loader);

            comboBox.onClicked(() => comboBox.giveFocus());

            return comboBox;
        }

        protected createComboboxConfig(builder: RichComboBoxBuilder<OPTION_DISPLAY_VALUE>): ComboBoxConfig<OPTION_DISPLAY_VALUE> {
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
                optionDataLoader: api.ObjectHelper.iFrameSafeInstanceOf(builder.loader, OptionDataLoader)
                    ? <OptionDataLoader<OPTION_DISPLAY_VALUE>>builder.loader
                    : null,
                onDropdownShownCallback: this.loadOptionsAfterShowDropdown.bind(this),
                createColumns: builder.createColumns,
                requestMissingOptions: builder.requestMissingOptions,
                addNewOptionsToTheBottom: builder.addNewOptionsToTheBottom
            };
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
                    let canvasEl = new api.dom.ElementHelper(canvas);
                    let viewportEl = new api.dom.ElementHelper(canvas.parentElement);

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

        setIgnoreNextFocus(value: boolean = true): RichComboBox<OPTION_DISPLAY_VALUE> {
            this.comboBox.setIgnoreNextFocus(value);
            return this;
        }

        isIgnoreNextFocus(): boolean {
            return this.comboBox.isIgnoreNextFocus();
        }

        getSelectedDisplayValues(): OPTION_DISPLAY_VALUE[] {
            return this.comboBox.getSelectedOptions().map((option: Option<OPTION_DISPLAY_VALUE>) => {
                return option.displayValue;
            });
        }

        getSelectedValues(): string[] {
            return this.comboBox.getSelectedOptions().map((option: Option<OPTION_DISPLAY_VALUE>) => {
                return option.value;
            });
        }

        getDisplayValues(): OPTION_DISPLAY_VALUE[] {
            return this.comboBox.getOptions().map((option: Option<OPTION_DISPLAY_VALUE>) => {
                return option.displayValue;
            });
        }

        getSelectedOptions(): SelectedOption<OPTION_DISPLAY_VALUE>[] {
            return this.selectedOptionsView.getSelectedOptions();
        }

        getSelectedOption(option: Option<OPTION_DISPLAY_VALUE>): SelectedOption<OPTION_DISPLAY_VALUE> {
            return this.selectedOptionsView.getByOption(option);
        }

        getSelectedOptionByValue(value: string): SelectedOption<OPTION_DISPLAY_VALUE> {
            const option = this.getOptionByValue(value);
            return option && this.selectedOptionsView.getByOption(option);
        }

        getSelectedOptionView(): SelectedOptionsView<OPTION_DISPLAY_VALUE> {
            return this.selectedOptionsView;
        }

        isOptionSelected(option: Option<OPTION_DISPLAY_VALUE>): boolean {
            return this.comboBox.isOptionSelected(option);
        }

        maximumOccurrencesReached(): boolean {
            return this.comboBox.maximumOccurrencesReached();
        }

        getComboBox(): ComboBox<OPTION_DISPLAY_VALUE> {
            return this.comboBox;
        }

        addOption(option: Option<OPTION_DISPLAY_VALUE>) {
            this.comboBox.addOption(option);
        }

        updateOption(option: Option<OPTION_DISPLAY_VALUE>, displayValue: Object) {
            this.comboBox.updateOption(option, this.createOption(displayValue));
        }

        selectOption(option: Option<OPTION_DISPLAY_VALUE>, silent: boolean = false) {
            this.comboBox.selectOption(option, silent);
        }

        selectOptionByValue(value: string, silent: boolean = false) {
            const option: Option<OPTION_DISPLAY_VALUE> = this.getOptionByValue(value);
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

        getOptions(): Option<OPTION_DISPLAY_VALUE>[] {
            return this.comboBox.getOptions();
        }

        getOptionByValue(value: string): Option<OPTION_DISPLAY_VALUE> {
            return this.comboBox.getOptionByValue(value);
        }

        getOptionByRow(rowIndex: number): Option<OPTION_DISPLAY_VALUE> {
            return this.comboBox.getOptionByRow(rowIndex);
        }

        countSelected(): number {
            return this.comboBox.countSelectedOptions();
        }

        select(value: OPTION_DISPLAY_VALUE, readOnly?: boolean, silent?: boolean) {
            this.comboBox.selectOption(this.createOption(value, readOnly), silent);
        }

        deselect(value: OPTION_DISPLAY_VALUE, silent?: boolean) {
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

        isSelected(value: OPTION_DISPLAY_VALUE): boolean {
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

        protected getDisplayValueId(value: Object): string {
            let val = value[this.identifierMethod]();
            return typeof val === 'object' && val['toString'] ? val.toString() : val;
        }

        protected createOptions(items: any[]): wemQ.Promise<api.ui.selector.Option<OPTION_DISPLAY_VALUE>[]> {
            let options = [];
            items.forEach((itemInst: any) => {
                options.push(this.createOption(itemInst));
            });
            return wemQ(options);
        }

        protected createOption(value: Object, readOnly?: boolean): Option<OPTION_DISPLAY_VALUE> {
            return {
                value: this.getDisplayValueId(value),
                displayValue: <OPTION_DISPLAY_VALUE>value,
                readOnly: readOnly
            };
        }

        protected loadOptionsAfterShowDropdown(): wemQ.Promise<void> {
            return this.reload(this.comboBox.getInput().getValue());
        }

        protected reload(inputValue: string): wemQ.Promise<any> {
            if (!StringHelper.isBlank(inputValue)) {
                return this.loader.search(inputValue).catch(api.DefaultErrorHandler.handle);
            } else {
                this.loader.setSearchString(inputValue);
                return this.loader.load().catch(api.DefaultErrorHandler.handle);
            }
        }

        private setupLoader() {

            this.comboBox.onOptionFilterInputValueChanged((event: OptionFilterInputValueChangedEvent) => {
                return this.reload(event.getNewValue());
            });

            this.loader.onLoadingData((event: api.util.loader.event.LoadingDataEvent) => {
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

            if (api.ObjectHelper.iFrameSafeInstanceOf(this.loader, PostLoader)) {
                this.handleLastRange((<PostLoader<any, OPTION_DISPLAY_VALUE>>this.loader).postLoad.bind(this.loader));
            }
        }

        private handleLoadedData(event: api.util.loader.event.LoadedDataEvent<OPTION_DISPLAY_VALUE>) {
            this.errorContainer.hide();
            return this.createOptions(event.getData()).then(options => {
                this.comboBox.setOptions(options, event.isPostLoad());
                this.notifyLoaded(event.getData(), event.isPostLoad());
                return;
            });
        }

        getLoader(): api.util.loader.BaseLoader<any, OPTION_DISPLAY_VALUE> {
            return this.loader;
        }

        setInputIconUrl(url: string) {
            this.comboBox.setInputIconUrl(url);
        }

        onOptionDeselected(listener: { (option: SelectedOptionEvent<OPTION_DISPLAY_VALUE>): void; }) {
            this.comboBox.onOptionDeselected(listener);
        }

        unOptionDeselected(listener: { (removed: SelectedOptionEvent<OPTION_DISPLAY_VALUE>): void; }) {
            this.comboBox.unOptionDeselected(listener);
        }

        onOptionSelected(listener: { (option: SelectedOptionEvent<OPTION_DISPLAY_VALUE>): void; }) {
            this.comboBox.onOptionSelected(listener);
        }

        unOptionSelected(listener: { (option: SelectedOptionEvent<OPTION_DISPLAY_VALUE>): void; }) {
            this.comboBox.unOptionSelected(listener);
        }

        onOptionMoved(listener: { (option: SelectedOption<OPTION_DISPLAY_VALUE>, fromIndex: number): void; }) {
            this.comboBox.onOptionMoved(listener);
        }

        unOptionMoved(listener: { (option: SelectedOption<OPTION_DISPLAY_VALUE>, fromIndex: number): void; }) {
            this.comboBox.unOptionMoved(listener);
        }

        private notifyLoading() {
            this.loadingListeners.forEach((listener) => {
                listener();
            });
        }

        onLoading(listener: { (): void; }) {
            this.loadingListeners.push(listener);
        }

        unLoading(listener: { (): void; }) {
            let index = this.loadedListeners.indexOf(listener);
            this.loadedListeners.splice(index, 1);
        }

        onLoaded(listener: { (items: OPTION_DISPLAY_VALUE[], postLoaded?: boolean): void; }) {
            this.loadedListeners.push(listener);
        }

        unLoaded(listenerToBeRemoved: { (items: OPTION_DISPLAY_VALUE[], postLoaded?: boolean): void; }) {
            let index = this.loadedListeners.indexOf(listenerToBeRemoved);
            this.loadedListeners.splice(index, 1);
        }

        protected notifyLoaded(items: OPTION_DISPLAY_VALUE[], postLoaded?: boolean) {
            this.loadedListeners.forEach((listener) => {
                listener(items, postLoaded);
            });
        }

        onValueLoaded(listener: (options: Option<OPTION_DISPLAY_VALUE>[]) => void) {
            this.comboBox.onValueLoaded(listener);
        }

        unValueLoaded(listener: (options: Option<OPTION_DISPLAY_VALUE>[]) => void) {
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
    }

    export class RichComboBoxBuilder<T> {

        comboBoxName: string;

        loader: api.util.loader.BaseLoader<any, T>;

        selectedOptionsView: SelectedOptionsView<T>;

        identifierMethod: string = 'getId';

        maximumOccurrences: number = 0;

        optionDisplayValueViewer: Viewer<T>;

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

        addNewOptionsToTheBottom: boolean;

        optionDataHelper: OptionDataHelper<T>;

        createColumns: GridColumn<T>[];

        requestMissingOptions: (missingOptionIds: string[]) => wemQ.Promise<Object>;

        setComboBoxName(comboBoxName: string): RichComboBoxBuilder<T> {
            this.comboBoxName = comboBoxName;
            return this;
        }

        setIdentifierMethod(identifierMethod: string): RichComboBoxBuilder<T> {
            this.identifierMethod = identifierMethod;
            return this;
        }

        setLoader(loader: api.util.loader.BaseLoader<any, T>): RichComboBoxBuilder<T> {
            this.loader = loader;
            return this;
        }

        setSelectedOptionsView(selectedOptionsView: SelectedOptionsView<T>): RichComboBoxBuilder<T> {
            this.selectedOptionsView = selectedOptionsView;
            return this;
        }

        getSelectedOptionsView(): SelectedOptionsView<T> {
            return this.selectedOptionsView;
        }

        setMaximumOccurrences(maximumOccurrences: number): RichComboBoxBuilder<T> {
            this.maximumOccurrences = maximumOccurrences;
            return this;
        }

        setOptionDisplayValueViewer(value: Viewer<any>): RichComboBoxBuilder<T> {
            this.optionDisplayValueViewer = value;
            return this;
        }

        setDelayedInputValueChangedHandling(value: number): RichComboBoxBuilder<T> {
            this.delayedInputValueChangedHandling = value;
            return this;
        }

        setNextInputFocusWhenMaxReached(value: boolean): RichComboBoxBuilder<T> {
            this.nextInputFocusWhenMaxReached = value;
            return this;
        }

        setHideComboBoxWhenMaxReached(value: boolean): RichComboBoxBuilder<T> {
            this.hideComboBoxWhenMaxReached = value;
            return this;
        }

        setAddNewOptionsToTheBottom(value: boolean): RichComboBoxBuilder<T> {
            this.addNewOptionsToTheBottom = value;
            return this;
        }

        setMinWidth(value: number): RichComboBoxBuilder<T> {
            this.minWidth = value;
            return this;
        }

        setMaxHeight(value: number): RichComboBoxBuilder<T> {
            this.maxHeight = value;
            return this;
        }

        setValue(value: string): RichComboBoxBuilder<T> {
            this.value = value;
            return this;
        }

        setNoOptionsText(value: string): RichComboBoxBuilder<T> {
            this.noOptionsText = value;
            return this;
        }

        setDisplayMissingSelectedOptions(value: boolean): RichComboBoxBuilder<T> {
            this.displayMissingSelectedOptions = value;
            return this;
        }

        setRemoveMissingSelectedOptions(value: boolean): RichComboBoxBuilder<T> {
            this.removeMissingSelectedOptions = value;
            return this;
        }

        setSkipAutoDropShowOnValueChange(value: boolean): RichComboBoxBuilder<T> {
            this.skipAutoDropShowOnValueChange = value;
            return this;
        }

        setOptionDataHelper(value: OptionDataHelper<T>): RichComboBoxBuilder<T> {
            this.optionDataHelper = value;
            return this;
        }

        setCreateColumns(value: GridColumn<T>[]): RichComboBoxBuilder<T> {
            this.createColumns = value;
            return this;
        }

        setRequestMissingOptions(requestMissingOptions: (missingOptionIds: string[]) => wemQ.Promise<Object>): RichComboBoxBuilder<T> {
            this.requestMissingOptions = requestMissingOptions;
            return this;
        }

        build(): RichComboBox<T> {
            return new RichComboBox(this);
        }
    }

}
