module api.content.form.inputtype.mediaselector {

    import ContentSelector = api.content.form.inputtype.contentselector.ContentSelector;
    import PropertyArray = api.data.PropertyArray;
    import MediaUploaderEl = api.ui.uploader.MediaUploaderEl;
    import FileUploadStartedEvent = api.ui.uploader.FileUploadStartedEvent;
    import UploadItem = api.ui.uploader.UploadItem;
    import FileUploadedEvent = api.ui.uploader.FileUploadedEvent;
    import ContentTypeName = api.schema.content.ContentTypeName;
    import ContentTreeSelectorItem = api.content.resource.ContentTreeSelectorItem;
    import ComboBox = api.ui.selector.combobox.ComboBox;
    import MediaTreeSelectorItem = api.content.media.MediaTreeSelectorItem;
    import MediaSelectorDisplayValue = api.content.media.MediaSelectorDisplayValue;
    import FileUploadFailedEvent = api.ui.uploader.FileUploadFailedEvent;
    import ValueTypes = api.data.ValueTypes;
    import Value = api.data.Value;
    import GetMimeTypesByContentTypeNamesRequest = api.schema.content.GetMimeTypesByContentTypeNamesRequest;
    import MediaUploaderElConfig = api.ui.uploader.MediaUploaderElConfig;

    export class MediaSelector
        extends ContentSelector {

        private uploader: MediaUploaderEl;

        constructor(config?: api.content.form.inputtype.ContentInputTypeViewContext) {
            super(config);
            this.addClass('media-selector');
        }

        layout(input: api.form.Input, propertyArray: PropertyArray): wemQ.Promise<void> {

            return super.layout(input, propertyArray).then(() => {
                /*    if(this.allowedContentTypes.length == 1 && this.allowedContentTypes[0] == ContentTypeName.NONE.toString()) {
                        return wemQ(null);
                    }*/
                return this.createUploader().then(() => {
                    this.comboBoxWrapper.appendChild(this.uploader);

                    if(!this.contentComboBox.getComboBox().isVisible()) {
                       this.uploader.hide();
                    }
                });
            });
        }

        protected readConfig(inputConfig: { [element: string]: { [name: string]: string }[]; }): void {
            super.readConfig(inputConfig);

            const allowedContentTypes: string[] = ContentTypeName.getMediaTypes().map(type => type.toString());
            let allowedMediaTypes: string[] = this.allowedContentTypes.filter(value => allowedContentTypes.indexOf(value) >= 0);

            if(allowedMediaTypes.length == 0) {
                allowedMediaTypes = allowedContentTypes;
            }
            /* if(allowedContentTypes.length > 0 && allowedMediaTypes.length == 0) {
                 this.allowedContentTypes = [ContentTypeName.NONE.toString()];
             } else {*/
            this.allowedContentTypes = allowedMediaTypes;
            // }
        }

        protected createOptionDataLoader() {
            return ContentSummaryOptionDataLoader.create()
                .setAllowedContentPaths(this.allowedContentPaths)
                .setContentTypeNames(this.allowedContentTypes)
                .setRelationshipType(this.relationshipType)
                .setContent(this.config.content)
                .setLoadStatus(this.showStatus)
                .build();

        }

        private createUploader(): wemQ.Promise<void> {
            let multiSelection = (this.getInput().getOccurrences().getMaximum() !== 1);

            const config: MediaUploaderElConfig = {
                params: {
                    parent: this.config.content.getContentId().toString()
                },
                operation: api.ui.uploader.MediaUploaderElOperation.create,
                name: 'media-selector-upload-dialog',
                showCancel: false,
                showResult: false,
                maximumOccurrences: this.getRemainingOccurrences(),
                allowMultiSelection: multiSelection
            };

            if (this.allowedContentTypes.length > 0) {
                return new GetMimeTypesByContentTypeNamesRequest(
                    this.allowedContentTypes.map(name => new ContentTypeName(name)))
                    .sendAndParse()
                    .then((mimeTypes: string[]) => {
                        config.allowMimeTypes = mimeTypes;
                        return this.doInitUploader(config);
                    });
            } else {
                return wemQ(this.doInitUploader(config));
            }
        }

        private doInitUploader(config: MediaUploaderElConfig) {

            this.uploader = new MediaUploaderEl(config);

            this.uploader.onUploadStarted((event: FileUploadStartedEvent<Content>) => {
                event.getUploadItems().forEach((uploadItem: UploadItem<Content>) => {
                    const value = new MediaTreeSelectorItem(null).setDisplayValue(
                        MediaSelectorDisplayValue.fromUploadItem(uploadItem));

                    const option = <api.ui.selector.Option<MediaTreeSelectorItem>>{
                        value: value.getId(),
                        displayValue: value
                    };
                    this.contentComboBox.selectOption(option);
                });
            });

            this.uploader.onUploadProgress(() => {
                this.uploader.setMaximumOccurrences(this.getRemainingOccurrences());
            });

            this.uploader.onFileUploaded((event: FileUploadedEvent<Content>) => {
                let item = event.getUploadItem();
                let createdContent = item.getModel();

                let selectedOption = this.getSelectedOptionsView().getById(item.getId());
                let option = selectedOption.getOption();
                option.displayValue = new MediaTreeSelectorItem(createdContent);
                option.value = createdContent.getContentId().toString();

                selectedOption.getOptionView().setOption(option);

                this.setContentIdProperty(createdContent.getContentId());
                this.validate(false);

                this.uploader.setMaximumOccurrences(this.getRemainingOccurrences());
            });

            this.uploader.onUploadFailed((event: FileUploadFailedEvent<Content>) => {
                let item = event.getUploadItem();

                let selectedOption = this.getSelectedOptionsView().getById(item.getId());
                if (!!selectedOption) {
                    this.getSelectedOptionsView().removeOption(selectedOption.getOption());
                }

                this.uploader.setMaximumOccurrences(this.getRemainingOccurrences());
            });

            this.uploader.onClicked(() => {
                this.uploader.setMaximumOccurrences(this.getRemainingOccurrences());
            });

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

            const comboBox: ComboBox<ContentTreeSelectorItem> = this.contentComboBox.getComboBox();

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
        }

        private getRemainingOccurrences(): number {
            let inputMaximum = this.getInput().getOccurrences().getMaximum();
            let countSelected = this.getSelectedOptionsView().count();
            let rest = -1;
            if (inputMaximum === 0) {
                rest = 0;
            } else {
                rest = inputMaximum - countSelected;
                rest = (rest === 0) ? -1 : rest;
            }

            return rest;
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
    }

    api.form.inputtype.InputTypeManager.register(new api.Class('MediaSelector', MediaSelector));
}
