import {NodeServerChange, NodeServerChangeItem, NodeServerChangeType} from '../../event/NodeServerChange';
import {NodeEventJson, NodeEventNodeJson} from '../../event/NodeServerEvent';

export class IssueServerChangeItem
    extends NodeServerChangeItem<string> {

    issueId: string;

    constructor(path: string, branch: string, issueId: string) {
        super(path, branch);
        this.issueId = issueId;
    }

    static fromJson(node: NodeEventNodeJson): IssueServerChangeItem {
        return new IssueServerChangeItem(node.path.substr('/issue'.length), node.branch, node.id);
    }

    getIssueId(): string {
        return this.issueId;
    }
}

export class IssueServerChange
    extends NodeServerChange<string> {
    constructor(type: NodeServerChangeType, changeItems: IssueServerChangeItem[], newPrincipalPaths?: string[]) {
        super(type, changeItems, newPrincipalPaths);
    }

    static fromJson(nodeEventJson: NodeEventJson): IssueServerChange {

        let changedItems = nodeEventJson.data.nodes.filter((node) => node.path.indexOf('/issue') === 0).map(
            (node: NodeEventNodeJson) => IssueServerChangeItem.fromJson(node));

        if (changedItems.length === 0) {
            return null;
        }

        let principalEventType = this.getNodeServerChangeType(nodeEventJson.type);
        return new IssueServerChange(principalEventType, changedItems);
    }

    toString(): string {
        return NodeServerChangeType[this.type] + ': <' +
               this.changeItems.map((item) => item.getPath()).join(', ') + !!this.newNodePaths
               ? this.newNodePaths.join(', ')
               : '' +
                 '>';
    }
}
