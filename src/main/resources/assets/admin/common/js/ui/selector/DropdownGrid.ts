import * as Q from 'q';
import {Viewer} from '../Viewer';
import {GridColumn, GridColumnBuilder} from '../grid/GridColumn';
import {Element} from '../../dom/Element';
import {Grid} from '../grid/Grid';
import {DataView} from '../grid/DataView';
import {GridOptions, GridOptionsBuilder} from '../grid/GridOptions';
import {OptionDataHelper} from './OptionDataHelper';
import {OptionDataLoader} from './OptionDataLoader';
import {DropdownGridRowSelectedEvent} from './DropdownGridRowSelectedEvent';
import {DropdownGridMultipleSelectionEvent} from './DropdownGridMultipleSelectionEvent';
import {Option} from './Option';
import {DefaultOptionDisplayValueViewer} from './DefaultOptionDisplayValueViewer';

export interface DropdownGridConfig<OPTION_DISPLAY_VALUE> {

    maxHeight?: number;

    width: number;

    optionDisplayValueViewer?: Viewer<OPTION_DISPLAY_VALUE>;

    rowHeight?: number;

    filter: (item: Option<OPTION_DISPLAY_VALUE>, args: any) => boolean;

    dataIdProperty?: string;

    multipleSelections?: boolean;

    treegridDropdownAllowed?: boolean;

    optionDataHelper?: OptionDataHelper<OPTION_DISPLAY_VALUE>;

    optionDataLoader?: OptionDataLoader<OPTION_DISPLAY_VALUE>;

    createColumns?: GridColumn<OPTION_DISPLAY_VALUE>[];
}

export abstract class DropdownGrid<OPTION_DISPLAY_VALUE> {

    protected maxHeight: number;

    protected rowHeight: number;

    protected customHeight: number;

    protected width: number;

    protected dataIdProperty: string;

    protected optionDisplayValueViewer: Viewer<OPTION_DISPLAY_VALUE>;

    protected filter: (item: Option<OPTION_DISPLAY_VALUE>, args: any) => boolean;

    protected rowSelectionListeners: { (event: DropdownGridRowSelectedEvent): void }[];

    protected multipleSelectionListeners: { (event: DropdownGridMultipleSelectionEvent): void }[];

    protected rowCountChangedListeners: { (): void }[] = [];

    protected multipleSelections: boolean;

    protected config: DropdownGridConfig<OPTION_DISPLAY_VALUE>;

    protected constructor(config: DropdownGridConfig<OPTION_DISPLAY_VALUE>) {
        this.config = config;
        this.rowSelectionListeners = [];
        this.multipleSelectionListeners = [];
        this.optionDisplayValueViewer = config.optionDisplayValueViewer
                                        ? config.optionDisplayValueViewer.clone()
                                        : new DefaultOptionDisplayValueViewer();
        this.rowHeight = config.rowHeight;
        this.filter = config.filter;
        this.dataIdProperty = config.dataIdProperty || 'value';
        this.maxHeight = config.maxHeight;
        this.customHeight = config.maxHeight;
        this.width = config.width;
        this.multipleSelections = config.multipleSelections || false;

        this.initGridAndData();
        this.initCommonGridProps();
        this.initGridEventListeners();
    }

    setReadonlyChecker(_checker: (optionToCheck: OPTION_DISPLAY_VALUE) => boolean) {
        return;
    }

    reload(): Q.Promise<void> {
        return Q(null);
    }

    getElement(): Element {
        throw new Error('Must be implemented by inheritors');
    }

    getGrid(): Grid<any> {
        throw new Error('Must be implemented by inheritors');
    }

    getOptionDataLoader(): OptionDataLoader<OPTION_DISPLAY_VALUE> {
        return this.config.optionDataLoader;
    }

    renderGrid(): void {
        this.getGrid().renderGrid();
    }

    invalidate(): void {
        this.getGrid().invalidate();
    }

    isVisible(): boolean {
        return !this.getGrid().hasClass('hidden') && this.getGrid().isVisible();
    }

    show() {
        this.getGrid().removeClass('hidden');

        if (!this.getGrid().isVisible()) {
            this.getGrid().show();
        }
    }

    hide(hideGrid?: boolean) {
        // hiding grid with visibility: hidden instead of display: none to allow scrollTop modification
        this.getGrid().addClass('hidden');
        if (hideGrid) {
            this.getGrid().hide();
        }
    }

    getSelectedOptionCount(): number {
        return this.getGrid().getSelectedRows().length;
    }

    setOptions(options: Option<OPTION_DISPLAY_VALUE>[]) {
        this.getGridData().setItems(options, this.dataIdProperty);
    }

    sort(comparer: Function, asc?: boolean) {
        this.getGridData().sort(comparer, asc);
    }

    removeAllOptions() {
        this.getGridData().setItems([]);
    }

    addOption(option: Option<OPTION_DISPLAY_VALUE>) {
        this.getGridData().addItem(option);
    }

