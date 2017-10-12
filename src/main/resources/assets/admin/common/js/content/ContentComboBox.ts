module api.content {

    import SelectedOption = api.ui.selector.combobox.SelectedOption;
    import Option = api.ui.selector.Option;
    import RichComboBox = api.ui.selector.combobox.RichComboBox;
    import RichComboBoxBuilder = api.ui.selector.combobox.RichComboBoxBuilder;
    import ContentTreeSelectorItem = api.content.resource.ContentTreeSelectorItem;
    import Viewer = api.ui.Viewer;
    import ContentRowFormatter = api.content.util.ContentRowFormatter;
    import i18n = api.util.i18n;
    import OptionsFactory = api.ui.selector.OptionsFactory;
    import StringHelper = api.util.StringHelper;
    import OptionDataHelper = api.ui.selector.OptionDataHelper;
    import ModeTogglerButton = api.content.button.ModeTogglerButton;
    import SelectedOptionsView = api.ui.selector.combobox.SelectedOptionsView;
    import ComboBoxConfig = api.ui.selector.combobox.ComboBoxConfig;

    export class ContentComboBox
        extends RichComboBox<ContentTreeSelectorItem> {

        protected optionsFactory: OptionsFactory<ContentTreeSelectorItem>;

        protected treegridDropdownEnabled: boolean;

        protected treeModeTogglerAllowed: boolean;

        protected initialTreeEnabledState: boolean;

        private showAfterReload: boolean;

        protected treeModeToggler: ModeTogglerButton;

        constructor(builder: ContentComboBoxBuilder) {

            const loader = builder.loader ? builder.loader : ContentSummaryOptionDataLoader.create().setLoadStatus(
                builder.showStatus).build();

            builder.setLoader(loader);

            if (builder.showStatus) {
                const columns = [new api.ui.grid.GridColumnBuilder().setId('status').setName('Status').setField(
                    'displayValue').setFormatter(
                    ContentRowFormatter.statusSelectorFormatter).setCssClass('status').setBoundaryWidth(75, 75).build()];

                builder.setCreateColumns(columns);
            }

            super(builder);

            this.addClass('content-combo-box');

            this.treegridDropdownEnabled = builder.treegridDropdownEnabled;
            this.initialTreeEnabledState = this.treegridDropdownEnabled;

            this.treeModeTogglerAllowed = builder.treeModeTogglerAllowed;
            if (this.treeModeTogglerAllowed) {
                this.initTreeModeToggler();
            }

            this.showAfterReload = false;

            this.optionsFactory = new OptionsFactory<ContentTreeSelectorItem>(this.getLoader(), builder.optionDataHelper);
        }

        getLoader(): ContentSummaryOptionDataLoader<ContentTreeSelectorItem> {
            return <ContentSummaryOptionDataLoader<ContentTreeSelectorItem>> super.getLoader();
        }

        getContent(contentId: ContentId): ContentSummary {
            let option = this.getOptionByValue(contentId.toString());
            if (option) {
                return option.displayValue.getContent();
            }
            return null;
        }

        setContent(content: ContentSummary) {

            this.clearSelection();
            if (content) {
                let optionToSelect: Option<ContentTreeSelectorItem> = this.getOptionByValue(content.getContentId().toString());
                if (!optionToSelect) {
                    optionToSelect = {
                        value: content.getContentId().toString(),
                        displayValue: new ContentTreeSelectorItem(content, false)
                    };
                    this.addOption(optionToSelect);
                }
                this.selectOption(optionToSelect);

            }
        }

        private initTreeModeToggler() {

            this.treeModeToggler = new ModeTogglerButton();
            this.treeModeToggler.setActive(this.treegridDropdownEnabled);
            this.getComboBox().prependChild(this.treeModeToggler);

            this.treeModeToggler.onActiveChanged(isActive => {
                this.treegridDropdownEnabled = isActive;
                this.reload(this.getComboBox().getInput().getValue());
            });

            this.onLoaded(() => {
                if (this.showAfterReload) {
                    this.getComboBox().getInput().setReadOnly(false);
                    this.showAfterReload = false;
                }
            });

            this.treeModeToggler.onClicked(() => {
                this.giveFocus();
                this.showAfterReload = true;

                this.getComboBox().showDropdown();
                this.getComboBox().setEmptyDropdownText('Searching...');
            });

            this.getComboBox().getInput().onValueChanged((event: ValueChangedEvent) => {

                if (this.initialTreeEnabledState && StringHelper.isEmpty(event.getNewValue())) {
                    if (!this.treeModeToggler.isActive()) {
                        this.treegridDropdownEnabled = true;
                        this.treeModeToggler.setActive(true, true);
                    }
                    return;
                }

                if (this.treeModeToggler.isActive()) {
                    this.treegridDropdownEnabled = false;
                    this.treeModeToggler.setActive(false, true);
                }

            });
        }

        protected createOptions(items: ContentTreeSelectorItem[]): wemQ.Promise<Option<ContentTreeSelectorItem>[]> {
            return this.optionsFactory.createOptions(items);
        }

        protected createOption(data: Object, readOnly?: boolean): Option<ContentTreeSelectorItem> {

            let option;

            if (api.ObjectHelper.iFrameSafeInstanceOf(data, ContentTreeSelectorItem)) {
                option = this.optionsFactory.createOption(<ContentTreeSelectorItem>data, readOnly);
            } else {
                option = {
                    value: (<ContentSummary>data).getId(),
                    displayValue: new ContentTreeSelectorItem(<ContentSummary>data, false),
                    disabled: null
                };
            }

            return option;
        }

        protected reload(inputValue: string, force: boolean = true): wemQ.Promise<any> {

            const deferred = wemQ.defer<void>();

            if(!force) {
                if(this.getOptions().length > 0) {
                    return wemQ(null);
                }
            }

            if (this.ifFlatLoadingMode(inputValue)) {
                this.getLoader().search(inputValue).then((result: ContentTreeSelectorItem[]) => {
                    deferred.resolve(null);
                }).catch((reason: any) => {
                    api.DefaultErrorHandler.handle(reason);
                }).done();
            } else {
                this.getLoader().setTreeFilterValue(inputValue);

                this.getComboBox().getComboBoxDropdownGrid().reload().then(() => {
                    if (this.getComboBox().isDropdownShown()) {
                        this.getComboBox().showDropdown();
                        this.getComboBox().getInput().setReadOnly(false);
                    }
                    this.notifyLoaded(this.getComboBox().getOptions().map(option => option.displayValue));

                    deferred.resolve(null);
                }).catch((reason: any) => {
                    api.DefaultErrorHandler.handle(reason);
                }).done();
            }

            return deferred.promise;
        }

        protected createComboboxConfig(builder: ContentComboBoxBuilder): ComboBoxConfig<ContentTreeSelectorItem> {
            const config = super.createComboboxConfig(builder);
            config.treegridDropdownAllowed = builder.treegridDropdownEnabled || builder.treeModeTogglerAllowed;

            return config;
        }

        private ifFlatLoadingMode(inputValue: string): boolean {
            return !this.treegridDropdownEnabled || (!this.treeModeTogglerAllowed && !StringHelper.isEmpty(inputValue));
        }

        public static create(): ContentComboBoxBuilder {
            return new ContentComboBoxBuilder();
        }
    }

    export class ContentSelectedOptionsView
        extends api.ui.selector.combobox.BaseSelectedOptionsView<ContentTreeSelectorItem> {

        createSelectedOption(option: api.ui.selector.Option<ContentTreeSelectorItem>): SelectedOption<ContentTreeSelectorItem> {
            let optionView = !!option.displayValue ? new ContentSelectedOptionView(option) : new MissingContentSelectedOptionView(option);
            return new SelectedOption<ContentTreeSelectorItem>(optionView, this.count());
        }
    }

    export class MissingContentSelectedOptionView
        extends api.ui.selector.combobox.BaseSelectedOptionView<ContentTreeSelectorItem> {

        private id: string;

        constructor(option: api.ui.selector.Option<ContentTreeSelectorItem>) {
            super(option);
            this.id = option.value;
        }

        doRender(): wemQ.Promise<boolean> {

            let removeButtonEl = new api.dom.AEl('remove');
            let message = new api.dom.H6El('missing-content');

            message.setHtml(i18n('field.content.noaccess', this.id));

            removeButtonEl.onClicked((event: Event) => {
                this.notifyRemoveClicked();

                event.stopPropagation();
                event.preventDefault();
                return false;
            });

            this.appendChildren<api.dom.Element>(removeButtonEl, message);

            return wemQ(true);
        }
    }

    export class ContentSelectedOptionView
        extends api.ui.selector.combobox.RichSelectedOptionView<ContentTreeSelectorItem> {

        constructor(option: api.ui.selector.Option<ContentTreeSelectorItem>) {
            super(
                new api.ui.selector.combobox.RichSelectedOptionViewBuilder<ContentTreeSelectorItem>(option)
                    .setEditable(true)
                    .setDraggable(true)
            );
        }

        resolveIconUrl(content: ContentTreeSelectorItem): string {
            return content.getIconUrl();
        }

        resolveTitle(content: ContentTreeSelectorItem): string {
            return content.getDisplayName().toString();
        }

        resolveSubTitle(content: ContentTreeSelectorItem): string {
            return content.getPath().toString();
        }

        protected createEditButton(content: ContentTreeSelectorItem): api.dom.AEl {
            let editButton = super.createEditButton(content);
            editButton.onClicked((event: Event) => {
                let model = [api.content.ContentSummaryAndCompareStatus.fromContentSummary(content.getContent())];
                new api.content.event.EditContentEvent(model).fire();
            });

            return editButton;
        }
    }

    export class ContentComboBoxBuilder
        extends RichComboBoxBuilder<ContentTreeSelectorItem> {

        comboBoxName: string = 'contentSelector';

        selectedOptionsView: SelectedOptionsView<ContentTreeSelectorItem> =
            <SelectedOptionsView<ContentTreeSelectorItem>> new ContentSelectedOptionsView();

        loader: ContentSummaryOptionDataLoader<ContentTreeSelectorItem>;

        optionDataHelper: OptionDataHelper<ContentTreeSelectorItem> = new ContentSummaryOptionDataHelper();

        optionDisplayValueViewer: Viewer<any> = <Viewer<any>>new ContentSummaryViewer();

        maximumOccurrences: number = 0;

        delayedInputValueChangedHandling: number = 750;

        minWidth: number;

        value: string;

        displayMissingSelectedOptions: boolean;

        removeMissingSelectedOptions: boolean;

        showStatus: boolean = false;

        treegridDropdownEnabled: boolean = false;

        treeModeTogglerAllowed: boolean = true;

        setTreegridDropdownEnabled(value: boolean): ContentComboBoxBuilder {
            this.treegridDropdownEnabled = value;
            return this;
        }

        setTreeModeTogglerAllowed(value: boolean): ContentComboBoxBuilder {
            this.treeModeTogglerAllowed = value;
            return this;
        }

        setShowStatus(value: boolean): ContentComboBoxBuilder {
            this.showStatus = value;
            return this;
        }

        setMaximumOccurrences(maximumOccurrences: number): ContentComboBoxBuilder {
            super.setMaximumOccurrences(maximumOccurrences);
            return this;
        }

        setComboBoxName(value: string): ContentComboBoxBuilder {
            super.setComboBoxName(value);
            return this;
        }

        setSelectedOptionsView(selectedOptionsView: SelectedOptionsView<ContentTreeSelectorItem>): ContentComboBoxBuilder {
            super.setSelectedOptionsView(selectedOptionsView);
            return this;
        }

        setLoader(loader: ContentSummaryOptionDataLoader<ContentTreeSelectorItem>): ContentComboBoxBuilder {
            super.setLoader(loader);
            return this;
        }

        setMinWidth(value: number): ContentComboBoxBuilder {
            super.setMinWidth(value);
            return this;
        }

        setValue(value: string): ContentComboBoxBuilder {
            super.setValue(value);
            return this;
        }

        setDelayedInputValueChangedHandling(value: number): ContentComboBoxBuilder {
            super.setDelayedInputValueChangedHandling(value ? value : 750);
            return this;
        }

        setDisplayMissingSelectedOptions(value: boolean): ContentComboBoxBuilder {
            super.setDisplayMissingSelectedOptions(value);
            return this;
        }

        setRemoveMissingSelectedOptions(value: boolean): ContentComboBoxBuilder {
            super.setRemoveMissingSelectedOptions(value);
            return this;
        }

        setSkipAutoDropShowOnValueChange(value: boolean): ContentComboBoxBuilder {
            super.setSkipAutoDropShowOnValueChange(value);
            return this;
        }

        setOptionDisplayValueViewer(value: Viewer<any>): ContentComboBoxBuilder {
            super.setOptionDisplayValueViewer(value ? value : new api.content.ContentSummaryViewer());
            return this;
        }

        setOptionDataHelper(value: OptionDataHelper<ContentTreeSelectorItem>): ContentComboBoxBuilder {
            super.setOptionDataHelper(value);
            return this;
        }

        build(): ContentComboBox {
            return new ContentComboBox(this);
        }

    }
}
