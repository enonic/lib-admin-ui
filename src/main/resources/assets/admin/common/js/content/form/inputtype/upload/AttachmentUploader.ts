module api.content.form.inputtype.upload {
    import PropertyArray = api.data.PropertyArray;
    import ValueTypes = api.data.ValueTypes;
    import Attachment = api.content.attachment.Attachment;
    import FileUploaderEl = api.ui.uploader.FileUploaderEl;
    import AttachmentUploaderEl = api.content.attachment.AttachmentUploaderEl;

    export class AttachmentUploader extends FileUploader {

        constructor(config: api.content.form.inputtype.ContentInputTypeViewContext) {
            super(config);
            this.addClass('attachment-uploader');
            this.config = config;
        }

        layout(input: api.form.Input, propertyArray: PropertyArray): wemQ.Promise<void> {
            if (!ValueTypes.STRING.equals(propertyArray.getType())) {
                propertyArray.convertValues(ValueTypes.STRING);
            }

            return super.layout(input, propertyArray).then(() => {
                this.uploaderEl = this.createUploader();
                this.uploaderWrapper = this.createUploaderWrapper();

                this.update(propertyArray).done();

                this.uploaderEl.onUploadStarted(() => {
                    this.uploaderWrapper.removeClass('empty');
                });

                this.uploaderEl.onFileUploaded((event: api.ui.uploader.FileUploadedEvent<Attachment>) => {

                    let attachment = <Attachment>event.getUploadItem().getModel();

                    this.setFileNameProperty(attachment.getName().toString());

                    api.notify.showFeedback(`"${attachment.getName().toString()}" uploaded`);
                });

                this.uploaderEl.onUploadCompleted(() => {

                    this.validate(false);
                    new api.content.event.ContentRequiresSaveEvent(this.getContext().content.getContentId()).fire();

                });

                this.uploaderEl.onUploadFailed(() => {
                    this.uploaderEl.setProgressVisible(false);
                    this.uploaderWrapper.addClass('empty');
                });

                this.appendChild(this.uploaderWrapper);

                this.setLayoutInProgress(false);
                this.validate(false);

                return wemQ<void>(null);
            });
        }

        public giveFocus(): boolean {
            if (this.uploaderEl) {
                return this.uploaderEl.giveFocus();
            }
            return false;
        }

        protected getNumberOfValids(): number {
            return this.getPropertyArray().getProperties().length;
        }

        protected createUploader(): FileUploaderEl<any> {

            return new AttachmentUploaderEl({
                params: {
                    id: this.getContext().content.getContentId().toString()
                },
                operation: api.ui.uploader.MediaUploaderElOperation.update,
                name: this.getContext().input.getName(),
                showCancel: false,
                allowMultiSelection: this.getInput().getOccurrences().getMaximum() !== 1,
                hideDefaultDropZone: !!(<any>(this.config.inputConfig)).hideDropZone,
                deferred: true,
                maximumOccurrences: this.getInput().getOccurrences().getMaximum(),
                attachmentRemoveCallback: this.removeItemCallback.bind(this),
                attachmentAddCallback: this.addItemCallback.bind(this),
                hasUploadButton: false
            });
        }

        private removeItemCallback(itemName: string) {
            const values = this.getFileNamesFromProperty(this.getPropertyArray());

            const index = values.indexOf(itemName);
            values.splice(index, 1);

            (<AttachmentUploaderEl>this.uploaderEl).removeAttachmentItem(itemName);
            this.getPropertyArray().remove(index);

            this.updateOccurrences();

            new DeleteAttachmentRequest()
                .setContentId(this.getContext().content.getContentId())
                .addAttachmentName(itemName)
                .sendAndParse()
                .then((content: Content) => {
                    new api.content.event.ContentRequiresSaveEvent(content.getContentId()).fire();
                });
        }

        private addItemCallback() {
            this.updateOccurrences();
        }

        private updateOccurrences() {
            this.uploadButton.setVisible(!(<AttachmentUploaderEl>this.uploaderEl).maximumOccurrencesReached());
        }

    }
    api.form.inputtype.InputTypeManager.register(new api.Class('AttachmentUploader', AttachmentUploader));
}