    removeOption(option: Option<OPTION_DISPLAY_VALUE>) {
        this.getGridData().deleteItem(option.getValue());
    }

    updateOption(option: Option<OPTION_DISPLAY_VALUE>) {
        this.getGridData().updateItem(option.getValue(), option);
    }

    hasOptions(): boolean {
        return this.getGridData().getLength() > 0;
    }

    getOptionCount(): number {
        return this.getGridData().getLength();
    }

    getOptions(): Option<OPTION_DISPLAY_VALUE>[] {
        return this.getGridData().getItems();
    }

    getSelectedOptions(): Option<OPTION_DISPLAY_VALUE>[] {
        return this.getGrid().getSelectedRows().map((row) => {
            return this.getGridData().getItem(row);
        });
    }

    getOptionsByValues(values: string[]): Option<OPTION_DISPLAY_VALUE>[] {
        if (values.length === 1) {
            return [this.getOptionByValue(values[0])];
        }
        return this.getGridData().getItemsByIds(values);
    }

    getOptionByValue(value: string): Option<OPTION_DISPLAY_VALUE> {
        return this.getGridData().getItemById(value);
    }

    getOptionByRow(rowIndex: number): Option<OPTION_DISPLAY_VALUE> {
        return this.getGridData().getItem(rowIndex);
    }

    getRowByValue(value: string): number {
        return this.getGridData().getRowById(value);
    }

    setFilterArgs(args: any) {
        this.getGridData().setFilterArgs(args);
        this.getGridData().refresh();
    }

    setTopPx(value: number) {
        this.getGrid().getEl().setTopPx(value);
    }

    setWidthPx(value: number) {
        this.getGrid().getEl().setWidthPx(value);
    }

    adjustGridHeight() {

        const gridEl = this.getGrid().getEl();
        const options = this.getGrid().getOptions();
        let rowsHeight;
        if (!options.isEnableGalleryMode()) {
            rowsHeight = this.getOptionCount() * options.getRowHeight();
        } else {
            rowsHeight = Math.ceil(this.getOptionCount() / options.getGalleryModeColums()) * options.getRowHeight();
        }

        const borderWidth = gridEl.getBorderTopWidth() + gridEl.getBorderBottomWidth();

        if (rowsHeight < this.customHeight) {
            gridEl.setHeightPx(rowsHeight + borderWidth);
        } else if (gridEl.getHeight() < this.customHeight || this.customHeight !== this.maxHeight) {
            gridEl.setHeightPx(this.customHeight + borderWidth);
        }

        this.getGrid().resizeCanvas();
    }

    addSelections(selectedOptions: Option<OPTION_DISPLAY_VALUE>[]) {
        selectedOptions.forEach((selectedOption: Option<OPTION_DISPLAY_VALUE>) => {
            let row = this.getRowByValue(selectedOption.getValue());
            if (row !== undefined && !this.getGrid().isRowSelected(row)) {
                this.getGrid().addSelectedRow(row);
            }
        });
    }

    markSelections(selectedOptions: Option<OPTION_DISPLAY_VALUE>[], ignoreEmpty: boolean = false) {
        let stylesHash: Slick.CellCssStylesHash = {};
        let rows: number[] = [];
        selectedOptions.forEach((selectedOption: Option<OPTION_DISPLAY_VALUE>) => {
            let row = this.getRowByValue(selectedOption.getValue());
            rows.push(row);
            stylesHash[row] = {option: 'selected'};
        });
        this.getGrid().setCellCssStyles('selected', stylesHash);
        if (!(rows.length === 0 && ignoreEmpty)) {
            this.getGrid().setSelectedRows(rows);
        }
    }

    markReadOnly(selectedOptions: Option<OPTION_DISPLAY_VALUE>[]) {

        let stylesHash: Slick.CellCssStylesHash = {};
        selectedOptions.forEach((selectedOption: Option<OPTION_DISPLAY_VALUE>) => {
            if (selectedOption.isReadOnly()) {
                let row = this.getRowByValue(selectedOption.getValue());
                stylesHash[row] = {_checkbox_selector: 'readonly', option: 'readonly'};
            }
        });
        this.getGrid().setCellCssStyles('readonly', stylesHash);
    }

    hasActiveRow(): boolean {
        return !!this.getGrid().getActiveCell();
    }

    getActiveRow(): number {
        const activeCell = this.getGrid().getActiveCell();

        return !activeCell ? -1 : activeCell.row;
    }

    expandActiveRow() {
        this.getGrid().navigateDown();
    }

    collapseActiveRow() {
        this.getGrid().navigateUp();
    }

    navigateToRow(row: number) {
        this.getGrid().setActiveCell(row, 0);
    }

    navigateToNextRow() {
        this.getGrid().navigateDown();
    }

    navigateToPreviousRow() {
        this.getGrid().navigateUp();
    }

    resetActiveSelection() {
        this.getGrid().resetActiveCell();
    }

