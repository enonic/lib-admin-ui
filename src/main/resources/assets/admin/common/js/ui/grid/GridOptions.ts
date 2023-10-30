export class GridOptionsBuilder<T extends Slick.SlickData> {

    dataItemColumnValueExtractor: any;

    enableAsyncPostRender: boolean;

    hideColumnHeaders: boolean;
/*
    asyncEditorLoading: boolean;

    asyncEditorLoadDelay: number;

    asyncPostRenderDelay: number;

    autoEdit: boolean;

    cellFlashingCssClass: string;

    cellHighlightCssClass: string;

    defaultColumnWidth: number;

    defaultFormatter: Slick.Formatter<T>;

    editable: boolean;

    editCommandHandler: any;

    editorFactory: Slick.EditorFactory;

    editorLock: Slick.EditorLock<T>;

    enableAddRow: boolean;

    enableCellRangeSelection: any;

    enableCellNavigation: boolean = false;

    enableColumnReorder: boolean = false;

    enableRowReordering: any;

    enableTextSelectionOnCells: boolean;

    explicitInitialization: boolean;

    forceFitColumns: boolean;

    forceSyncScrolling: boolean;

    formatterFactory: Slick.FormatterFactory<T>;

    fullWidthRows: boolean;

    headerRowHeight: number;

    leaveSpaceForNewRows: boolean;

    multiColumnSort: boolean;

    multiSelect: boolean;

    rowHeight: number;

    selectedCellCssClass: string;

    showHeaderRow: boolean;

    syncColumnCellResize: boolean;

    topPanelHeight: number;

    // Additional properties

    width: string;

    height: string;

    dataIdProperty: string;

    autoRenderGridOnDataChanges: boolean;

    checkableRows: boolean;

    leftAlignedCheckbox: boolean;

    disabledMultipleSelection: boolean;

    dragAndDrop: boolean;

    rerenderOnResize: boolean;
*/
    constructor(source?: GridOptions<T>) {

        if (source) {
            this.dataItemColumnValueExtractor = source.getDataItemColumnValueExtractor();
            this.enableAsyncPostRender = source.isEnableAsyncPostRender();
            this.hideColumnHeaders = source.isHideColumnHeaders();
            /*
            this.asyncEditorLoading = source.isAsyncEditorLoading();
            this.asyncEditorLoadDelay = source.getAsyncEditorLoadDelay();
            this.asyncPostRenderDelay = source.getAsyncPostRenderDelay();
            this.autoEdit = source.isAutoEdit();
            this.cellFlashingCssClass = source.getCellFlashingCssClass();
            this.cellHighlightCssClass = source.getCellHighlightCssClass();
            this.dataItemColumnValueExtractor = source.getDataItemColumnValueExtractor();
            this.defaultColumnWidth = source.getDefaultColumnWidth();
            this.defaultFormatter = source.getDefaultFormatter();
            this.editable = source.isEditable();
            this.editCommandHandler = source.getEditCommandHandler();
            this.editorFactory = source.getEditorFactory();
            this.editorLock = source.getEditorLock();
            this.enableAddRow = source.isEnableAddRow();
            this.enableAsyncPostRender = source.isEnableAsyncPostRender();
            this.enableCellRangeSelection = source.getEnableCellRangeSelection();
            this.enableCellNavigation = source.isEnableCellNavigation();
            this.enableColumnReorder = source.isEnableColumnReorder();
            this.enableRowReordering = source.getEnableRowReordering();
            this.enableTextSelectionOnCells = source.isEnableTextSelectionOnCells();
            this.explicitInitialization = source.isExplicitInitialization();
            this.forceFitColumns = source.isForceFitColumns();
            this.forceSyncScrolling = source.isForceSyncScrolling();
            this.formatterFactory = source.getFormatterFactory();
            this.fullWidthRows = source.isFullWidthRows();
            this.headerRowHeight = source.getHeaderRowHeight();
            this.leaveSpaceForNewRows = source.isLeaveSpaceForNewRows();
            this.multiColumnSort = source.isMultiColumnSort();
            this.multiSelect = source.isMultiSelect();
            this.rowHeight = source.getRowHeight();
            this.selectedCellCssClass = source.getSelectedCellCssClass();
            this.showHeaderRow = source.getShowHeaderRow();
            this.syncColumnCellResize = source.isSyncColumnCellResize();
            this.topPanelHeight = source.getTopPanelHeight();
            // Additional properties
            this.width = source.getWidth();
            this.height = source.getHeight();
            this.dataIdProperty = source.getDataIdProperty();
            this.autoRenderGridOnDataChanges = source.isAutoRenderGridOnDataChanges();
            this.checkableRows = source.isCheckableRows();
            this.leftAlignedCheckbox = source.isLeftAlignedCheckbox();
            this.disabledMultipleSelection = source.isMultipleSelectionDisabled();
            this.dragAndDrop = source.isDragAndDrop();
            this.rerenderOnResize = source.isRerenderOnResize();
            */
        }
    }

    setDataItemColumnValueExtractor(dataItemColumnValueExtractor: any): GridOptionsBuilder<T> {
        this.dataItemColumnValueExtractor = dataItemColumnValueExtractor;
        return this;
    }

    setEditable(editable: boolean): GridOptionsBuilder<T> {
        this.editable = editable;
        return this;
    }

    setEnableAsyncPostRender(enableAsyncPostRender: boolean): GridOptionsBuilder<T> {
        this.enableAsyncPostRender = enableAsyncPostRender;
        return this;
    }

    setForceFitColumns(forceFitColumns: boolean): GridOptionsBuilder<T> {
        this.forceFitColumns = forceFitColumns;
        return this;
    }

    setFullWidthRows(fullWidthRows: boolean): GridOptionsBuilder<T> {
        this.fullWidthRows = fullWidthRows;
        return this;
    }

    setMultiSelect(multiSelect: boolean): GridOptionsBuilder<T> {
        this.multiSelect = multiSelect;
        return this;
    }

    setRowHeight(rowHeight: number): GridOptionsBuilder<T> {
        this.rowHeight = rowHeight;
        return this;
    }

    setHideColumnHeaders(hideColumnHeaders: boolean): GridOptionsBuilder<T> {
        this.hideColumnHeaders = hideColumnHeaders;
        return this;
    }

    setWidth(width: string): GridOptionsBuilder<T> {
        this.width = width;
        return this;
    }

    setHeight(height: string): GridOptionsBuilder<T> {
        this.height = height;
        return this;
    }

    setDataIdProperty(dataIdProperty: string): GridOptionsBuilder<T> {
        this.dataIdProperty = dataIdProperty;
        return this;
    }

    setAutoRenderGridOnDataChanges(autoRenderGridOnDataChanges: boolean): GridOptionsBuilder<T> {
        this.autoRenderGridOnDataChanges = autoRenderGridOnDataChanges;
        return this;
    }

    setCheckableRows(checkableRows: boolean): GridOptionsBuilder<T> {
        this.checkableRows = checkableRows;
        return this;
    }

    setLeftAlignedCheckbox(leftAlignedCheckbox: boolean): GridOptionsBuilder<T> {
        this.leftAlignedCheckbox = leftAlignedCheckbox;
        return this;
    }

    build(): GridOptions<T> {
        return new GridOptions<T>(this);
    }
}

