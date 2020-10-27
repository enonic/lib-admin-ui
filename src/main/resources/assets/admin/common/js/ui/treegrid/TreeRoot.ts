import {TreeNode, TreeNodeBuilder} from './TreeNode';
import {IDentifiable} from '../../IDentifiable';

export class TreeRoot<DATA extends IDentifiable> {

    private defaultRoot: TreeNode<DATA>;

    private filteredRoot: TreeNode<DATA>;

    private filtered: boolean;

    constructor() {
        this.defaultRoot = new TreeNodeBuilder<DATA>().setExpanded(true).build();
        this.filteredRoot = new TreeNodeBuilder<DATA>().setExpanded(true).build();

        this.filtered = false;
    }

    getDefaultRoot(): TreeNode<DATA> {
        return this.defaultRoot;
    }

    resetDefaultRoot(rootData?: DATA) {
        this.defaultRoot = new TreeNodeBuilder<DATA>().setExpanded(true).build();
        if (rootData) {
            this.defaultRoot.setData(rootData);
        }
    }

    getFilteredRoot(): TreeNode<DATA> {
        return this.filteredRoot;
    }

    resetFilteredRoot(rootData?: DATA) {
        this.filteredRoot = new TreeNodeBuilder<DATA>().setExpanded(true).build();
        if (rootData) {
            this.filteredRoot.setData(rootData);
        }
    }

    resetCurrentRoot() {
        if (this.isFiltered()) {
            this.resetFilteredRoot();
        } else {
            this.resetDefaultRoot();
        }

    }

    getCurrentRoot(): TreeNode<DATA> {
        return this.filtered ? this.filteredRoot : this.defaultRoot;
    }

    isFiltered(): boolean {
        return this.filtered;
    }

    setFiltered(filtered: boolean = true) {
        if (filtered) {
            // reset the filter on switch to filter
            this.filteredRoot = new TreeNodeBuilder<DATA>().setExpanded(true).build();
        }

        this.filtered = filtered;
    }

    getNodeByDataId(dataId: string): TreeNode<DATA> {
        return this.defaultRoot.findNode(dataId) || this.filteredRoot.findNode(dataId);
    }

    getNodeByDataIdFromCurrent(dataId: string): TreeNode<DATA> {
        return this.getCurrentRoot().findNode(dataId);
    }

    getNodeByDataIdFromDefault(dataId: string): TreeNode<DATA> {
        return this.getDefaultRoot().findNode(dataId);
    }

    getNodesByDataId(dataId: string): TreeNode<DATA>[] {
        const nodesToUpdate: TreeNode<DATA>[] = [];

        if (this.isFiltered()) {
            const nodeInFilteredRoot: TreeNode<DATA> = this.getFilteredRoot().findNode(dataId);

            if (nodeInFilteredRoot) {
                nodesToUpdate.push(nodeInFilteredRoot);
            }
        }

        const nodeInDefaultRoot: TreeNode<DATA> = this.getDefaultRoot().findNode(dataId);

        if (nodeInDefaultRoot) {
            nodesToUpdate.push(nodeInDefaultRoot);
        }

        return nodesToUpdate;
    }

    getAllDefaultRootNodes(): TreeNode<DATA>[] {
        return this.defaultRoot.treeToList(false, false);
    }

    getAllFilteredRootNodes(): TreeNode<DATA>[] {
        return this.filteredRoot.treeToList(false, false);
    }

    getAllNodes(): TreeNode<DATA>[] {
        return this.getAllDefaultRootNodes().concat(this.getAllFilteredRootNodes());
    }
}
