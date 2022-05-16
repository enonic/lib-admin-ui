import {Viewer} from '../ui/Viewer';
import {Bucket} from './Bucket';
import {NamesView} from '../app/NamesView';
import {StringHelper} from '../util/StringHelper';


export class BucketViewer
    extends Viewer<Bucket> {

    private readonly namesView: NamesView;

    private displayNamePattern: string = '{0} ({1})';

    constructor(className?: string) {
        super('bucket-viewer ' + (className || ''));
        this.namesView = new NamesView();
        this.appendChild(this.namesView);
    }

    setObject(bucket: Bucket): void {
        this.namesView.setMainName(
            StringHelper.format(this.displayNamePattern, bucket.getDisplayName(), bucket.getDocCount()));

        return super.setObject(bucket);
    }
}
