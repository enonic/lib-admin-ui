import {Equitable} from '../../Equitable';
import {UploadItem} from './UploadItem';

export class UploadFailedEvent<ITEM extends Equitable> {

    private uploadItem: UploadItem<ITEM>;

    constructor(uploadItem: UploadItem<ITEM>) {
        this.uploadItem = uploadItem;
    }

    getUploadItem(): UploadItem<ITEM> {
        return this.uploadItem;
    }
}
