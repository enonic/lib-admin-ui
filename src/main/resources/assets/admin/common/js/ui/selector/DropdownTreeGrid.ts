import * as Q from 'q';
import {ElementHelper} from '../../dom/ElementHelper';
import {TreeNode} from '../treegrid/TreeNode';
import {Element} from '../../dom/Element';
import {GridColumn, GridColumnBuilder} from '../grid/GridColumn';
import {Grid} from '../grid/Grid';
import {DataView} from '../grid/DataView';
import {DropdownGrid, DropdownGridConfig} from './DropdownGrid';
import {OptionsTreeGrid} from './OptionsTreeGrid';
import {Option} from './Option';

export class DropdownTreeGrid<OPTION_DISPLAY_VALUE>
    extends DropdownGrid<OPTION_DISPLAY_VALUE> {

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

    reload(): Q.Promise<void> {
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

    updateOption(option: Option<OPTION_DISPLAY_VALUE>) {
        this.optionsTreeGrid.updateOption(option);
    }

    getSelectedOptions(): Option<OPTION_DISPLAY_VALUE>[] {
        return this.optionsTreeGrid.getSelectedNodes().map(selectedNode => {
            return this.getOptionByValue(selectedNode.getDataId());
        });
    }

    markSelections(selectedOptions: Option<OPTION_DISPLAY_VALUE>[], ignoreEmpty: boolean = false) {
        this.optionsTreeGrid.getRoot().clearStashedSelection();
        super.markSelections(selectedOptions, ignoreEmpty);
    }

    getElement(): Element {
        return this.optionsTreeGrid;
    }

    getGrid(): Grid<TreeNode<Option<OPTION_DISPLAY_VALUE>>> {
        return this.optionsTreeGrid.getGrid();
    }

    getOptionByRow(rowIndex: number): Option<OPTION_DISPLAY_VALUE> {
        const item = this.getGridData().getItem(rowIndex);
        return item ? item.getData() : null;
    }

    getOptionByValue(value: string): Option<OPTION_DISPLAY_VALUE> {
        const item = this.getGridData().getItemById(value);
        return item ? item.getData() : null;
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

    protected createColumns(): GridColumn<any>[] {
        let columnFormatter = ({}, {}, value: OPTION_DISPLAY_VALUE, {}, node: TreeNode<Option<OPTION_DISPLAY_VALUE>>) => {
            if (value && node.getData().displayValue) {
                this.optionDisplayValueViewer.setObject(value);
                return this.optionDisplayValueViewer.toString();
            }
            return '';
        };

        const columns = [
            new GridColumnBuilder().setId('option').setName('Options').setField('displayValue').setFormatter(
                columnFormatter).setBoundaryWidth(100, 9999).build()

        ];

        return this.config.createColumns ? columns.concat(this.config.createColumns) : columns;
    }

    protected getGridData(): DataView<TreeNode<Option<OPTION_DISPLAY_VALUE>>> {
        return this.optionsTreeGrid.getGrid().getDataView();
    }
}
