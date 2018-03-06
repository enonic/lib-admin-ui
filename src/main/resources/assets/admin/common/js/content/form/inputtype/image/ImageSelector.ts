module api.content.form.inputtype.image {

    import PropertyArray = api.data.PropertyArray;
    import Value = api.data.Value;
    import ValueType = api.data.ValueType;
    import ValueTypes = api.data.ValueTypes;
    import ContentSummary = api.content.ContentSummary;
    import ContentTypeName = api.schema.content.ContentTypeName;
    import ComboBox = api.ui.selector.combobox.ComboBox;
    import ResponsiveManager = api.ui.responsive.ResponsiveManager;
    import SelectedOption = api.ui.selector.combobox.SelectedOption;

    import UploadItem = api.ui.uploader.UploadItem;
    import FileUploadedEvent = api.ui.uploader.FileUploadedEvent;
    import FileUploadStartedEvent = api.ui.uploader.FileUploadStartedEvent;
    import FileUploadProgressEvent = api.ui.uploader.FileUploadProgressEvent;
    import FileUploadFailedEvent = api.ui.uploader.FileUploadFailedEvent;

    import SelectedOptionEvent = api.ui.selector.combobox.SelectedOptionEvent;

    import ContentInputTypeManagingAdd = api.content.form.inputtype.ContentInputTypeManagingAdd;
    import StringHelper = api.util.StringHelper;
    import ImageSelectorDisplayValue = api.content.image.ImageSelectorDisplayValue;
    import ImageSelectorSelectedOptionsView = api.content.image.ImageSelectorSelectedOptionsView;
    import ImageOptionDataLoader = api.content.image.ImageOptionDataLoader;
    import ImageSelectorSelectedOptionView = api.content.image.ImageSelectorSelectedOptionView;
    import ImageTreeSelectorItem = api.content.image.ImageTreeSelectorItem;

    export class ImageSelector
        extends ContentInputTypeManagingAdd<ImageTreeSelectorItem> {

        private contentComboBox: api.content.image.ImageContentComboBox;

        private selectedOptionsView: ImageSelectorSelectedOptionsView;

        // requests aren't allowed until allowed contentTypes are specified
        private contentRequestsAllowed: boolean = false;

        private uploader: api.content.image.ImageUploaderEl;

        private editContentRequestListeners: { (content: ContentSummary): void }[] = [];

        private treeMode: boolean;

        private hideToggleIcon: boolean;

        private isPreloaded: boolean = true;

        constructor(config: api.content.form.inputtype.ContentInputTypeViewContext) {
            super('image-selector', config);

            ResponsiveManager.onAvailableSizeChanged(this, () => this.availableSizeChanged());

            // Don't forget to clean up the modal dialog on remove
            this.onRemoved(() => ResponsiveManager.unAvailableSizeChanged(this));
        }

        public getContentComboBox(): api.content.image.ImageContentComboBox {
            return this.contentComboBox;
        }

        protected getContentPath(raw: ImageTreeSelectorItem): api.content.ContentPath {
            return raw.getContentSummary().getPath();
        }

        getValueType(): ValueType {
            return ValueTypes.REFERENCE;
        }

        newInitialValue(): Value {
            return null;
        }

        private getRemainingOccurrences(): number {
            let inputMaximum = this.getInput().getOccurrences().getMaximum();
            let countSelected = this.selectedOptionsView.count();
            let rest = -1;
            if (inputMaximum === 0) {
                rest = 0;
            } else {
                rest = inputMaximum - countSelected;
                rest = (rest === 0) ? -1 : rest;
            }

            return rest;
        }

        private createSelectedOptionsView(): ImageSelectorSelectedOptionsView {
            let selectedOptionsView = new ImageSelectorSelectedOptionsView();

            selectedOptionsView.onEditSelectedOptions((options: SelectedOption<ImageTreeSelectorItem>[]) => {
                options.forEach((option: SelectedOption<ImageTreeSelectorItem>) => {
                    this.notifyEditContentRequested(option.getOption().displayValue.getContentSummary());
                });
            });

            selectedOptionsView.onRemoveSelectedOptions((options: SelectedOption<ImageTreeSelectorItem>[]) => {
                options.forEach((option: SelectedOption<ImageTreeSelectorItem>) => {
                    this.contentComboBox.deselect(option.getOption().displayValue);
                });
                this.validate(false);
            });

            return selectedOptionsView;
        }

        createContentComboBox(maximumOccurrences: number,
                              inputName: string): api.content.image.ImageContentComboBox {

            let value = this.getPropertyArray().getProperties().map((property) => {
                return property.getString();
            }).join(';');

            this.isPreloaded = !StringHelper.isBlank(value);

            let contentTypes = this.allowedContentTypes.length
                ? this.allowedContentTypes : [ContentTypeName.IMAGE.toString(), ContentTypeName.MEDIA_VECTOR.toString()];

            const optionDataLoader = ImageOptionDataLoader
                .create()
                .setContent(this.config.content)
                .setInputName(inputName)
                .setAllowedContentPaths(this.allowedContentPaths)
                .setContentTypeNames(contentTypes)
                .setRelationshipType(this.relationshipType)
                .build();

            const contentComboBox: api.content.image.ImageContentComboBox
                = api.content.image.ImageContentComboBox.create()
                .setMaximumOccurrences(maximumOccurrences)
                .setLoader(optionDataLoader)
                .setSelectedOptionsView(this.selectedOptionsView = this.createSelectedOptionsView())
                .setValue(value)
                .setTreegridDropdownEnabled(this.treeMode)
                .setTreeModeTogglerAllowed(!this.hideToggleIcon)
                .build();

            let comboBox: ComboBox<ImageTreeSelectorItem> = contentComboBox.getComboBox();

            const onPreloadedData = (data: ImageTreeSelectorItem[]) => {
                data.forEach((item: ImageTreeSelectorItem) => {
                    this.contentComboBox.select(item);
                });
                this.isPreloaded = true;
                if (data.length > 0) {
                    this.validate(false);
                }
                optionDataLoader.unPreloadedData(onPreloadedData);
            };

            optionDataLoader.onPreloadedData(onPreloadedData);

            comboBox.onHidden(() => {
                // hidden on max occurrences reached
                if (this.uploader) {
                    this.uploader.hide();
                }
            });
            comboBox.onShown(() => {
                // shown on occurrences between min and max
                if (this.uploader) {
                    this.uploader.show();
                }
            });

            comboBox.onOptionDeselected((event: SelectedOptionEvent<ImageTreeSelectorItem>) => {
                // property not found.
                const option = event.getSelectedOption();
                if (option.getOption().displayValue.getContentSummary()) {
                    this.getPropertyArray().remove(option.getIndex());
                }
                this.validate(false);
            });

            comboBox.onContentMissing((ids: string[]) => {
                ids.forEach(id => this.removePropertyWithId(id));
                this.validate(false);
            });

            comboBox.onOptionSelected((event: SelectedOptionEvent<ImageTreeSelectorItem>) => {
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

            comboBox.onOptionMoved((moved: SelectedOption<ImageTreeSelectorItem>) => {

                this.getPropertyArray().set(moved.getIndex(), ValueTypes.REFERENCE.newValue(moved.getOption().value));
                this.validate(false);
            });

            return contentComboBox;
        }

        layout(input: api.form.Input, propertyArray: PropertyArray): wemQ.Promise<void> {
            if (!ValueTypes.REFERENCE.equals(propertyArray.getType())) {
                propertyArray.convertValues(ValueTypes.REFERENCE);
            }
            return super.layout(input, propertyArray).then(() => {
                this.contentComboBox = this.createContentComboBox(
                    input.getOccurrences().getMaximum(),
                    input.getName()
                );

                let comboBoxWrapper = new api.dom.DivEl('combobox-wrapper');

                comboBoxWrapper.appendChild(this.contentComboBox);

                this.contentRequestsAllowed = true;

                if (this.config.content) {
                    comboBoxWrapper.appendChild(this.createUploader());
                }

                this.appendChild(comboBoxWrapper);
                this.appendChild(this.selectedOptionsView);

                this.setLayoutInProgress(false);
            });
        }

        private removePropertyWithId(id: string) {
            let length = this.getPropertyArray().getSize();
            for (let i = 0; i < length; i++) {
                if (this.getPropertyArray().get(i).getValue().getString() === id) {
                    this.getPropertyArray().remove(i);
                    api.notify.NotifyManager.get().showWarning('Failed to load image with id ' + id +
                                                               '. The reference will be removed upon save.');
                    break;
                }
            }
        }

        update(propertyArray: PropertyArray, unchangedOnly?: boolean): wemQ.Promise<void> {
            return super.update(propertyArray, unchangedOnly).then(() => {
                if ((!unchangedOnly || !this.contentComboBox.isDirty()) && this.contentComboBox.isRendered()) {
                    this.contentComboBox.setValue(this.getValueFromPropertyArray(propertyArray));
                }
            });
        }

        reset() {
            this.contentComboBox.resetBaseValues();
        }

        private createUploader(): api.content.image.ImageUploaderEl {
            let multiSelection = (this.getInput().getOccurrences().getMaximum() !== 1);

            this.uploader = new api.content.image.ImageUploaderEl({
                params: {
                    parent: this.config.content.getContentId().toString()
                },
                operation: api.ui.uploader.MediaUploaderElOperation.create,
                name: 'image-selector-upload-dialog',
                showCancel: false,
                showResult: false,
                maximumOccurrences: this.getRemainingOccurrences(),
                allowMultiSelection: multiSelection,
                deferred: true
            });

            this.uploader.onUploadStarted((event: FileUploadStartedEvent<Content>) => {
                event.getUploadItems().forEach((uploadItem: UploadItem<Content>) => {
                    const value = new ImageTreeSelectorItem(null).setDisplayValue(
                        ImageSelectorDisplayValue.fromUploadItem(uploadItem));

                    const option = <api.ui.selector.Option<ImageTreeSelectorItem>>{
                        value: value.getId(),
                        displayValue: value
                    };
                    this.contentComboBox.selectOption(option);
                });
            });

            this.uploader.onUploadProgress((event: FileUploadProgressEvent<Content>) => {
                let item = event.getUploadItem();

                let selectedOption = this.selectedOptionsView.getById(item.getId());
                if (!!selectedOption) {
                    (<ImageSelectorSelectedOptionView> selectedOption.getOptionView()).setProgress(item.getProgress());
                }

                this.uploader.setMaximumOccurrences(this.getRemainingOccurrences());
            });

            this.uploader.onFileUploaded((event: FileUploadedEvent<Content>) => {
                let item = event.getUploadItem();
                let createdContent = item.getModel();

                //new api.content.ContentUpdatedEvent(this.config.contentId).fire();

                let selectedOption = this.selectedOptionsView.getById(item.getId());
                let option = selectedOption.getOption();
                option.displayValue = new ImageTreeSelectorItem(createdContent);
                option.value = createdContent.getContentId().toString();

                selectedOption.getOptionView().setOption(option);

                // checks newly uploaded image in Selected Options view
                let optionView: ImageSelectorSelectedOptionView = <ImageSelectorSelectedOptionView>selectedOption.getOptionView();
                optionView.getCheckbox().setChecked(true);

                this.setContentIdProperty(createdContent.getContentId());
                this.validate(false);

                this.uploader.setMaximumOccurrences(this.getRemainingOccurrences());
            });

            this.uploader.onUploadFailed((event: FileUploadFailedEvent<Content>) => {
                let item = event.getUploadItem();

                let selectedOption = this.selectedOptionsView.getById(item.getId());
                if (!!selectedOption) {
                    this.selectedOptionsView.removeSelectedOptions([selectedOption]);
                }

                this.uploader.setMaximumOccurrences(this.getRemainingOccurrences());
            });

            this.uploader.onClicked(() => {
                this.uploader.setMaximumOccurrences(this.getRemainingOccurrences());
            });

            //Drag N' Drop
            // in order to toggle appropriate class during drag event
            // we catch drag enter on this element and trigger uploader to appear,
            // then catch drag leave on uploader's dropzone to get back to previous state
            this.onDragEnter((event: DragEvent) => {
                event.stopPropagation();
                this.uploader.giveFocus();
                this.uploader.setDefaultDropzoneVisible(true, true);
            });

            this.uploader.onDropzoneDragLeave(() => {
                this.uploader.giveBlur();
                this.uploader.setDefaultDropzoneVisible(false);
            });

            this.uploader.onDropzoneDrop(() => {
                this.uploader.setMaximumOccurrences(this.getRemainingOccurrences());
                this.uploader.setDefaultDropzoneVisible(false);
            });

            return this.uploader;
        }

        protected getNumberOfValids(): number {
            return this.contentComboBox.countSelected();
        }

        giveFocus(): boolean {
            if (this.contentComboBox.maximumOccurrencesReached()) {
                return false;
            }
            return this.contentComboBox.giveFocus();
        }

        private setContentIdProperty(contentId: api.content.ContentId) {
            let reference = api.util.Reference.from(contentId);

            let value = new Value(reference, ValueTypes.REFERENCE);

            if (!this.getPropertyArray().containsValue(value)) {
                this.ignorePropertyChange = true;
                if (this.contentComboBox.countSelected() === 1) { // overwrite initial value
                    this.getPropertyArray().set(0, value);
                } else {
                    this.getPropertyArray().add(value);
                }
                this.ignorePropertyChange = false;
            }
        }

        protected readConfig(inputConfig: { [element: string]: { [name: string]: string }[]; }): void {
            const isTreeModeConfig = inputConfig['treeMode'] ? inputConfig['treeMode'][0] : {};
            this.treeMode = !StringHelper.isBlank(isTreeModeConfig['value']) ?
                            isTreeModeConfig['value'].toLowerCase() == 'true' : false;

            const hideToggleIconConfig = inputConfig['hideToggleIcon'] ? inputConfig['hideToggleIcon'][0] : {};
            this.hideToggleIcon = !StringHelper.isBlank(hideToggleIconConfig['value']) ?
                                  hideToggleIconConfig['value'].toLowerCase() == 'true' : false;

            super.readConfig(inputConfig);
        }

        displayValidationErrors(value: boolean) {
            if (this.isPreloaded) {
                super.displayValidationErrors(value);
            }
        }

        onFocus(listener: (event: FocusEvent) => void) {
            this.contentComboBox.onFocus(listener);
        }

        unFocus(listener: (event: FocusEvent) => void) {
            this.contentComboBox.unFocus(listener);
        }

        onBlur(listener: (event: FocusEvent) => void) {
            this.contentComboBox.onBlur(listener);
        }

        unBlur(listener: (event: FocusEvent) => void) {
            this.contentComboBox.unBlur(listener);
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
