import {Equitable} from '../../Equitable';

export class UploadStartedEvent<ITEM extends Equitable> {

    private uploadItems: UploadItem<ITEM>[];

    constructor(uploadItems: UploadItem<ITEM>[]) {
        this.uploadItems = uploadItems;
    }

    getUploadItems(): UploadItem<ITEM>[] {
        return this.uploadItems;
    }
}