export class GridOptions<T extends Slick.SlickData>
    implements Slick.GridOptions<T> {

    asyncEditorLoading: boolean;

    asyncEditorLoadDelay: number;

    asyncPostRenderDelay: number;

    autoEdit: boolean;

    autoHeight: boolean = false;

    cellFlashingCssClass: string;

    cellHighlightCssClass: string;

    dataItemColumnValueExtractor: any;

    defaultColumnWidth: number;

    defaultFormatter: Slick.Formatter<T>;

    editable: boolean;

    editCommandHandler: any;

    editorFactory: Slick.EditorFactory;

    editorLock: Slick.EditorLock<T>;

    enableAddRow: boolean;

    enableAsyncPostRender: boolean;

    enableAsyncPostRenderCleanup: boolean = true;

    enableCellRangeSelection: any;

    enableCellNavigation: boolean = false;

    enableColumnReorder: boolean = false;

    enableRowReordering: any;

    enableTextSelectionOnCells: boolean;

    explicitInitialization: boolean;

    //forceFitColumns: boolean;

    autosizeColsMode: boolean = true;

    forceSyncScrolling: boolean;

    formatterFactory: Slick.FormatterFactory<T>;

    fullWidthRows: boolean;

    headerRowHeight: number;

    leaveSpaceForNewRows: boolean;

    multiColumnSort: boolean;

    multiSelect: boolean;

    rowHeight: number;

    selectedCellCssClass: string;

    showHeaderRow: boolean;

    syncColumnCellResize: boolean;

    topPanelHeight: number;

    // Additional properties
    hideColumnHeaders: boolean;

    width: string;

    height: string;

    dataIdProperty: string;

    autoRenderGridOnDataChanges: boolean;

    checkableRows: boolean;

    leftAlignedCheckbox: boolean;

    disabledMultipleSelection: boolean;

    dragAndDrop: boolean;

    enableGalleryMode: boolean;

    galleryModeColumns: number;

    rerenderOnResize: boolean;

    suppressCssChangesOnHiddenInit: boolean = true;

    constructor(builder: GridOptionsBuilder<T>) {
        this.asyncEditorLoading = builder.asyncEditorLoading;
        this.asyncEditorLoadDelay = builder.asyncEditorLoadDelay;
        this.asyncPostRenderDelay = builder.asyncPostRenderDelay;
        this.autoEdit = builder.autoEdit;
        this.cellFlashingCssClass = builder.cellFlashingCssClass;
        this.cellHighlightCssClass = builder.cellHighlightCssClass;
        this.dataItemColumnValueExtractor = builder.dataItemColumnValueExtractor;
        this.defaultColumnWidth = builder.defaultColumnWidth;
        this.defaultFormatter = builder.defaultFormatter;
        this.editable = builder.editable;
        this.editCommandHandler = builder.editCommandHandler;
        this.editorFactory = builder.editorFactory;
        this.editorLock = builder.editorLock;
        this.enableAddRow = builder.enableAddRow;
        this.enableAsyncPostRender = builder.enableAsyncPostRender;
        this.enableCellRangeSelection = builder.enableCellRangeSelection;
        this.enableCellNavigation = builder.enableCellNavigation;
        this.enableColumnReorder = builder.enableColumnReorder;
        this.enableRowReordering = builder.enableRowReordering;
        this.enableTextSelectionOnCells = builder.enableTextSelectionOnCells;
        this.explicitInitialization = builder.explicitInitialization;
        //this.forceFitColumns = builder.forceFitColumns;
        this.forceSyncScrolling = builder.forceSyncScrolling;
        this.formatterFactory = builder.formatterFactory;
        this.fullWidthRows = builder.fullWidthRows;
        this.headerRowHeight = builder.headerRowHeight;
        this.leaveSpaceForNewRows = builder.leaveSpaceForNewRows;
        this.multiColumnSort = builder.multiColumnSort;
        this.multiSelect = builder.multiSelect;
        this.rowHeight = builder.rowHeight;
        this.selectedCellCssClass = builder.selectedCellCssClass;
        this.showHeaderRow = builder.showHeaderRow;
        this.syncColumnCellResize = builder.syncColumnCellResize;
        this.topPanelHeight = builder.topPanelHeight;

        this.hideColumnHeaders = builder.hideColumnHeaders;
        this.width = builder.width;
        this.height = builder.height;
        this.dataIdProperty = builder.dataIdProperty;
        this.autoRenderGridOnDataChanges = builder.autoRenderGridOnDataChanges;
        this.checkableRows = builder.checkableRows;
        this.leftAlignedCheckbox = builder.leftAlignedCheckbox;
        this.disabledMultipleSelection = builder.disabledMultipleSelection;
        this.dragAndDrop = builder.dragAndDrop;
        this.rerenderOnResize = builder.rerenderOnResize;
    }

    getDataItemColumnValueExtractor(): any {
        return this.dataItemColumnValueExtractor;
    }

    getRowHeight(): number {
        return this.rowHeight;
    }

    getSelectedCellCssClass(): string {
        return this.selectedCellCssClass;
    }

    isHideColumnHeaders(): boolean {
        return this.hideColumnHeaders;
    }

    getWidth(): string {
        return this.width;
    }

    getHeight(): string {
        return this.height;
    }

    getDataIdProperty(): string {
        return this.dataIdProperty;
    }

    isAutoRenderGridOnDataChanges(): boolean {
        return this.autoRenderGridOnDataChanges;
    }

    isCheckableRows(): boolean {
        return this.checkableRows;
    }

    isLeftAlignedCheckbox(): boolean {
        return this.leftAlignedCheckbox;
    }

    isMultipleSelectionDisabled(): boolean {
        return this.disabledMultipleSelection;
    }

    isDragAndDrop(): boolean {
        return this.dragAndDrop;
    }

    isRerenderOnResize(): boolean {
        return this.rerenderOnResize;
    }

    isEnableGalleryMode(): boolean {
        return this.enableGalleryMode;
    }

    getGalleryModeColums(): number {
        return this.galleryModeColumns;
    }

    setDataItemColumnValueExtractor(dataItemColumnValueExtractor: any): GridOptions<T> {
        this.dataItemColumnValueExtractor = dataItemColumnValueExtractor;
        return this;
    }

    setSelectedCellCssClass(selectedCellCssClass: string): GridOptions<T> {
        this.selectedCellCssClass = selectedCellCssClass;
        return this;
    }

    setWidth(width: string): GridOptions<T> {
        this.width = width;
        return this;
    }

    setCheckableRows(checkableRows: boolean): GridOptions<T> {
        this.checkableRows = checkableRows;
        return this;
    }

    setLeftAlignedCheckbox(leftAlignedCheckbox: boolean): GridOptions<T> {
        this.leftAlignedCheckbox = leftAlignedCheckbox;
        return this;
    }

    disableMultipleSelection(disabledMultipleSelection: boolean): GridOptions<T> {
        this.disabledMultipleSelection = disabledMultipleSelection;
        return this;
    }

    setDragAndDrop(dragAndDrop: boolean): GridOptions<T> {
        this.dragAndDrop = dragAndDrop;
        return this;
    }
}
