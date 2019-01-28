module api.ui.treegrid {

    export enum SelectionChangeType {
        ADDED,
        REMOVED,
        MIXED,
        NONE
    }

    export class TreeRoot<DATA> {

        private defaultRoot: TreeNode<DATA>;

        private filteredRoot: TreeNode<DATA>;

        private filtered: boolean;

        private selectionChangeType: SelectionChangeType;

        private currentSelection: TreeNode<DATA>[];

        private stashedSelection: TreeNode<DATA>[];

        constructor() {

            this.defaultRoot = new TreeNodeBuilder<DATA>().setExpanded(true).build();
            this.filteredRoot = new TreeNodeBuilder<DATA>().setExpanded(true).build();

            this.filtered = false;

            this.currentSelection = [];

            this.stashedSelection = [];

            this.selectionChangeType = SelectionChangeType.NONE;
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

        getSelectionChangeType(): SelectionChangeType {
            return this.selectionChangeType;
        }

        getCurrentSelection(): TreeNode<DATA>[] {
            return this.currentSelection;
        }

        calcSelectionChangeType(selection: TreeNode<DATA>[]): SelectionChangeType {
            const currentIds = this.currentSelection.map((el) => el.getDataId());
            const selectedIds = selection.map((el) => el.getDataId());

            const contains = (ids: string[], id: string) => ids.indexOf(id) > -1;
            const addedSelection = selectedIds.some(id => !contains(currentIds, id));
            const removedSelection = currentIds.some(id => !contains(selectedIds, id));

            if (addedSelection) {
                if (removedSelection) {
                    return SelectionChangeType.MIXED;
                }
                return SelectionChangeType.ADDED;
            } else if (removedSelection) {
                return SelectionChangeType.REMOVED;
            }
            return SelectionChangeType.NONE;
        }

        isSelectionChanged(): boolean {
            return this.selectionChangeType != null && this.selectionChangeType !== SelectionChangeType.NONE;
        }

        setCurrentSelection(selection: TreeNode<DATA>[]) {
            this.selectionChangeType = this.calcSelectionChangeType(selection);

            this.currentSelection = selection;

            if (this.isSelectionChanged()) {
                this.cleanStashedSelection();
            }
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

        private cleanStashedSelection() {
            let currentIds = this.currentSelection.map(el => el.getDataId());
            let stashedIds = this.stashedSelection.map(el => el.getDataId());

            this.stashedSelection = this.stashedSelection.filter((value, index) => {
                // remove duplicated nodes and those, that are already in `currentSelection`
                return (currentIds.indexOf(value.getDataId()) < 0) &&
                       (stashedIds.indexOf(value.getDataId()) === index);
            });
        }

        clearStashedSelection() {
            this.selectionChangeType = this.stashedSelection.length > 0 ? SelectionChangeType.REMOVED : SelectionChangeType.NONE;
            this.stashedSelection = [];
        }

        removeSelections(dataIds: string[]) {
            const currentSelectionSize = this.currentSelection.length;
            const stashedSelectionSize = this.stashedSelection.length;

            this.currentSelection = this.currentSelection.filter((el) => {
                return dataIds.indexOf(el.getDataId()) < 0;
            });
            this.stashedSelection = this.stashedSelection.filter((el) => {
                return dataIds.indexOf(el.getDataId()) < 0;
            });

            const selectionHasChanged = currentSelectionSize !== this.currentSelection.length ||
                                        stashedSelectionSize !== this.stashedSelection.length;
            this.selectionChangeType = selectionHasChanged ? SelectionChangeType.REMOVED : SelectionChangeType.NONE;
        }

        updateSelection(dataId: string, data: DATA) {
            this.currentSelection.forEach((el) => {
                if (el.getDataId() === dataId) { el.setData(data); }
            });
            this.stashedSelection.forEach((el) => {
                if (el.getDataId() === dataId) { el.setData(data); }
            });
        }
    }
}
