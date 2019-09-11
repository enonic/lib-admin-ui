import {Equitable} from '../../Equitable';

export class UploadProgressEvent<MODEL extends Equitable> {

    private uploadItem: UploadItem<MODEL>;

    constructor(uploadItem: UploadItem<MODEL>) {
        this.uploadItem = uploadItem;
    }

    getUploadItem(): UploadItem<MODEL> {
        return this.uploadItem;
    }

}
