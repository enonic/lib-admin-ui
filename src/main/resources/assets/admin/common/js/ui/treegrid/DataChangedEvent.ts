import {TreeNode} from './TreeNode';

export enum DataChangedType {
    ADDED,
    UPDATED,
    DELETED
}

export class DataChangedEvent<DATA> {

    private treeNodes: TreeNode<DATA>[];

    private type: DataChangedType;

    constructor(treeNode: TreeNode<DATA>[], action: DataChangedType) {
        this.treeNodes = treeNode;
        this.type = action;
    }

    public getTreeNodes(): TreeNode<DATA>[] {
        return this.treeNodes;
    }

    public getType(): DataChangedType {
        return this.type;
    }

}
