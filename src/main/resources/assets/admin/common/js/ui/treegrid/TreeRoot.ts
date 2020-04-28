import {TreeNode, TreeNodeBuilder} from './TreeNode';

export class TreeRoot<DATA> {

    private defaultRoot: TreeNode<DATA>;

    private filteredRoot: TreeNode<DATA>;

    private filtered: boolean;

    private currentSelection: TreeNode<DATA>[];

    private stashedSelection: TreeNode<DATA>[];

    constructor() {

        this.defaultRoot = new TreeNodeBuilder<DATA>().setExpanded(true).build();
        this.filteredRoot = new TreeNodeBuilder<DATA>().setExpanded(true).build();

        this.filtered = false;

        this.currentSelection = [];

        this.stashedSelection = [];
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
            this.stashSelection();
        } else if (this.filtered && !filtered) {
            // stash selection on switch from filter to default
            this.stashSelection();
        }

        this.filtered = filtered;
    }

    getCurrentSelection(): TreeNode<DATA>[] {
        return this.currentSelection;
    }

    setCurrentSelection(selection: TreeNode<DATA>[]) {
        this.currentSelection = selection;

        this.cleanStashedSelection();
    }

    getStashedSelection(): TreeNode<DATA>[] {
        return this.stashedSelection;
    }

    stashSelection() {
        this.stashedSelection = this.stashedSelection.concat(this.currentSelection);
        this.currentSelection = [];

        this.cleanStashedSelection();
    }

    getFullSelection(uniqueOnly: boolean = true): TreeNode<DATA>[] {
        let fullSelection = this.currentSelection.concat(this.stashedSelection);
        if (uniqueOnly) {
            let fullIds = fullSelection.map((el) => {
                return el.getDataId();
            });
            fullSelection = fullSelection.filter((value, index) => {
                return fullIds.indexOf(value.getDataId()) === index;
            });
        }

        fullSelection = fullSelection.filter((value) => {
            return !!value.getDataId();
        });

        return fullSelection;
    }

    clearStashedSelection() {
        this.stashedSelection = [];
    }

    private cleanStashedSelection() {
        const currentIds: string[] = this.currentSelection.map(el => el.getDataId());
        const stashedIds: string[] = this.stashedSelection.map(el => el.getDataId());

        this.stashedSelection = this.stashedSelection.filter((value, index) => {
            // remove duplicated nodes and those, that are already in `currentSelection`
            return (currentIds.indexOf(value.getDataId()) < 0) && (stashedIds.indexOf(value.getDataId()) === index);
        });
    }
}
