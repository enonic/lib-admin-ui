module api.content.image {

    import Option = api.ui.selector.Option;
    import RichComboBox = api.ui.selector.combobox.RichComboBox;
    import RichComboBoxBuilder = api.ui.selector.combobox.RichComboBoxBuilder;
    import SelectedOptionsView = api.ui.selector.combobox.SelectedOptionsView;
    import ContentTypeName = api.schema.content.ContentTypeName;
    import OptionsFactory = api.ui.selector.OptionsFactory;
    import OptionDataHelper = api.ui.selector.OptionDataHelper;
    import ModeTogglerButton = api.content.button.ModeTogglerButton;

    export class ImageContentComboBox extends RichComboBox<ImageTreeSelectorItem> {

        protected optionsFactory: OptionsFactory<ImageTreeSelectorItem>;

        protected treegridDropdownEnabled: boolean;

        constructor(builder: ImageContentComboBoxBuilder) {

            let loader = builder.loader ? builder.loader : ImageOptionDataLoader.create().setContent(builder.content).setContentTypeNames(
                [ContentTypeName.IMAGE.toString(), ContentTypeName.MEDIA_VECTOR.toString()]).build();

            const optionHelper = builder.optionDataHelper ? builder.optionDataHelper : new ContentSummaryOptionDataHelper();

            let richComboBoxBuilder = new RichComboBoxBuilder()
                .setComboBoxName(builder.name ? builder.name : 'imageContentSelector')
                .setLoader(loader)
                .setSelectedOptionsView(builder.selectedOptionsView || new ImageSelectorSelectedOptionsView())
                .setMaximumOccurrences(builder.maximumOccurrences)
                .setOptionDisplayValueViewer(new ImageSelectorViewer())
                .setDelayedInputValueChangedHandling(750)
                .setValue(builder.value)
                .setMinWidth(builder.minWidth)
                .setTreegridDropdownAllowed(true)
                .setOptionDataHelper(optionHelper)
                .setRemoveMissingSelectedOptions(true)
                .setDisplayMissingSelectedOptions(true);

            // Actually the hack.
            // ImageSelectorSelectedOptionsView and BaseSelectedOptionsView<ContentSummary> are incompatible in loaders.
            super(<RichComboBoxBuilder<ImageTreeSelectorItem>>richComboBoxBuilder);

            this.addClass('content-combo-box');

            if(builder.treegridDropdownAllowed) {
                this.treegridDropdownEnabled = builder.treegridDropdownEnabled;
                this.initTreeModeToggler();
            }

            this.optionsFactory = new OptionsFactory<ImageTreeSelectorItem>(loader, optionHelper);

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
            const modeToggler = new ModeTogglerButton();
            modeToggler.setActive(this.treegridDropdownEnabled);
            this.getComboBox().prependChild(modeToggler);

            modeToggler.onActiveChanged(isActive => {
                this.treegridDropdownEnabled = isActive;
                this.reload(this.getComboBox().getInput().getValue());
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

        protected reload(inputValue: string):wemQ.Promise<any> {

            const deferred = wemQ.defer<void>();

            if(!this.treegridDropdownEnabled) {
                this.getLoader().search(inputValue).then((result: ImageTreeSelectorItem[]) => {
                    deferred.resolve(null);
                }).catch((reason: any) => {
                    api.DefaultErrorHandler.handle(reason);
                }).done();
            } else {
                this.getLoader().setTreeFilterValue(inputValue);

                this.getComboBox().getComboBoxDropdownGrid().reload().then(() => {
                    if(this.getComboBox().isDropdownShown()) {
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

        getLoader(): ImageOptionDataLoader {
            return <ImageOptionDataLoader>super.getLoader();
        }

        public static create(): ImageContentComboBoxBuilder {
            return new ImageContentComboBoxBuilder();
        }
    }

    export class ImageContentComboBoxBuilder extends RichComboBoxBuilder<ImageTreeSelectorItem> {

        name: string;

        maximumOccurrences: number = 0;

        loader: ImageOptionDataLoader;

        minWidth: number;

        selectedOptionsView: SelectedOptionsView<any>;

        optionDisplayValueViewer: ImageSelectorViewer;

        optionDataHelper: OptionDataHelper<ImageTreeSelectorItem>;

        treegridDropdownEnabled: boolean = false;

        value: string;

        content: ContentSummary;

        setContent(value: ContentSummary): ImageContentComboBoxBuilder {
            this.content = value;
            return this;
        }

        setName(value: string): ImageContentComboBoxBuilder {
            this.name = value;
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

        setTreegridDropdownAllowed(value: boolean): ImageContentComboBoxBuilder {
            super.setTreegridDropdownAllowed(value);
            return this;
        }

        setTreegridDropdownEnabled(value: boolean): ImageContentComboBoxBuilder {
            this.treegridDropdownEnabled = value;
            return this;
        }

        build(): ImageContentComboBox {
            return new ImageContentComboBox(this);
        }

    }
}
