import {NodeEventJson, NodeEventNodeJson} from './NodeServerEvent';
import {NodeServerChangeItem} from './NodeServerChangeItem';

export enum NodeServerChangeType {
    UNKNOWN,
    PUBLISH,
    DUPLICATE,
    CREATE,
    UPDATE,
    DELETE,
    PENDING,
    RENAME,
    SORT,
    MOVE,
    UPDATE_PERMISSIONS
}

export abstract class NodeServerChange {

    private changeItems: NodeServerChangeItem[];

    private newNodePaths: string[];

    private type: NodeServerChangeType;

    constructor(builder: NodeServerChangeBuilder) {
        this.type = builder.type;
        this.changeItems = builder.changeItems;
        this.newNodePaths = builder.newNodePaths;
    }

    static fromJson(_nodeEventJson: NodeEventJson): NodeServerChange {
        throw new Error('Must be implemented by inheritors');
    }

    static getNodeServerChangeType(value: string): NodeServerChangeType {
        switch (value) {
        case 'node.pushed':
            return NodeServerChangeType.PUBLISH;
        case 'node.created':
            return NodeServerChangeType.CREATE;
        case 'node.updated':
            return NodeServerChangeType.UPDATE;
        case 'node.deleted':
            return NodeServerChangeType.DELETE;
        case 'node.duplicated':
            return NodeServerChangeType.DUPLICATE;
        case 'node.stateUpdated':
            return NodeServerChangeType.PENDING;
        case 'node.moved':
            return NodeServerChangeType.MOVE;
        case 'node.renamed':
            return NodeServerChangeType.RENAME;
        case 'node.sorted':
            return NodeServerChangeType.SORT;
        case 'node.permissionsUpdated':
            return NodeServerChangeType.UPDATE_PERMISSIONS;
        default:
            return NodeServerChangeType.UNKNOWN;
        }
    }

    getChangeItems(): NodeServerChangeItem[] {
        return this.changeItems;
    }

    getNewPaths(): string[] {
        return this.newNodePaths;
    }

    getChangeType(): NodeServerChangeType {
        return this.type;
    }

    toString(): string {
        return NodeServerChangeType[this.getChangeType()] + ': <' +
               this.getChangeItems().map((item) => item.getPath()).join(', ') + !!this.getNewPaths()
               ? this.getNewPaths().join(', ')
               : '' +
                 '>';
    }
}

export abstract class NodeServerChangeBuilder {

    changeItems: NodeServerChangeItem[];

    newNodePaths: string[];

    type: NodeServerChangeType;

    fromJson(json: NodeEventJson): NodeServerChangeBuilder {
        this.type = NodeServerChange.getNodeServerChangeType(json.type);
        this.changeItems = json.data.nodes
            .filter((node) => node.path.indexOf(this.getPathPrefix()) === 0)
            .map((node: NodeEventNodeJson) => this.nodeJsonToChangeItem(node));

        return this;
    }

    setChangeItems(value: NodeServerChangeItem[]): NodeServerChangeBuilder {
        this.changeItems = value;
        return this;
    }

    setNewNodePaths(value: string[]): NodeServerChangeBuilder {
        this.newNodePaths = value;
        return this;
    }

    setType(value: NodeServerChangeType): NodeServerChangeBuilder {
        this.type = value;
        return this;
    }

    abstract getPathPrefix(): string;

    abstract nodeJsonToChangeItem(node: NodeEventNodeJson): NodeServerChangeItem;

    abstract build(): NodeServerChange;
}
