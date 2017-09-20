module api.content.image {

    import ContentSummaryLoader = api.content.resource.ContentSummaryLoader;
    import SelectedOption = api.ui.selector.combobox.SelectedOption;
    import Option = api.ui.selector.Option;
    import RichComboBox = api.ui.selector.combobox.RichComboBox;
    import RichComboBoxBuilder = api.ui.selector.combobox.RichComboBoxBuilder;
    import ContentQueryResultJson = api.content.json.ContentQueryResultJson;
    import ContentSummaryJson = api.content.json.ContentSummaryJson;
    import BaseLoader = api.util.loader.BaseLoader;
    import OptionDataLoader = api.ui.selector.OptionDataLoader;
    import SelectedOptionsView = api.ui.selector.combobox.SelectedOptionsView;
    import ContentTypeName = api.schema.content.ContentTypeName;
    import OptionsFactory = api.ui.selector.OptionsFactory;
    import StringHelper = api.util.StringHelper;
    import OptionDataHelper = api.ui.selector.OptionDataHelper;

    export class ImageContentComboBox extends RichComboBox<ImageTreeSelectorItem> {

        protected optionsFactory: OptionsFactory<ImageTreeSelectorItem>;

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
                .setTreegridDropdownEnabled(builder.treegridDropdownEnabled)
                // .setOptionDataLoader(builder.optionDataLoader)
                .setOptionDataHelper(optionHelper)
                .setRemoveMissingSelectedOptions(true)
                .setDisplayMissingSelectedOptions(true);

            // Actually the hack.
            // ImageSelectorSelectedOptionsView and BaseSelectedOptionsView<ContentSummary> are incompatible in loaders.
            super(<RichComboBoxBuilder<ImageTreeSelectorItem>>richComboBoxBuilder);

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

            if (!StringHelper.isBlank(inputValue)) {
                this.getLoader().search(inputValue).then((result: ImageTreeSelectorItem[]) => {
                    deferred.resolve(null);
                }).catch((reason: any) => {
                    api.DefaultErrorHandler.handle(reason);
                }).done();
            } else {
                this.getComboBox().getComboBoxDropdownGrid().reload().then(() => {
                    this.getComboBox().showDropdown();
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

        treegridDropdownEnabled: boolean;

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

        setTreegridDropdownEnabled(value: boolean): ImageContentComboBoxBuilder {
            this.treegridDropdownEnabled = value;
            return this;
        }

        build(): ImageContentComboBox {
            return new ImageContentComboBox(this);
        }

    }
}
