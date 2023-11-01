import '@enonic/legacy-slickgrid/slick.core'; // This needs jQuery and probably jQuery UI.


import {GridColumn, GridColumnBuilder, GridColumnConfig} from '../grid/GridColumn';
import {GridOptions, GridOptionsBuilder} from '../grid/GridOptions';
import {TreeGridContextMenu} from './TreeGridContextMenu';
import {TreeNode} from './TreeNode';
import {TreeGrid} from './TreeGrid';
import {IDentifiable} from '../../IDentifiable';

export class TreeGridBuilder<NODE extends IDentifiable> {

    private showToolbar: boolean = true;

    private contextMenu: TreeGridContextMenu;

    private options: GridOptions<TreeNode<NODE>>;

    private columns: GridColumn<TreeNode<NODE>>[] = [];

    private classes: string = '';

    private autoLoad: boolean = true;

    private hotkeysEnabled: boolean = true;

    private partialLoadEnabled: boolean = false;

    private loadBufferSize: number = 0;

    private quietErrorHandling: boolean = false;

    private idPropertyName: string = 'id';

    private columnUpdater: () => void;

    private toggleClickEnabled: boolean = true;

    constructor(grid?: TreeGrid<NODE>) {
        if (grid) {
            this.showToolbar = grid.hasToolbar();
            this.contextMenu = grid.getContextMenu();
            this.classes = grid.getEl().getClass();
            this.initOptions()
                .copyColumns(grid.getColumns());
        } else {
            this.options = this.buildDefaultOptions();
            this.columns = this.buildDefaultColumns();
        }

        this.classes = 'tree-grid ' + this.classes;
    }

    /*
     Note: We are using a proxy class to handle items/nodes and
     track the selection, expansion, etc.
     To have access to the complex properties, that are not in the root
     of the object, like `node.data.id`, we need to specify a custom
     column value extractor.
     */
    nodeExtractor(node: any, column: Slick.Column<NODE>) {
        let names = column.field.split('.');
        let val = node['data'][names[0]];

        for (let i = 1; i < names.length; i++) {
            if (val && typeof val === 'object' && names[i] in val) {
                val = val[names[i]];
            } else {
                val = '';
            }
        }
        return val;
    }

    buildDefaultOptions(): GridOptions<TreeNode<NODE>> {
        return new GridOptionsBuilder<TreeNode<NODE>>()
            .setDataItemColumnValueExtractor(this.nodeExtractor)
            .setEditable(false)
            .setEnableAsyncPostRender(true)
            .setAutoRenderGridOnDataChanges(true)
            // It is necessary to turn off the library key handling. It may cause
            // the conflicts with Mousetrap, which leads to skipping the key events
            // Do not set to true, if you are not fully aware of the result
            .setEnableCellNavigation(false)
            .setEnableColumnReorder(false)
            .setForceFitColumns(true)
            .setHideColumnHeaders(true)
            .setCheckableRows(true)
            .setLeftAlignedCheckbox(true)
            .setRowHeight(45)
            .setHeight('100%')
            .setWidth('100%')
            .build();
    }

    buildDefaultColumns(): GridColumn<TreeNode<NODE>>[] {
        return [];
    }

    isShowToolbar(): boolean {
        return this.showToolbar;
    }

    getContextMenu(): TreeGridContextMenu {
        return this.contextMenu;
    }

    getOptions(): GridOptions<TreeNode<NODE>> {
        return this.options;
    }

    getColumns(): GridColumn<TreeNode<NODE>>[] {
        return this.columns;
    }

    getClasses(): string {
        return this.classes;
    }

    setShowToolbar(showToolbar: boolean): TreeGridBuilder<NODE> {
        this.showToolbar = showToolbar;
        return this;
    }

    setContextMenu(contextMenu: TreeGridContextMenu): TreeGridBuilder<NODE> {
        this.contextMenu = contextMenu;
        return this;
    }

    setOptions(options: GridOptions<TreeNode<NODE>>): TreeGridBuilder<NODE> {
        this.options = options;
        return this;
    }

    setColumns(columns: GridColumn<TreeNode<NODE>>[]): TreeGridBuilder<NODE> {
        this.columns = columns;
        return this;
    }

    setColumnConfig(columnConfig: GridColumnConfig[]): TreeGridBuilder<NODE> {
        columnConfig.forEach((column: GridColumnConfig) => {
            this.columns.push(this.buildColumn(column));
        });
        return this;
    }

    setClasses(classes: string): TreeGridBuilder<NODE> {
        this.classes = classes;
        return this;
    }

