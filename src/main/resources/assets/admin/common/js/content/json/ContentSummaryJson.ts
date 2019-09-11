import {ItemJson} from '../../item/ItemJson';
import {ThumbnailJson} from '../../thumb/ThumbnailJson';
import {ChildOrderJson} from './ChildOrderJson';
import {ContentPublishTimeRangeJson} from './ContentPublishTimeRangeJson';
import {WorkflowJson} from './WorkflowJson';

export interface ContentSummaryJson
    extends ItemJson {

    name: string;

    displayName: string;

    path: string;

    isRoot: boolean;

    hasChildren: boolean;

    type: string;

    iconUrl: string;

    thumbnail: ThumbnailJson;

    modifier: string;

    owner: string;

    isPage: boolean;

    isValid: boolean;

    requireValid: boolean;

    childOrder: ChildOrderJson;

    publish: ContentPublishTimeRangeJson;

    language: string;

    contentState: string;

    workflow: WorkflowJson;
}
