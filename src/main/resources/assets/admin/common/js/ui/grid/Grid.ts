/// <reference types="slickgrid/slick.checkboxselectcolumn" />
/// <reference types="slickgrid/slick.rowselectionmodel" />
import * as Q from 'q';
import {ResponsiveManager} from '../responsive/ResponsiveManager';
import {DivEl} from '../../dom/DivEl';
import {LoadMask} from '../mask/LoadMask';
import {AppHelper} from '../../util/AppHelper';
import {GridOptions, GridOptionsBuilder} from './GridOptions';
import {GridColumn} from './GridColumn';
import {GridOnClickData} from './GridOnClickData';
import {DataView} from './DataView';
import {EventBus} from '../../event/EventBus';
import {GridSelectionHelper} from './GridSelectionHelper';
import {ElementHelper} from '../../dom/ElementHelper';

export class Grid<T extends Slick.SlickData>
    extends DivEl {

    public static debug: boolean = false;
    protected loadMask: LoadMask;
    private defaultHeight: string = '400px';
    private defaultWidth: string = '800px';
    private defaultAutoRenderGridOnDataChanges: boolean = true;
    private slickGrid: Slick.Grid<T>;
    private dataView: DataView<T>;
    private checkboxSelectorPlugin: Slick.CheckboxSelectColumn<T>; // CheckboxSelectColumn
    private rowManagerPlugin: Slick.RowMoveManager<T>; // RowMoveManager
    private debounceSelectionChange: boolean;
    private onClickListeners: ((e: any, args: any) => void) [] = [];

    constructor(dataView: DataView<T>, gridColumns?: GridColumn<T>[], gridOptions?: GridOptions<T>) {
        super('grid');

        let options = gridOptions || this.createOptions();
        let columns = gridColumns || this.createColumns();

        if (options.isHideColumnHeaders()) {
            this.addClass('no-header');
        }

        if (options.isCheckableRows()) {
            this.checkboxSelectorPlugin = new Slick.CheckboxSelectColumn({
                cssClass: 'slick-cell-checkboxsel',
                width: 40
            });

            if (options.isLeftAlignedCheckbox()) {
                columns.unshift(this.checkboxSelectorPlugin.getColumnDefinition() as GridColumn<T>);
            } else {
                columns.push(this.checkboxSelectorPlugin.getColumnDefinition() as GridColumn<T>);
            }
        }

        if (options.isDragAndDrop()) {
            this.rowManagerPlugin = new Slick.RowMoveManager({
                cancelEditOnDrag: true
            });
        }
        this.getEl().setHeight(options.getHeight() || this.defaultHeight);
        this.getEl().setWidth(options.getWidth() || this.defaultWidth);
        this.dataView = dataView;
        this.slickGrid = new Slick.Grid<T>(this.getHTMLElement(), dataView.slick(), columns, options);
        if (options.isAutoRenderGridOnDataChanges() ||
            (options.isAutoRenderGridOnDataChanges() == null && this.defaultAutoRenderGridOnDataChanges)) {
            this.autoRenderGridOnDataChanges(this.dataView);
        }
        if (this.checkboxSelectorPlugin != null) {
            this.slickGrid.registerPlugin(this.checkboxSelectorPlugin as Slick.Plugin<T>);
        }
        if (this.rowManagerPlugin != null) {
            this.slickGrid.registerPlugin(this.rowManagerPlugin as Slick.Plugin<T>);
        }

        if (options.isRerenderOnResize() !== false) {
            ResponsiveManager.onAvailableSizeChanged(this, () => {
                // notify slick grid the resize has occured
                const slickResize = EventBus.createEvent('resize');
                this.getHTMLElement().dispatchEvent(slickResize);
            });
            this.onRemoved(() => ResponsiveManager.unAvailableSizeChanged(this));
        }

        // The only way to dataIdProperty before adding items
        this.dataView.setItems([], options.getDataIdProperty());

        let clickListener = AppHelper.debounce((e, args) => {
            this.notifyClicked(e, args);
        }, 50);

        this.slickGrid.onClick.subscribe(clickListener);
    }

    mask() {
        if (this.isVisible()) {
            if (!this.loadMask && this.isAdded()) {
                this.createLoadMask();
            }
            if (this.loadMask) {
                this.loadMask.show();
            }
        }
    }

    unmask() {
        if (this.loadMask) {
            this.loadMask.hide();
        }

    }

    setSelectionModel(selectionModel: Slick.SelectionModel<T, any>) {
        this.slickGrid.setSelectionModel(selectionModel);
    }

    getDataView(): DataView<T> {
        return this.dataView;
    }

    getDataLength(): number {
        return this.slickGrid.getDataLength();
    }

    setColumns(columns: GridColumn<T>[], toBegin: boolean = false) {
        if (this.checkboxSelectorPlugin) {
            let pluginColumn = this.checkboxSelectorPlugin.getColumnDefinition();
            if (toBegin) {
                columns.push(pluginColumn as GridColumn<T>);
            } else {
                columns.unshift(pluginColumn as GridColumn<T>);
            }
        }
        this.slickGrid.setColumns(columns);
    }

    getColumns(): GridColumn<T>[] {
        return this.slickGrid.getColumns() as GridColumn<T>[];
    }

    getColumnIndex(id: string): number {
        return this.slickGrid.getColumnIndex(id);
    }

    setFilter(f: (item: any, args: any) => boolean) {
        this.dataView.setFilter(f);
    }

    setOptions(options: GridOptions<T>) {
        this.slickGrid.setOptions(options);
    }

    getOptions(): GridOptions<T> {
        return this.slickGrid.getOptions() as GridOptions<T>;
    }

    setOption(name: string, value: any) {
        this.slickGrid.getOptions()[name] = value;
    }

    getCheckboxSelectorPlugin(): Slick.Plugin<T> {
        return this.checkboxSelectorPlugin;
    }

    registerPlugin(plugin: Slick.Plugin<T>) {
        this.slickGrid.registerPlugin(plugin);
    }

    unregisterPlugin(plugin: Slick.Plugin<T>) {
        this.slickGrid.unregisterPlugin(plugin);
    }

    doRender(): Q.Promise<boolean> {
        if (Grid.debug) {
            console.debug('Grid.doRender');
        }
        return super.doRender().then((rendered) => {
            this.renderGrid();
            return rendered;
        });
    }

    renderGrid() {
        if (Grid.debug) {
            console.debug('Grid.renderGrid');
        }
        this.slickGrid.render();
    }

    resizeCanvas() {
        this.slickGrid.resizeCanvas();
    }

    updateRowCount() {
        this.slickGrid.updateRowCount();
    }

    invalidateRows(rows: number[]) {
        this.slickGrid.invalidateRows(rows);
    }

    invalidate() {
        this.slickGrid.invalidate();
    }

    syncGridSelection(preserveHidden: boolean) {
        this.dataView.syncGridSelection(this.slickGrid, preserveHidden);
    }

    focus() {
        this.slickGrid.focus();
    }

    setOnClick(callback: (event: any, data: GridOnClickData) => void) {
        this.slickGrid.onClick.subscribe((event, data) => {
            event.stopPropagation();
            callback(event, data as GridOnClickData);
        });
    }

    setOnKeyDown(callback: (event: any) => void) {
        this.slickGrid.onKeyDown.subscribe((event) => {
            event.stopPropagation();
            callback(event);
        });
    }

    getSelectedRows(): number[] {
        return this.slickGrid.getSelectedRows().slice();
    }

    setSelectedRows(rows: number[], debounce?: boolean) {
        this.debounceSelectionChange = debounce;
        this.slickGrid.setSelectedRows(rows);
    }

    selectRow(row: number, debounce?: boolean): number {
        // Prevent unnecessary render on the same row
        let rows = this.getSelectedRows();
        if (rows.length > 1 || (rows.length < 2 && rows.indexOf(row) < 0)) {
            this.setSelectedRows([row], debounce);
            return row;
        }
        return -1;
    }

    addSelectedRow(row: number, debounce?: boolean) {
        let rows = this.getSelectedRows();
        if (rows.indexOf(row) < 0) {
            rows.push(row);
            this.setSelectedRows(rows, debounce);
        }
    }

    addSelectedRows(rowsToAdd: number[], debounce?: boolean) {
        let rows = this.getSelectedRows();
        rowsToAdd.forEach((row) => {
            if (rows.indexOf(row) < 0) {
                rows.push(row);
            }
        });

        this.setSelectedRows(rows, debounce);
    }

    toggleRow(row: number, debounce?: boolean): number {
        // Prevent unnecessary render on the same row
        let rows = this.getSelectedRows();
        let index = rows.indexOf(row);
        if (index < 0) {
            rows.push(row);
        } else {
            rows.splice(index, 1);
        }
        this.setSelectedRows(rows, debounce);

        return index;
    }

    isRowSelected(row: number): boolean {
        let rows = this.getSelectedRows();
        let index = rows.indexOf(row);

        return index >= 0;
    }

    clearSelection(debounce?: boolean) {
        this.setSelectedRows([], debounce);
    }

    isAllSelected(): boolean {
        return this.slickGrid.getDataLength() === this.getSelectedRows().length;
    }

    isAnySelected(): boolean {
        return this.getSelectedRows().length > 0;
    }

    resetActiveCell() {
        if (this.slickGrid.getActiveCell()) {
            this.slickGrid.resetActiveCell();
        }
    }

    getCellFromEvent(e: DOMEvent): Slick.Cell {
        return this.slickGrid.getCellFromEvent(e);
    }

    getCellNode(row: number, cell: number): HTMLElement {
        return this.slickGrid.getCellNode(row, cell);
    }

    moveSelectedUp() {
        if (this.getDataLength() > 0) {
            const row: number = new GridSelectionHelper(this.getSelectedRows()).getRowToSingleSelectUp();

            if (row >= 0) {
                this.selectRow(row, true);
            }
        }
    }

    moveSelectedDown() {
        if (this.slickGrid.getDataLength() > 0) {
            const row: number = new GridSelectionHelper(this.getSelectedRows()).getRowToSingleSelectDown(this.getDataLength());

            if (row >= 0) {
                this.selectRow(row, true);
            }
        }

    }

    addSelectedUp() {
        if (this.slickGrid.getDataLength() === 0) {
            return;
        }

        const selected: number[] = this.getSelectedRows();

        this.setSelectedRows(new GridSelectionHelper(selected).addSelectedUp().getSelected(), true);
    }

    addSelectedDown() {
        const totalItems: number = this.slickGrid.getDataLength();

        if (totalItems === 0) {
            return;
        }

        const selected: number[] = this.getSelectedRows();

        this.setSelectedRows(new GridSelectionHelper(selected).addSelectedDown(totalItems).getSelected(), true);
    }

    // Operate with cells
    navigateUp() {
        this.slickGrid.navigateUp();
    }

    // Operate with cells
    navigateDown() {
        this.slickGrid.navigateDown();
    }

    getActiveCell(): Slick.Cell {
        return this.slickGrid.getActiveCell();
    }

    setActiveCell(row: number, cell: number) {
        this.slickGrid.setActiveCell(row, cell);
    }

    setCellCssStyles(key: string, hash: Slick.CellCssStylesHash) {
        this.slickGrid.setCellCssStyles(key, hash);
    }

    removeCellCssStyles(key: string) {
        this.slickGrid.removeCellCssStyles(key);
    }

    getCellCssStyles(key: string): Slick.CellCssStylesHash {
        return this.slickGrid.getCellCssStyles(key);
    }

    /*
     Returns the DIV element matching class grid-canvas,
     which contains every data row currently being rendered in the DOM.
     */
    getCanvasNode(): HTMLCanvasElement {
        return this.slickGrid.getCanvasNode();
    }

    /*
     Returns an object representing information about the grid's position on the page.
     */
    getGridPosition(): Slick.CellPosition {
        return this.slickGrid.getGridPosition();
    }

    /*
     If passed no arguments, returns an object that tells you the range of rows (by row number)
     currently being rendered, as well as the left/right range of pixels currently rendered.
     */
    getRenderedRange(viewportTop?: number, viewportLeft?: number): Slick.Viewport {
        return this.slickGrid.getRenderedRange(viewportTop, viewportLeft);
    }

    /*
     Returns an object telling you which rows are currently being displayed on the screen,
     and also the pixel offsets for left/right scrolling.
     */
    getViewport(viewportTop?: number, viewportLeft?: number): Slick.Viewport {
        return this.slickGrid.getViewport(viewportTop, viewportLeft);
    }

    updateCell(row: number, cell: number) {
        return this.slickGrid.updateCell(row, cell);
    }

    updateRow(row: number) {
        return this.slickGrid.updateRow(row);
    }

    subscribeOnSelectedRowsChanged(callback: (e: any, args: any) => void) {
        let debouncedCallback = AppHelper.debounce(callback, 500, false);
        this.slickGrid.onSelectedRowsChanged.subscribe((e, args) => {
            if (this.debounceSelectionChange) {
                debouncedCallback(e, args);
                this.debounceSelectionChange = false;
            } else {
                callback(e, args);
            }
        });
    }

    subscribeOnClick(listener: (e: any, args: any) => void) {
        this.onClickListeners.push(listener);
    }

    unsubscribeOnClick(listener: (e: any, args: any) => void) {
        this.onClickListeners = this.onClickListeners.filter(function (curr: (e: any, args: any) => void) {
            return curr !== listener;
        });
    }

    subscribeOnDblClick(callback: (e: any, args: any) => void) {
        this.slickGrid.onDblClick.subscribe(callback);
    }

    unsubscribeOnDblClick(callback: (e: any, args: any) => void) {
        this.slickGrid.onDblClick.unsubscribe(callback);
    }

    subscribeOnContextMenu(callback: (e: any, args: any) => void) {
        this.slickGrid.onContextMenu.subscribe(callback);
    }

    subscribeOnDrag(callback: (e: any, args: any) => void) {
        this.slickGrid.onDrag.subscribe(callback);
    }

    subscribeOnDragInit(callback: (e: any, args: any) => void) {
        this.slickGrid.onDragInit.subscribe(callback);
    }

    subscribeOnDragEnd(callback: (e: any, args: any) => void) {
        this.slickGrid.onDragEnd.subscribe(callback);
    }

    subscribeBeforeMoveRows(callback: (e: any, args: any) => void) {
        if (this.rowManagerPlugin) {
            (this.rowManagerPlugin.onBeforeMoveRows).subscribe(callback);
        }
    }

    subscribeMoveRows(callback: (e: any, args: any) => void) {
        if (this.rowManagerPlugin) {
            (this.rowManagerPlugin.onMoveRows).subscribe(callback);
        }
    }

    subscribeOnScroll(callback: (e: any) => void) {
        this.slickGrid.onScroll.subscribe(callback);
    }

    unsubscribeOnScroll(callback: (e: any) => void): void {
        this.slickGrid.onScroll.unsubscribe(callback);
    }

    // scrolled event is for the mouse wheel only
    subscribeOnScrolled(callback: (e: Event) => void) {
        if (this.getHTMLElement().addEventListener) {
            this.getHTMLElement().addEventListener('DOMMouseScroll', callback, false); // firefox
            try {
                this.getHTMLElement().addEventListener('mousewheel', callback, {passive: true});
            } catch {
                this.getHTMLElement().addEventListener('mousewheel', callback);
            }
        }
    }

    subscribeOnMouseEnter(callback: (e: any, args: any) => void) {
        this.slickGrid.onMouseEnter.subscribe(callback);
    }

    subscribeOnMouseLeave(callback: (e: any, args: any) => void) {
        this.slickGrid.onMouseLeave.subscribe(callback);
    }

    getViewportEl(): HTMLElement {
        const canvas: HTMLCanvasElement = this.getCanvasNode();
        return new ElementHelper(canvas.parentElement).getHTMLElement();
    }

    protected createOptions(): GridOptions<any> {
        return new GridOptionsBuilder<T>().build();
    }

    protected createColumns(): GridColumn<any>[] {
        throw Error('Must be implemented by inheritors');
    }

    private autoRenderGridOnDataChanges(dataView: DataView<T>) {
        dataView.onRowCountChanged(() => {
            this.updateRowCount();
            this.resizeCanvas();
            this.renderGrid();
        });

        dataView.onRowsChanged((_eventData: Slick.EventData, args) => {
            this.invalidateRows(args.rows);
            this.renderGrid();
        });
    }

    private createLoadMask() {
        this.loadMask = new LoadMask(this);
        this.getParentElement().appendChild(this.loadMask);

        this.loadMask.onRemoved(() => {
            this.loadMask = null;
        });
    }

    private notifyClicked(e: any, args: any) {
        this.onClickListeners.forEach((listener: (e: any, args: any) => void) => {
            listener(e, args);
        });
    }
}
