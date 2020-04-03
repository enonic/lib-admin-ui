import {TreeNode} from './TreeNode';

export class SelectionChange<DATA> {

    private added: TreeNode<DATA>[] = [];

    private removed: TreeNode<DATA>[] = [];

    constructor(added: TreeNode<DATA>[] = [], removed: TreeNode<DATA>[] = []) {
        this.added = added;
        this.removed = removed;
    }

    getAdded(): TreeNode<DATA>[] {
        return this.added.slice(0);
    }

    getRemoved(): TreeNode<DATA>[] {
        return this.removed.slice(0);
    }


}
