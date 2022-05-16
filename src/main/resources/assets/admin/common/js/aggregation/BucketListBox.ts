import {Bucket} from './Bucket';
import {ListBox} from '../ui/selector/list/ListBox';
import {BucketViewer} from './BucketViewer';

export class BucketListBox
    extends ListBox<Bucket> {

    constructor() {
        super('bucket-listbox');
    }

    protected createItemView(item: Bucket, readOnly: boolean): BucketViewer {
        const viewer: BucketViewer = new BucketViewer();
        viewer.setObject(item);
        return viewer;
    }

    getItemId(item: Bucket): string {
        return item.getKey();
    }
}
