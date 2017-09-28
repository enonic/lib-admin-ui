module api.content.image {

    import Option = api.ui.selector.Option;
    import RichComboBox = api.ui.selector.combobox.RichComboBox;
    import RichComboBoxBuilder = api.ui.selector.combobox.RichComboBoxBuilder;
    import SelectedOptionsView = api.ui.selector.combobox.SelectedOptionsView;
    import ContentTypeName = api.schema.content.ContentTypeName;
    import OptionsFactory = api.ui.selector.OptionsFactory;
    import OptionDataHelper = api.ui.selector.OptionDataHelper;
    import ModeTogglerButton = api.content.button.ModeTogglerButton;
    import StringHelper = api.util.StringHelper;
    import ComboBoxConfig = api.ui.selector.combobox.ComboBoxConfig;

    export class ImageContentComboBox
        extends RichComboBox<ImageTreeSelectorItem> {

        protected optionsFactory: OptionsFactory<ImageTreeSelectorItem>;

        protected treegridDropdownEnabled: boolean;

        protected treeModeTogglerAllowed: boolean;

        protected initialTreeEnabledState: boolean;

        protected treeModeToggler: ModeTogglerButton;

        constructor(builder: ImageContentComboBoxBuilder) {

            let loader = builder.loader ? builder.loader : ImageOptionDataLoader.create().setContent(builder.content).setContentTypeNames(
                [ContentTypeName.IMAGE.toString(), ContentTypeName.MEDIA_VECTOR.toString()]).build();

            builder.setLoader(loader);

            super(builder);

            this.addClass('content-combo-box');

            this.treegridDropdownEnabled = builder.treegridDropdownEnabled;
            this.initialTreeEnabledState = this.treegridDropdownEnabled;

            this.treeModeTogglerAllowed = builder.treeModeTogglerAllowed;
            if (this.treeModeTogglerAllowed) {
                this.initTreeModeToggler();
            }

            this.optionsFactory = new OptionsFactory<ImageTreeSelectorItem>(loader, builder.optionDataHelper);

        }

        setContent(content: ContentSummary) {

            this.clearSelection();
            if (content) {
                let optionToSelect: Option<ImageTreeSelectorItem> = this.getOptionByValue(content.getContentId().toString());
                if (!optionToSelect) {
                    optionToSelect = this.createOption(content);
                    this.addOption(optionToSelect);
                }
                this.selectOption(optionToSelect);

            }
        }

        getContent(contentId: ContentId): ContentSummary {
            let option = this.getOptionByValue(contentId.toString());
            if (option) {
                return (<ImageTreeSelectorItem>option.displayValue).getContentSummary();
            }
            return null;
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

        protected createOptions(items: ImageTreeSelectorItem[]): wemQ.Promise<Option<ImageTreeSelectorItem>[]> {
            return this.optionsFactory.createOptions(items);
        }

        protected createOption(data: Object, readOnly?: boolean): Option<ImageTreeSelectorItem> {

            let option;

            if (api.ObjectHelper.iFrameSafeInstanceOf(data, ImageTreeSelectorItem)) {
                option = this.optionsFactory.createOption(<ImageTreeSelectorItem>data, readOnly);
            } else if (api.ObjectHelper.iFrameSafeInstanceOf(data, ContentSummary)) {
                option = {
                    value: (<ContentSummary>data).getId(),
                    displayValue: new ImageTreeSelectorItem(<ContentSummary>data, false),
                    disabled: null
                };
            }

            return option;
        }

        protected reload(inputValue: string): wemQ.Promise<any> {

            const deferred = wemQ.defer<void>();

            if (this.ifFlatLoadingMode(inputValue)) {
                this.getLoader().search(inputValue).then((result: ImageTreeSelectorItem[]) => {
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

        protected createComboboxConfig(builder: ImageContentComboBoxBuilder): ComboBoxConfig<ImageTreeSelectorItem> {
            const config: ComboBoxConfig<ImageTreeSelectorItem> = super.createComboboxConfig(builder);
            config.treegridDropdownAllowed = builder.treegridDropdownEnabled || builder.treeModeTogglerAllowed;

            return config;
        }

        getLoader(): ImageOptionDataLoader {
            return <ImageOptionDataLoader>super.getLoader();
        }

        private ifFlatLoadingMode(inputValue: string): boolean {
            return !this.treegridDropdownEnabled || (!this.treeModeTogglerAllowed && !StringHelper.isEmpty(inputValue));
        }

        public static create(): ImageContentComboBoxBuilder {
            return new ImageContentComboBoxBuilder();
        }
    }

    export class ImageContentComboBoxBuilder
        extends RichComboBoxBuilder<ImageTreeSelectorItem> {

        comboBoxName: string = 'imageContentSelector';

        selectedOptionsView: SelectedOptionsView<ImageTreeSelectorItem> =
            <SelectedOptionsView<ImageTreeSelectorItem>> new ImageSelectorSelectedOptionsView();

        optionDisplayValueViewer: ImageSelectorViewer = new ImageSelectorViewer();

        optionDataHelper: OptionDataHelper<ImageTreeSelectorItem> = new ContentSummaryOptionDataHelper();

        delayedInputValueChangedHandling: number = 750;

        maximumOccurrences: number = 0;

        loader: ImageOptionDataLoader;

        minWidth: number;

        treegridDropdownEnabled: boolean = false;

        treeModeTogglerAllowed: boolean = true;

        removeMissingSelectedOptions: boolean = true;

        displayMissingSelectedOptions: boolean = true;

        value: string;

        content: ContentSummary;

        setContent(value: ContentSummary): ImageContentComboBoxBuilder {
            this.content = value;
            return this;
        }

        setValue(value: string): ImageContentComboBoxBuilder {
            this.value = value;
            return this;
        }

        setMaximumOccurrences(maximumOccurrences: number): ImageContentComboBoxBuilder {
            this.maximumOccurrences = maximumOccurrences;
            return this;
        }

        setLoader(loader: ImageOptionDataLoader): ImageContentComboBoxBuilder {
            this.loader = loader;
            return this;
        }

        setMinWidth(value: number): ImageContentComboBoxBuilder {
            this.minWidth = value;
            return this;
        }

        setSelectedOptionsView(value: SelectedOptionsView<any>): ImageContentComboBoxBuilder {
            this.selectedOptionsView = value;
            return this;
        }

        setOptionDisplayValueViewer(value: ImageSelectorViewer): ImageContentComboBoxBuilder {
            this.optionDisplayValueViewer = value;
            return this;
        }

        setOptionDataHelper(value: OptionDataHelper<ImageTreeSelectorItem>): ImageContentComboBoxBuilder {
            this.optionDataHelper = value;
            return this;
        }

        setTreegridDropdownEnabled(value: boolean): ImageContentComboBoxBuilder {
            this.treegridDropdownEnabled = value;
            return this;
        }

        setTreeModeTogglerAllowed(value: boolean): ImageContentComboBoxBuilder {
            this.treeModeTogglerAllowed = value;
            return this;
        }

        build(): ImageContentComboBox {
            return new ImageContentComboBox(this);
        }

    }
}
