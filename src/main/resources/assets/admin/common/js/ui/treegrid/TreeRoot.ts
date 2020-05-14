import {TreeNode, TreeNodeBuilder} from './TreeNode';

export class TreeRoot<DATA> {

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

    resetCurrentRoot(rootData?: DATA) {
        if (this.isFiltered()) {
            this.resetFilteredRoot(rootData);
        } else {
            this.resetDefaultRoot(rootData);
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
}