    setCustomHeight(height: number) {
        this.customHeight = Math.min(height, this.maxHeight);
    }

    resetCustomHeight() {
        this.customHeight = this.maxHeight;
    }

    toggleRowSelection(row: number, isMaximumReached: boolean = false) {
        let rows = this.getGrid().getSelectedRows();
        let oldRows = rows.join();
        let index = rows.indexOf(row);

        if (index >= 0) {
            rows.splice(index, 1);
        } else if (!isMaximumReached) {
            rows.push(row);
        }

        // update on changes only
        if (oldRows !== rows.join()) {
            this.getGrid().setSelectedRows(rows);
        }
    }

    navigateToFirstRow() {
        this.navigateToRow(0);
    }

    onRowSelection(listener: (event: DropdownGridRowSelectedEvent) => void) {
        this.rowSelectionListeners.push(listener);
    }

    unRowSelection(listener: (event: DropdownGridRowSelectedEvent) => void) {
        this.rowSelectionListeners.filter((currentListener: (event: DropdownGridRowSelectedEvent) => void) => {
            return listener !== currentListener;
        });
    }

    onClick(callback: (e: MouseEvent, args: any) => void) {
        this.getGrid().subscribeOnClick(callback);
    }

    unClick(callback: (e: MouseEvent, args: any) => void) {
        this.getGrid().unsubscribeOnClick(callback);
    }

    onMultipleSelection(listener: (event: DropdownGridMultipleSelectionEvent) => void) {
        this.multipleSelectionListeners.push(listener);
    }

    unMultipleSelection(listener: (event: DropdownGridMultipleSelectionEvent) => void) {
        this.multipleSelectionListeners.filter((currentListener: (event: DropdownGridMultipleSelectionEvent) => void) => {
            return listener !== currentListener;
        });
    }

    onRowCountChanged(listener: () => void) {
        this.rowCountChangedListeners.push(listener);
    }

    unRowCountChanged(listener: () => void) {
        this.rowCountChangedListeners.filter((currentListener: () => void) => {
            return listener !== currentListener;
        });
    }

    notifyRowCountChanged() {
        this.rowCountChangedListeners.forEach((listener: () => void) => {
            listener();
        });
    }

    protected initGridAndData() {
        throw new Error('Must be implemented by inheritors');
    }

    protected getGridData(): DataView<any> {
        throw new Error('Must be implemented by inheritors');
    }

    protected initGridEventListeners() {
        // Listen to click in grid and issue selection
        this.getGrid().subscribeOnClick((e, args) => {
            this.notifyRowSelection(args.row);

            e.preventDefault();
            return false;
        });

        this.getGrid().subscribeOnSelectedRowsChanged((_e, args) => {
            this.notifyMultipleSelection(args.rows);
        });
    }

    protected createOptions(): GridOptions<any> {
        return new GridOptionsBuilder()
            .setWidth(this.width + 'px')
            .setHeight(this.maxHeight + 'px')
            .setHideColumnHeaders(true)
            .setEnableColumnReorder(false)
            .setFullWidthRows(true)
            .setForceFitColumns(true)
            .setRowHeight(this.rowHeight)
            .setCheckableRows(this.multipleSelections)
            .setLeftAlignedCheckbox(false)
            .setMultiSelect(this.multipleSelections)
            .setDataIdProperty(this.dataIdProperty)
            .build();
    }

    protected createColumns(): GridColumn<any>[] {
        let columnFormatter =
            (_row: number, _cell: number, value: OPTION_DISPLAY_VALUE, _columnDef: any, option: Option<OPTION_DISPLAY_VALUE>) => {
                this.optionDisplayValueViewer.toggleClass('non-selectable', !option.isSelectable());
                this.optionDisplayValueViewer.setObject(value);
                return this.optionDisplayValueViewer.toString();
            };

        const columns = [
            new GridColumnBuilder().setId('option').setName('Options').setField('displayValue').setFormatter(
                columnFormatter).build()
        ];

        return this.config.createColumns ? columns.concat(this.config.createColumns) : columns;
    }

    protected notifyRowSelection(rowSelected: number) {
        const event = new DropdownGridRowSelectedEvent(rowSelected);
        this.rowSelectionListeners.forEach((listener: (event: DropdownGridRowSelectedEvent) => void) => {
            listener(event);
        });
    }

    protected notifyMultipleSelection(rowsSelected: number[]) {
        const event = new DropdownGridMultipleSelectionEvent(rowsSelected);
        this.multipleSelectionListeners.forEach((listener: (event: DropdownGridMultipleSelectionEvent) => void) => {
            listener(event);
        });
    }

    private initCommonGridProps() {
        this.getGrid().addClass('options-container dropdown-grid');
        this.getGrid().getEl().setPosition('absolute');
        this.hide();
        this.getGrid().setSelectionModel(new Slick.RowSelectionModel({selectActiveRow: false}));
    }
}
