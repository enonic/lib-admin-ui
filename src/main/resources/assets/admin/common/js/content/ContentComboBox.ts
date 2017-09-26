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

    export class ContentComboBox
        extends RichComboBox<ContentTreeSelectorItem> {

        protected optionsFactory: OptionsFactory<ContentTreeSelectorItem>;

        protected treegridDropdownEnabled: boolean;

        protected initialTreeEnabledState: boolean;

        protected treeModeToggler: ModeTogglerButton;

        constructor(builder: ContentComboBoxBuilder) {

            const loader = builder.loader ? builder.loader : ContentSummaryOptionDataLoader.create().setLoadStatus(
                builder.showStatus).build();

            const optionHelper = builder.optionDataHelper ? builder.optionDataHelper : new ContentSummaryOptionDataHelper();

            let richComboBoxBuilder = new RichComboBoxBuilder<ContentTreeSelectorItem>()
                .setComboBoxName(builder.name ? builder.name : 'contentSelector')
                .setLoader(loader)
                .setSelectedOptionsView(builder.selectedOptionsView || new ContentSelectedOptionsView())
                .setMaximumOccurrences(builder.maximumOccurrences)
                .setOptionDisplayValueViewer(builder.optionDisplayValueViewer || new api.content.ContentSummaryViewer())
                .setDelayedInputValueChangedHandling(builder.delayedInputValueChangedHandling || 750)
                .setValue(builder.value)
                .setDisplayMissingSelectedOptions(builder.displayMissingSelectedOptions)
                .setRemoveMissingSelectedOptions(builder.removeMissingSelectedOptions)
                .setSkipAutoDropShowOnValueChange(builder.skipAutoDropShowOnValueChange)
                .setTreegridDropdownAllowed(builder.treegridDropdownAllowed)
                .setOptionDataHelper(optionHelper)
                .setMinWidth(builder.minWidth);

            if (builder.showStatus) {
                const columns = [new api.ui.grid.GridColumnBuilder().setId('status').setName('Status').setField(
                    'displayValue').setFormatter(
                    ContentRowFormatter.statusSelectorFormatter).setCssClass('status').setBoundaryWidth(75, 75).build()];

                richComboBoxBuilder.setCreateColumns(columns);
            }

            super(richComboBoxBuilder);

            this.addClass('content-combo-box');

            if (builder.treegridDropdownAllowed) {
                this.treegridDropdownEnabled = builder.treegridDropdownEnabled;
                this.initTreeModeToggler();
            }
            this.initialTreeEnabledState = this.treegridDropdownEnabled;

            this.optionsFactory = new OptionsFactory<ContentTreeSelectorItem>(this.getLoader(), optionHelper);
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

            this.getComboBox().getInput().onValueChanged((event: ValueChangedEvent) => {

                if (!StringHelper.isEmpty(event.getNewValue())) {
                    if (this.treeModeToggler.isActive()) {
                        this.treegridDropdownEnabled = false;
                        this.treeModeToggler.setActive(false, true);
                    }
                } else {
                    if (!this.treeModeToggler.isActive() && this.initialTreeEnabledState) {
                        this.treegridDropdownEnabled = true;
                        this.treeModeToggler.setActive(true, true);
                    }
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

        protected reload(inputValue: string): wemQ.Promise<any> {

            const deferred = wemQ.defer<void>();

            if (!this.treegridDropdownEnabled) {
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
                    deferred.resolve(null);
                }).catch((reason: any) => {
                    api.DefaultErrorHandler.handle(reason);
                }).done();
            }

            return deferred.promise;
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

        name: string;

        maximumOccurrences: number = 0;

        loader: ContentSummaryOptionDataLoader<ContentTreeSelectorItem>;

        minWidth: number;

        value: string;

        optionDataHelper: OptionDataHelper<ContentTreeSelectorItem>;

        displayMissingSelectedOptions: boolean;

        removeMissingSelectedOptions: boolean;

        showStatus: boolean = false;

        treegridDropdownEnabled: boolean = false;

        setName(value: string): ContentComboBoxBuilder {
            this.name = value;
            return this;
        }

        setMaximumOccurrences(maximumOccurrences: number): ContentComboBoxBuilder {
            this.maximumOccurrences = maximumOccurrences;
            return this;
        }

        setLoader(loader: ContentSummaryOptionDataLoader<ContentTreeSelectorItem>): ContentComboBoxBuilder {
            this.loader = loader;
            return this;
        }

        setMinWidth(value: number): ContentComboBoxBuilder {
            this.minWidth = value;
            return this;
        }

        setValue(value: string): ContentComboBoxBuilder {
            this.value = value;
            return this;
        }

        setDisplayMissingSelectedOptions(value: boolean): ContentComboBoxBuilder {
            this.displayMissingSelectedOptions = value;
            return this;
        }

        setRemoveMissingSelectedOptions(value: boolean): ContentComboBoxBuilder {
            this.removeMissingSelectedOptions = value;
            return this;
        }

        setTreegridDropdownAllowed(value: boolean): ContentComboBoxBuilder {
            super.setTreegridDropdownAllowed(value);
            return this;
        }

        setTreegridDropdownEnabled(value: boolean): ContentComboBoxBuilder {
            this.treegridDropdownEnabled = value;
            return this;
        }

        setShowStatus(value: boolean): ContentComboBoxBuilder {
            this.showStatus = value;
            return this;
        }

        setOptionDisplayValueViewer(value: Viewer<any>): ContentComboBoxBuilder {
            super.setOptionDisplayValueViewer(value);
            return this;
        }

        setOptionDataHelper(value: OptionDataHelper<ContentTreeSelectorItem>): ContentComboBoxBuilder {
            this.optionDataHelper = value;
            return this;
        }

        build(): ContentComboBox {
            return new ContentComboBox(this);
        }

    }
}