    prependClasses(classes: string): TreeGridBuilder<NODE> {
        this.classes = classes + ' ' + this.classes;
        return this;
    }

    setAutoLoad(autoLoad: boolean): TreeGridBuilder<NODE> {
        this.autoLoad = autoLoad;
        return this;
    }

    isAutoLoad(): boolean {
        return this.autoLoad;
    }

    setCheckableRows(checkable: boolean): TreeGridBuilder<NODE> {
        this.options.setCheckableRows(checkable);
        return this;
    }

    isCheckableRows(): boolean {
        return this.options.isCheckableRows();
    }

    setLeftAlignedCheckbox(value: boolean): TreeGridBuilder<NODE> {
        this.options.setLeftAlignedCheckbox(value);
        return this;
    }

    isLeftAlignedCheckbox(): boolean {
        return this.options.isLeftAlignedCheckbox();
    }

    setDragAndDrop(dragAndDrop: boolean): TreeGridBuilder<NODE> {
        this.options.setDragAndDrop(dragAndDrop);
        return this;
    }

    isDragAndDrop(): boolean {
        return this.options.isDragAndDrop();
    }

    setSelectedCellCssClass(selectedCellCss: string): TreeGridBuilder<NODE> {
        this.options.setSelectedCellCssClass(selectedCellCss);
        return this;
    }

    getSelectedCellCssClass(): string {
        return this.options.getSelectedCellCssClass();
    }

    disableMultipleSelection(disableMultipleSelection: boolean): TreeGridBuilder<NODE> {
        this.options.disableMultipleSelection(disableMultipleSelection);
        return this;
    }

    isMultipleSelectionDisabled(): boolean {
        return this.options.isMultipleSelectionDisabled();
    }

    setHotkeysEnabled(enabled: boolean): TreeGridBuilder<NODE> {
        this.hotkeysEnabled = enabled;
        return this;
    }

    isHotkeysEnabled(): boolean {
        return this.hotkeysEnabled;
    }

    setPartialLoadEnabled(enabled: boolean): TreeGridBuilder<NODE> {
        this.partialLoadEnabled = enabled;
        return this;
    }

    isPartialLoadEnabled(): boolean {
        return this.partialLoadEnabled;
    }

    setLoadBufferSize(loadBufferSize: number): TreeGridBuilder<NODE> {
        this.loadBufferSize = loadBufferSize;
        return this;
    }

    getLoadBufferSize(): number {
        return this.loadBufferSize;
    }

    setRowHeight(rowHeight: number): TreeGridBuilder<NODE> {
        this.options.rowHeight = rowHeight;
        return this;
    }

    setQuietErrorHandling(value: boolean): TreeGridBuilder<NODE> {
        this.quietErrorHandling = value;
        return this;
    }

    getQuietErrorHandling(): boolean {
        return this.quietErrorHandling;
    }

    setIdPropertyName(value: string): TreeGridBuilder<NODE> {
        this.idPropertyName = value;
        return this;
    }

    getIdPropertyName(): string {
        return this.idPropertyName;
    }

    setColumnUpdater(columnUpdater: () => void) {
        this.columnUpdater = columnUpdater;
    }

    getColumnUpdater(): () => void {
        return this.columnUpdater;
    }

    setToggleClickEnabled(toggleClickEnabled: boolean): TreeGridBuilder<NODE> {
        this.toggleClickEnabled = toggleClickEnabled;
        return this;
    }

    isToggleClickEnabled(): boolean {
        return this.toggleClickEnabled;
    }

    /**
     * Should be overriden by child class.
     */
    build(): TreeGrid<NODE> {
        return new TreeGrid<NODE>(this);
    }

    private initOptions(): TreeGridBuilder<NODE> {
        this.options = new GridOptionsBuilder<TreeNode<NODE>>().build();
        return this;
    }

    private copyColumns(columns: GridColumn<TreeNode<NODE>>[]): TreeGridBuilder<NODE> {
        this.columns = [];
        columns.forEach((column) => {
            this.columns.push(new GridColumnBuilder<TreeNode<NODE>>(column).build());
        });
        return this;
    }

    private buildColumn(columnConfig: GridColumnConfig) {

        return new GridColumnBuilder<TreeNode<NODE>>().setName(columnConfig.name).setId(columnConfig.id).setField(
            columnConfig.field).setFormatter(columnConfig.formatter).setCssClass(columnConfig.style.cssClass).setMinWidth(
            columnConfig.style.minWidth).setMaxWidth(columnConfig.style.maxWidth).setBehavior(columnConfig.behavior).build();
    }

}
