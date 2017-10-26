module api.content.image {

    import Option = api.ui.selector.Option;
    import SelectedOptionsView = api.ui.selector.combobox.SelectedOptionsView;
    import ContentTypeName = api.schema.content.ContentTypeName;
    import OptionDataHelper = api.ui.selector.OptionDataHelper;
    import ComboBox = api.ui.selector.combobox.ComboBox;
    import ElementHelper = api.dom.ElementHelper;

    export class ImageContentComboBox
        extends ContentComboBox<ImageTreeSelectorItem> {

        constructor(builder: ImageContentComboBoxBuilder) {

            let loader = builder.loader ? builder.loader : ImageOptionDataLoader.create().setContent(builder.content).setContentTypeNames(
                [ContentTypeName.IMAGE.toString(), ContentTypeName.MEDIA_VECTOR.toString()]).build();

            builder.setLoader(loader);

            super(builder);

            this.addClass('image-combobox');

            this.initImagePreview();
        }

        private initImagePreview() {
            const preview = new ImageContentPreview();

            this.onMouseOver((e: MouseEvent) => {
                const helper = new ElementHelper((<HTMLElement>e.target));
                if (this.isThumbnailImage(helper)) {
                    preview.showFor(helper);
                }
            });

            preview.onSelected((id: string) => {
                this.selectOptionByValue(id);
            });
        }

        private isThumbnailImage(helper: ElementHelper): boolean {
            return helper.getTagName().toLowerCase() == 'img' && helper.hasAttribute('data-contentid');
        }

        getContent(contentId: ContentId): ContentSummary {
            let option = this.getOptionByValue(contentId.toString());
            if (option) {
                return (<ImageTreeSelectorItem>option.displayValue).getContentSummary();
            }
            return null;
        }

        getComboBox(): ComboBox<ImageTreeSelectorItem> {
            return <ComboBox<ImageTreeSelectorItem>>super.getComboBox();
        }

        protected createOption(data: Object, readOnly?: boolean): Option<ImageTreeSelectorItem> {

            let option;

            if (api.ObjectHelper.iFrameSafeInstanceOf(data, ImageTreeSelectorItem)) {
                option = this.optionsFactory.createOption(<ImageTreeSelectorItem>data, readOnly);
            } else if (api.ObjectHelper.iFrameSafeInstanceOf(data, ContentSummary)) {
                option = {
                    value: (<ContentSummary>data).getId(),
                    displayValue: new ImageTreeSelectorItem(<ContentSummary>data),
                    image: true
                };
            }

            return option;
        }

        getLoader(): ImageOptionDataLoader {
            return <ImageOptionDataLoader>super.getLoader();
        }

        public static create(): ImageContentComboBoxBuilder {
            return new ImageContentComboBoxBuilder();
        }
    }

    export class ImageContentComboBoxBuilder
        extends ContentComboBoxBuilder<ImageTreeSelectorItem> {

        comboBoxName: string = 'imageContentSelector';

        selectedOptionsView: SelectedOptionsView<ImageTreeSelectorItem> =
            <SelectedOptionsView<ImageTreeSelectorItem>> new ImageSelectorSelectedOptionsView();

        optionDisplayValueViewer: ImageSelectorViewer = new ImageSelectorViewer();

        loader: ImageOptionDataLoader;

        content: ContentSummary;

        setContent(value: ContentSummary): ImageContentComboBoxBuilder {
            this.content = value;
            return this;
        }

        setValue(value: string): ImageContentComboBoxBuilder {
            super.setValue(value);
            return this;
        }

        setMaximumOccurrences(value: number): ImageContentComboBoxBuilder {
            super.setMaximumOccurrences(value);
            return this;
        }

        setLoader(value: ImageOptionDataLoader): ImageContentComboBoxBuilder {
            super.setLoader(value);
            return this;
        }

        setMinWidth(value: number): ImageContentComboBoxBuilder {
            super.setMinWidth(value);
            return this;
        }

        setSelectedOptionsView(value: SelectedOptionsView<any>): ImageContentComboBoxBuilder {
            super.setSelectedOptionsView(value);
            return this;
        }

        setOptionDisplayValueViewer(value: ImageSelectorViewer): ImageContentComboBoxBuilder {
            super.setOptionDisplayValueViewer(value);
            return this;
        }

        setOptionDataHelper(value: OptionDataHelper<ImageTreeSelectorItem>): ImageContentComboBoxBuilder {
            super.setOptionDataHelper(value);
            return this;
        }

        setTreegridDropdownEnabled(value: boolean): ImageContentComboBoxBuilder {
            super.setTreegridDropdownEnabled(value);
            return this;
        }

        setTreeModeTogglerAllowed(value: boolean): ImageContentComboBoxBuilder {
            super.setTreeModeTogglerAllowed(value);
            return this;
        }

        build(): ImageContentComboBox {
            return new ImageContentComboBox(this);
        }

    }
}
