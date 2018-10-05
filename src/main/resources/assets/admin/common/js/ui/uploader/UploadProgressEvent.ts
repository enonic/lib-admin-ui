module api.ui.uploader {

    export class UploadProgressEvent<MODEL extends api.Equitable> {

        private uploadItem: UploadItem<MODEL>;

        constructor(uploadItem: UploadItem<MODEL>) {
            this.uploadItem = uploadItem;
        }

        getUploadItem(): UploadItem<MODEL> {
            return this.uploadItem;
        }

    }
}
