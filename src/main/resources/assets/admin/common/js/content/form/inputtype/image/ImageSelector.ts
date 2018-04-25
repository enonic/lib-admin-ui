module api.content.form.inputtype.image {

    import PropertyArray = api.data.PropertyArray;
    import ValueTypes = api.data.ValueTypes;
    import ContentSummary = api.content.ContentSummary;
    import ContentTypeName = api.schema.content.ContentTypeName;
    import ComboBox = api.ui.selector.combobox.ComboBox;
    import ResponsiveManager = api.ui.responsive.ResponsiveManager;
    import SelectedOption = api.ui.selector.combobox.SelectedOption;

    import FileUploadProgressEvent = api.ui.uploader.FileUploadProgressEvent;
    import FileUploadFailedEvent = api.ui.uploader.FileUploadFailedEvent;

    import SelectedOptionEvent = api.ui.selector.combobox.SelectedOptionEvent;

    import StringHelper = api.util.StringHelper;
    import ImageSelectorSelectedOptionsView = api.content.image.ImageSelectorSelectedOptionsView;
    import ImageOptionDataLoader = api.content.image.ImageOptionDataLoader;
    import ImageSelectorSelectedOptionView = api.content.image.ImageSelectorSelectedOptionView;
    import MediaTreeSelectorItem = api.content.media.MediaTreeSelectorItem;
    import MediaSelector = api.content.form.inputtype.mediaselector.MediaSelector;
    import ImageContentComboBox = api.content.image.ImageContentComboBox;
    import ImageUploaderEl = api.content.image.ImageUploaderEl;

    export class ImageSelector
        extends MediaSelector {

        private editContentRequestListeners: { (content: ContentSummary): void }[] = [];

        private isPendingPreload: boolean = true;

        constructor(config: api.content.form.inputtype.ContentInputTypeViewContext) {
            super(config);

            this.addClass('image-selector');

            ResponsiveManager.onAvailableSizeChanged(this, () => this.availableSizeChanged());

            // Don't forget to clean up the modal dialog on remove
            this.onRemoved(() => ResponsiveManager.unAvailableSizeChanged(this));
        }

        public getContentComboBox(): ImageContentComboBox {
            return <ImageContentComboBox>this.contentComboBox;
        }

        protected getContentPath(raw: MediaTreeSelectorItem): api.content.ContentPath {
            return raw.getContentSummary().getPath();
        }

        getSelectedOptionsView(): ImageSelectorSelectedOptionsView {
            return <ImageSelectorSelectedOptionsView>super.getSelectedOptionsView();
        }

        private createSelectedOptionsView(): ImageSelectorSelectedOptionsView {
            let selectedOptionsView = new ImageSelectorSelectedOptionsView();

            selectedOptionsView.onEditSelectedOptions((options: SelectedOption<MediaTreeSelectorItem>[]) => {
                options.forEach((option: SelectedOption<MediaTreeSelectorItem>) => {
                    this.notifyEditContentRequested(option.getOption().displayValue.getContentSummary());
                });
            });

            selectedOptionsView.onRemoveSelectedOptions((options: SelectedOption<MediaTreeSelectorItem>[]) => {
                options.forEach((option: SelectedOption<MediaTreeSelectorItem>) => {
                    this.contentComboBox.deselect(option.getOption().displayValue);
                });
                this.validate(false);
            });

            return selectedOptionsView;
        }

        protected createContentComboBox(input: api.form.Input, propertyArray: PropertyArray): api.content.image.ImageContentComboBox {

            let value = this.getPropertyArray().getProperties().map((property) => {
                return property.getString();
            }).join(';');

            this.isPendingPreload = !StringHelper.isBlank(value);

            let contentTypes = this.allowedContentTypes.length
                ? this.allowedContentTypes : [ContentTypeName.IMAGE.toString(), ContentTypeName.MEDIA_VECTOR.toString()];

            const optionDataLoader = ImageOptionDataLoader
                .create()
                .setContent(this.config.content)
                .setInputName(input.getName())
                .setAllowedContentPaths(this.allowedContentPaths)
                .setContentTypeNames(contentTypes)
                .setRelationshipType(this.relationshipType)
                .build();

            const contentComboBox: api.content.image.ImageContentComboBox
                = api.content.image.ImageContentComboBox.create()
                .setMaximumOccurrences(input.getOccurrences().getMaximum())
                .setLoader(optionDataLoader)
                .setSelectedOptionsView(this.createSelectedOptionsView())
                .setValue(value)
                .setTreegridDropdownEnabled(this.treeMode)
                .setTreeModeTogglerAllowed(!this.hideToggleIcon)
                .build();

            let comboBox: ComboBox<MediaTreeSelectorItem> = contentComboBox.getComboBox();

            const onPreloadedData = (data: MediaTreeSelectorItem[]) => {
                data.forEach((item: MediaTreeSelectorItem) => {
                    this.contentComboBox.select(item);
                });
                this.isPendingPreload = false;
                if (data.length > 0) {
                    this.validate(false);
                }
                optionDataLoader.unPreloadedData(onPreloadedData);
            };

            optionDataLoader.onPreloadedData(onPreloadedData);

            comboBox.onOptionDeselected((event: SelectedOptionEvent<MediaTreeSelectorItem>) => {
                // property not found.
                const option = event.getSelectedOption();
                if (option.getOption().displayValue.getContentSummary()) {
                    this.getPropertyArray().remove(option.getIndex());
                }
                this.validate(false);
            });

            comboBox.onOptionSelected((event: SelectedOptionEvent<MediaTreeSelectorItem>) => {
                this.fireFocusSwitchEvent(event);

                if (!this.isLayoutInProgress()) {
                    let contentId = event.getSelectedOption().getOption().displayValue.getContentId();
                    if (!contentId) {
                        return;
                    }

                    this.setContentIdProperty(contentId);
                }
                this.validate(false);
            });

            comboBox.onOptionMoved((moved: SelectedOption<MediaTreeSelectorItem>) => {

                this.getPropertyArray().set(moved.getIndex(), ValueTypes.REFERENCE.newValue(moved.getOption().value));
                this.validate(false);
            });

            return contentComboBox;
        }

        layout(input: api.form.Input, propertyArray: PropertyArray): wemQ.Promise<void> {
            return super.layout(input, propertyArray).then(() => {
                this.setLayoutInProgress(false);
            });
        }

        protected doLayout(propertyArray: PropertyArray): wemQ.Promise<void> {
            return wemQ(null);
        }

        protected createUploader(): wemQ.Promise<ImageUploaderEl> {
            let multiSelection = (this.getInput().getOccurrences().getMaximum() !== 1);

            const uploader = new api.content.image.ImageUploaderEl({
                params: {
                    parent: this.config.content.getContentId().toString()
                },
                operation: api.ui.uploader.MediaUploaderElOperation.create,
                name: 'image-selector-upload-dialog',
                showCancel: false,
                showResult: false,
                maximumOccurrences: this.getRemainingOccurrences(),
                allowMultiSelection: multiSelection
            });

            this.doInitUploader(uploader);

            return wemQ(uploader);

        }

        protected doInitUploader(uploader: ImageUploaderEl): ImageUploaderEl {

            super.doInitUploader(uploader);

            uploader.onUploadProgress((event: FileUploadProgressEvent<Content>) => {
                let item = event.getUploadItem();

                let selectedOption = this.getSelectedOptionsView().getById(item.getId());
                if (!!selectedOption) {
                    (<ImageSelectorSelectedOptionView> selectedOption.getOptionView()).setProgress(item.getProgress());
                }
            });

            return uploader;
        }

        protected selectedOptionHandler(selectedOption: SelectedOption<MediaTreeSelectorItem>) {
            (<ImageSelectorSelectedOptionView>selectedOption.getOptionView()).getCheckbox().setChecked(true);
        }

        protected initFailedListener(uploader: ImageUploaderEl) {
            uploader.onUploadFailed((event: FileUploadFailedEvent<Content>) => {
                let item = event.getUploadItem();

                let selectedOption = this.getSelectedOptionsView().getById(item.getId());
                if (!!selectedOption) {
                    this.getSelectedOptionsView().removeSelectedOptions([selectedOption]);
                }

                uploader.setMaximumOccurrences(this.getRemainingOccurrences());
            });
        }

        validate(silent: boolean = true,
                 rec: api.form.inputtype.InputValidationRecording = null): api.form.inputtype.InputValidationRecording {

            if (!this.isPendingPreload) {
                return super.validate(silent, rec);
            }

            return new api.form.inputtype.InputValidationRecording();
        }

        onEditContentRequest(listener: (content: ContentSummary) => void) {
            this.editContentRequestListeners.push(listener);
        }

        unEditContentRequest(listener: (content: ContentSummary) => void) {
            this.editContentRequestListeners = this.editContentRequestListeners
                .filter(function (curr: (content: ContentSummary) => void) {
                    return curr !== listener;
                });
        }

        private notifyEditContentRequested(content: ContentSummary) {
            this.editContentRequestListeners.forEach((listener) => {
                listener(content);
            });
        }
    }

    api.form.inputtype.InputTypeManager.register(new api.Class('ImageSelector', ImageSelector));

}
