module api.ui.selector {

    import ElementHelper = api.dom.ElementHelper;
    import TreeNode = api.ui.treegrid.TreeNode;
    import Element = api.dom.Element;

    export class DropdownTreeGrid<OPTION_DISPLAY_VALUE> extends DropdownGrid<OPTION_DISPLAY_VALUE> {

        private optionsTreeGrid: OptionsTreeGrid<OPTION_DISPLAY_VALUE>;

        constructor(config: DropdownGridConfig<OPTION_DISPLAY_VALUE>) {
            super(config);

            this.optionsTreeGrid.getGrid().getDataView().onRowCountChanged(() => this.notifyRowCountChanged());
        }

        expandActiveRow() {
            if (!this.hasActiveRow()) {
                return;
            }
            this.optionsTreeGrid.expandRow(this.getActiveRow());
        }

        collapseActiveRow() {
            if (!this.hasActiveRow()) {
                return;
            }
            this.optionsTreeGrid.collapseRow(this.getActiveRow());
        }

        reload(): wemQ.Promise<void> {
            return this.optionsTreeGrid.reload();
        }

        setReadonlyChecker(checker: (optionToCheck: OPTION_DISPLAY_VALUE) => boolean) {
            this.optionsTreeGrid.setReadonlyChecker(checker);
        }

        presetDefaultOption(data: OPTION_DISPLAY_VALUE) {
            this.optionsTreeGrid.presetDefaultOption(data);
        }

        removeAllOptions() {
            this.optionsTreeGrid.removeAllOptions();
        }

        setOptions(options: Option<OPTION_DISPLAY_VALUE>[]) {
            this.optionsTreeGrid.setOptions(options);
        }

        addOption(option: Option<OPTION_DISPLAY_VALUE>) {
            this.optionsTreeGrid.addOption(option);
        }

        getSelectedOptions(): Option<OPTION_DISPLAY_VALUE>[] {
            return this.optionsTreeGrid.getSelectedNodes().map(selectedNode => {
                return this.getOptionByValue(selectedNode.getDataId());
            });
        }

        protected initGridAndData() {
            this.dataIdProperty = 'dataId';

            this.optionsTreeGrid = new OptionsTreeGrid<OPTION_DISPLAY_VALUE>(this.createColumns(),
                this.createOptions(),
                this.config.optionDataLoader,
                this.config.optionDataHelper);
        }

        protected initGridEventListeners() {
            this.getGrid().subscribeOnClick((e, args) => {
                const elem = new ElementHelper(e.target);

                let isCheckboxClicked = elem.hasClass('slick-cell-checkboxsel') || elem.hasAnyParentClass('slick-cell-checkboxsel');

                if (!elem.hasClass('expand collapse') && !isCheckboxClicked) {
                    //also should not be called for checkbox
                    this.notifyRowSelection(args.row);
                    e.preventDefault();
                    return false;
                }
            });

            this.getGrid().subscribeOnSelectedRowsChanged((_e, args) => {
                this.notifyMultipleSelection(args.rows);
            });
        }

        markSelections(selectedOptions: Option<OPTION_DISPLAY_VALUE>[], ignoreEmpty: boolean = false) {
            this.optionsTreeGrid.getRoot().clearStashedSelection();
            super.markSelections(selectedOptions, ignoreEmpty);
        }

        protected createColumns(): api.ui.grid.GridColumn<any>[] {
            let columnFormatter =
                (_row: number, _cell: number, value: OPTION_DISPLAY_VALUE, _columnDef: any, node: TreeNode<Option<OPTION_DISPLAY_VALUE>>) => {
                    if (value && node.getData().displayValue) {
                        this.optionDisplayValueViewer.setObject(value);
                        return this.optionDisplayValueViewer.toString();
                    }
                    return '';
                };

            const columns = [
                new api.ui.grid.GridColumnBuilder().setId('option').setName('Options').setField('displayValue').setFormatter(
                    columnFormatter).setBoundaryWidth(100, 9999).build()

            ];

            return this.config.createColumns ? columns.concat(this.config.createColumns) : columns;
        }

        getElement(): Element {
            return this.optionsTreeGrid;
        }

        getGrid(): api.ui.grid.Grid<TreeNode<Option<OPTION_DISPLAY_VALUE>>> {
            return this.optionsTreeGrid.getGrid();
        }

        protected getGridData(): api.ui.grid.DataView<TreeNode<Option<OPTION_DISPLAY_VALUE>>> {
            return this.optionsTreeGrid.getGrid().getDataView();
        }

        getOptionByRow(rowIndex: number): Option<OPTION_DISPLAY_VALUE> {
            const item = this.getGridData().getItem(rowIndex);
            return item ? item.getData() : null;
        }

        getOptionByValue(value: string): Option<OPTION_DISPLAY_VALUE> {
            const item = this.getGridData().getItemById(value);
            return item ? item.getData() : null;
        }
    }
}
