import {Equitable} from '../../Equitable';
import {UploadItem} from './UploadItem';

export class UploadStartedEvent<ITEM extends Equitable> {

    private uploadItems: UploadItem<ITEM>[];

    constructor(uploadItems: UploadItem<ITEM>[]) {
        this.uploadItems = uploadItems;
    }

    getUploadItems(): UploadItem<ITEM>[] {
        return this.uploadItems;
    }
}
