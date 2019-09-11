import {NodeEventJson, NodeEventNodeJson} from '../../event/NodeServerEvent';
import {NodeServerChange, NodeServerChangeItem, NodeServerChangeType} from '../../event/NodeServerChange';
import {ContentPath} from '../ContentPath';
import {ContentId} from '../ContentId';

export class ContentServerChangeItem
    extends NodeServerChangeItem<ContentPath> {

    contentId: ContentId;

    constructor(contentPath: ContentPath, branch: string, contentId: ContentId) {
        super(contentPath, branch);
        this.contentId = contentId;
    }

    static fromJson(node: NodeEventNodeJson): ContentServerChangeItem {
        return new ContentServerChangeItem(ContentPath.fromString(node.path.substr('/content'.length)),
            node.branch, new ContentId(node.id));
    }

    getContentId(): ContentId {
        return this.contentId;
    }
}

export class ContentServerChange
    extends NodeServerChange<ContentPath> {

    protected changeItems: ContentServerChangeItem[];

    protected newContentPaths: ContentPath[];

    constructor(type: NodeServerChangeType, changeItems: ContentServerChangeItem[], newContentPaths?: ContentPath[]) {
        super(type, changeItems, newContentPaths);
    }

    static fromJson(nodeEventJson: NodeEventJson): ContentServerChange {

        let changeItems = nodeEventJson.data.nodes.filter((node) => node.path.indexOf('/content') === 0).map(
            (node: NodeEventNodeJson) => ContentServerChangeItem.fromJson(node));

        if (changeItems.length === 0) {
            return null;
        }

        let nodeEventType = this.getNodeServerChangeType(nodeEventJson.type);

        if (NodeServerChangeType.MOVE === nodeEventType || NodeServerChangeType.RENAME === nodeEventType) {

            let newContentPaths = nodeEventJson.data.nodes.filter((node) => node.newPath.indexOf('/content') === 0).map(
                (node: NodeEventNodeJson) => ContentPath.fromString(node.newPath.substr('/content'.length)));

            return new ContentServerChange(nodeEventType, changeItems, newContentPaths);
        } else {
            return new ContentServerChange(nodeEventType, changeItems);
        }
    }

    getChangeItems(): ContentServerChangeItem[] {
        return <ContentServerChangeItem[]>this.changeItems;
    }

    getNewContentPaths(): ContentPath[] {
        return this.newContentPaths;
    }

    toString(): string {
        return NodeServerChangeType[this.type] + ': <' +
               this.changeItems.map((item) => item.getPath().toString()).join(', ') + !!this.newContentPaths
               ? this.newContentPaths.map((contentPath) => contentPath.toString()).join(', ')
               : '' +
                 '>';
    }
}
