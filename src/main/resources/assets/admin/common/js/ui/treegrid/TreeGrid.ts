import * as $ from 'jquery';
import * as Q from 'q';
import {Element} from '../../dom/Element';
import {ElementHelper} from '../../dom/ElementHelper';
import {ValidationRecordingViewer} from '../../form/ValidationRecordingViewer';
import {Grid} from '../grid/Grid';
import {GridOptions} from '../grid/GridOptions';
import {GridColumn} from '../grid/GridColumn';
import {DataView} from '../grid/DataView';
import {KeyBinding} from '../KeyBinding';
import {KeyBindings} from '../KeyBindings';
import {AppHelper} from '../../util/AppHelper';
import {ResponsiveItem} from '../responsive/ResponsiveItem';
import {Panel} from '../panel/Panel';
import {ResponsiveManager} from '../responsive/ResponsiveManager';
import {SpanEl} from '../../dom/SpanEl';
import {StringHelper} from '../../util/StringHelper';
import {DefaultErrorHandler} from '../../DefaultErrorHandler';
import {TreeNode, TreeNodeBuilder} from './TreeNode';
import {TreeRoot} from './TreeRoot';
import {TreeGridBuilder} from './TreeGridBuilder';
import {DataChangedEvent, DataChangedType} from './DataChangedEvent';
import {TreeGridToolbar} from './TreeGridToolbar';
import {TreeGridContextMenu} from './TreeGridContextMenu';
import {ContextMenuShownEvent} from './ContextMenuShownEvent';
import {TreeGridSelection} from './TreeGridSelection';
import {GridSelectionHelper} from '../grid/GridSelectionHelper';
import {IDentifiable} from '../../IDentifiable';
import {NumberHelper} from '../../util/NumberHelper';

export enum SelectionOnClickType {
    HIGHLIGHT,
    SELECT,
    NONE,
}

interface SelectionEventListener {
    handler: () => void
    eventType: SelectionOnClickType
    debounced: boolean
}

/*
 * There are several methods that should be overridden:
 * 1. hasChildren(data: DATA)  -- Should be implemented if a grid has a tree structure and supports expand/collapse.
 * 2. fetch(data?: DATA) -- Should fetch full data with a valid hasChildren() value;
 * 3. fetchChildren(parentData?: DATA) -- Should fetch children of a parent data;
 * 4. fetchRoot() -- Fetches root nodes. by default return fetchChildren() with an empty parameter.
 */

export class TreeGrid<DATA extends IDentifiable>
    extends Panel {

    public static LEVEL_STEP_INDENT: number = 16;
    protected loading: boolean = false;
    private columns: GridColumn<TreeNode<DATA>>[] = [];
    private gridOptions: GridOptions<TreeNode<DATA>>;
    private grid: Grid<TreeNode<DATA>>;
    private gridData: DataView<TreeNode<DATA>>;
    private root: TreeRoot<DATA>;
    private toolbar: TreeGridToolbar;
    private contextMenu: TreeGridContextMenu;
    private active: boolean;
    private loadedListeners: ((scope: TreeGrid<DATA>) => void)[] = [];
    private contextMenuListeners: ((scope: ContextMenuShownEvent) => void)[] = [];
    private selectionChangeListeners: SelectionEventListener[] = [];
    private readonly debouncedSelectionChangeHandler: (type: SelectionOnClickType) => void;

    private dataChangeListeners: ((event: DataChangedEvent<DATA>) => void)[] = [];
    private activeChangedListeners: ((active: boolean) => void)[] = [];
    private loadBufferSize: number;
    private scrollable: Element;

    private quietErrorHandling: boolean;

    private errorPanel: ValidationRecordingViewer;

    private highlightedDataId: string;

    private selection: TreeGridSelection = new TreeGridSelection();

    private selectionOnClick: SelectionOnClickType = SelectionOnClickType.HIGHLIGHT;

    private interval: number;

    private idPropertyName: string;

    private keyBindings: KeyBinding[] = [];

    private expandedNodesDataIds: string[] = [];

    private hotkeysEnabled: boolean = true;

    private keysBound: boolean = false;

    constructor(builder: TreeGridBuilder<DATA>) {

        super(builder.getClasses());

        this.quietErrorHandling = builder.getQuietErrorHandling();
        this.hotkeysEnabled = builder.isHotkeysEnabled();

        // root node with undefined item
        this.root = new TreeRoot<DATA>();

        this.gridData = new DataView<TreeNode<DATA>>();
        this.gridData.setFilter((node: TreeNode<DATA>) => {
            return node.isVisible();
        });
        this.gridData.setItemMetadataHandler(this.handleItemMetadata.bind(this));

        this.columns = this.updateColumnsFormatter(builder.getColumns());
        this.gridOptions = builder.getOptions();
        this.grid = new Grid<TreeNode<DATA>>(this.gridData, this.columns, this.gridOptions);

        // Custom row selection required for valid behaviour
        this.grid.setSelectionModel(new Slick.RowSelectionModel<TreeNode<DATA>, any>({
            selectActiveRow: false
        }));

        /*
         * Default checkbox plugin should be unselected, because the
         * cell navigation is disabled. Enabling it will break the
         * key custom key navigation. Without it plugin is having
         * some spacebar handling error, due to active cell can't be set.
         */
        this.initSelectorPlugin();

        this.grid.syncGridSelection(false);

        if (builder.getContextMenu()) {
            this.setContextMenu(builder.getContextMenu());
        }

        this.initToolbar(builder.isShowToolbar());

        this.appendChild(this.grid);

        if (this.quietErrorHandling) {
            this.appendChild(this.errorPanel = new ValidationRecordingViewer());
            this.errorPanel.hide();
        }

        if (builder.isPartialLoadEnabled()) {
            this.loadBufferSize = builder.getLoadBufferSize();
        }

        this.idPropertyName = builder.getIdPropertyName();

        this.debouncedSelectionChangeHandler = AppHelper.debounce((eventType: SelectionOnClickType) =>
                this.getSelectionChangeListenersForType(eventType)
                    .forEach(
                        (eventListener: SelectionEventListener) => eventListener.debounced && eventListener.handler()
                    )
            , 200);

        this.initEventListeners(builder);
        this.initKeyBindings();
    }

    private onAwithModKeyPress(event: Mousetrap.ExtendedKeyboardEvent) {
        let selected = this.grid.getSelectedRows();
        if (selected.length === this.gridData.getLength()) {
            this.deselectAll();
        } else {
            this.selectAll();
        }

        event.preventDefault();
        event.stopImmediatePropagation();
    }

    hasHighlightedNode(): boolean {
        return this.highlightedDataId != null && !!this.root.getNodeByDataIdFromCurrent(this.highlightedDataId);
    }

    getHighlightedItem(): DATA {
        const highlightedNode: TreeNode<DATA> = !!this.highlightedDataId ? this.root.getNodeByDataId(this.highlightedDataId) : null;
        return !!highlightedNode ? highlightedNode.getData() : null;
    }

    protected getHighlightedNode(): TreeNode<DATA> {
        return this.root.getNodeByDataIdFromCurrent(this.highlightedDataId);
    }

    getFirstSelectedOrHighlightedItem(): DATA {
        const node: TreeNode<DATA> = this.getFirstSelectedOrHighlightedNode();

        if (node) {
            return node.getData();
        }

        return null;
    }

    protected getFirstSelectedOrHighlightedNode(): TreeNode<DATA> {
        if (this.highlightedDataId) {
            return this.root.getNodeByDataId(this.highlightedDataId);
        }

        if (this.selection.hasSelectedItems()) {
            return this.root.getNodeByDataId(this.selection.getFirstItem());
        }

        return null;
    }

    getLastSelectedOrHighlightedItem(): DATA {
        const node: TreeNode<DATA> = this.getLastSelectedOrHighlightedNode();

        if (node) {
            return node.getData();
        }

        return null;
    }

    protected getLastSelectedOrHighlightedNode(): TreeNode<DATA> {
        if (this.selection.hasSelectedItems()) {
            return this.root.getNodeByDataId(this.selection.getLastItem());
        }

        if (this.highlightedDataId) {
            return this.root.getNodeByDataId(this.highlightedDataId);
        }

        return null;
    }

    hasSelectedOrHighlightedNode(): boolean {
        return this.hasHighlightedNode() || this.selection.hasSelectedItems();
    }

    hasSelectedItems(): boolean {
        return this.selection.hasSelectedItems();
    }

    getFirstSelectedItem(): DATA {
        const node: TreeNode<DATA> = this.getFirstSelectedNode();

        if (node) {
            return node.getData();
        }

        return null;
    }

    protected getFirstSelectedNode(): TreeNode<DATA> {
        if (this.selection.isEmpty()) {
            return null;
        }

        return this.root.getNodeByDataIdFromCurrent(this.selection.getFirstItem());
    }

    setContextMenu(contextMenu: TreeGridContextMenu) {
        this.contextMenu = contextMenu;
        this.grid.subscribeOnContextMenu((event) => {
            event.preventDefault();
            this.setActive(false);
            this.contextMenu.hide();

            let cell = this.grid.getCellFromEvent(event);

            if (!this.grid.isRowSelected(cell.row)) {
                const highlightedNode: TreeNode<DATA> = !!this.highlightedDataId ? this.getHighlightedNode() : null;
                if (!highlightedNode || this.getRowIndexByNode(highlightedNode) !== cell.row) {
                    this.highlightRowByNode(this.gridData.getItem(cell.row));
                }
            }
            this.showContextMenuAt(event.pageX, event.pageY);
        });
    }

    expandRow(row: number) {
        let node = this.gridData.getItem(row);
        this.expandNode(node);
    }

    collapseRow(row: number) {
        let node = this.gridData.getItem(row);
        this.collapseNode(node);
    }

    onSelectionOrHighlightingChanged(listener: () => void, debounced: boolean = true) {
        this.selectionChangeListeners.push({handler: listener, eventType: SelectionOnClickType.NONE, debounced});
    }

    private getSelectionChangeListenersForType(eventType: SelectionOnClickType): SelectionEventListener[] {
        return this.selectionChangeListeners.filter((eventListener: SelectionEventListener) =>
            eventListener.eventType === eventType || eventListener.eventType === SelectionOnClickType.NONE
        );
    }

    private notifySelectionChanged() {
        this.debouncedSelectionChangeHandler(SelectionOnClickType.SELECT);
        this.getSelectionChangeListenersForType(SelectionOnClickType.SELECT).forEach(
            (eventListener: SelectionEventListener) => !eventListener.debounced && eventListener.handler()
        );
    }

    onSelectionChanged(listener: () => void, debounced: boolean = true) {
        this.selectionChangeListeners.push({handler: listener, eventType: SelectionOnClickType.SELECT, debounced});
    }

    unSelectionChanged(listener: () => void) {
        this.selectionChangeListeners = this.selectionChangeListeners.filter((curr) => {
            return curr.handler !== listener;
        });
    }

    private notifyHighlightingChanged(): void {
        this.debouncedSelectionChangeHandler(SelectionOnClickType.HIGHLIGHT);
        this.getSelectionChangeListenersForType(SelectionOnClickType.HIGHLIGHT).forEach(
            (eventListener: SelectionEventListener) => !eventListener.debounced && eventListener.handler()
        );
    }

    onHighlightingChanged(listener: () => void, debounced: boolean = true) {
        this.selectionChangeListeners.push({handler: listener, eventType: SelectionOnClickType.HIGHLIGHT, debounced});
        return this;
    }

    unHighlightingChanged(listener: () => void) {
        this.unSelectionChanged(listener);
    }

    private getRowByNode(node: TreeNode<DATA>): JQuery {
        let rowIndex = this.getRowIndexByNode(node);
        let cell = this.grid.getCellNode(rowIndex, 0);

        return $(cell).closest('.slick-row');
    }

    removeHighlighting(skipEvent: boolean = false) {
        if (!this.highlightedDataId) {
            return;
        }

        this.highlightedDataId = null;

        this.grid.removeCellCssStyles('highlight');

        if (!skipEvent) {
            this.notifyHighlightingChanged();
        }
    }

    public isInRenderingView(): boolean {
        // TreeGrid in visible tab or TreeGrid is active
        return this.isVisible() && this.isActive();
    }

    protected isEmptyNode(_node: TreeNode<DATA>): boolean {
        return false;
    }

    protected isSelectableNode(_node: TreeNode<DATA>): boolean {
        return true;
    }

    mask() {
        this.grid.mask();
    }

    unmask() {
        this.grid.unmask();
    }

    getGrid(): Grid<TreeNode<DATA>> {
        return this.grid;
    }

    getOptions(): GridOptions<TreeNode<DATA>> {
        return this.gridOptions;
    }

    getColumns(): GridColumn<TreeNode<DATA>>[] {
        return this.grid.getColumns();
    }

    getContextMenu(): TreeGridContextMenu {
        return this.contextMenu;
    }

    protected getRoot(): TreeRoot<DATA> {
        return this.root;
    }

    getTotalSelected(): number {
        return this.selection.total();
    }

    getTotalCurrentSelected(): number {
        return this.gridData.getItems().filter((node: TreeNode<DATA>) => this.selection.contains(node.getDataId())).length;
    }

    getCurrentTotal(): number {
        return this.root.getCurrentRoot().treeToList().length;
    }

    getFullTotal(): number {
        return this.root.getDefaultRoot().treeToList(false, false).length;
    }

    getFullSelection(): DATA[] {
        return this.getFullSelectionNodes().map((node: TreeNode<DATA>) => node.getData());
    }

    protected getFullSelectionNodes(): TreeNode<DATA>[] {
        const result: TreeNode<DATA>[] = [];

        this.selection.getItems().forEach((dataId: string) => {
            const node: TreeNode<DATA> = this.root.getNodeByDataId(dataId);

            if (node) {
                result.push(node);
            }
        });

        return result;
    }

    getCurrentSelection(): DATA[] {
        const result: DATA[] = [];

        this.selection.getItems().forEach((dataId: string) => {
            const node: TreeNode<DATA> = this.root.getNodeByDataIdFromCurrent(dataId);

            if (node) {
                result.push(node.getData());
            }
        });

        return result;
    }

    isActive(): boolean {
        return this.active;
    }

    setActive(active: boolean = true) {
        if (this.active !== active) {
            this.active = active;
            this.notifyActiveChanged(active);
        }
    }

    onActiveChanged(listener: (active: boolean) => void) {
        this.activeChangedListeners.push(listener);
    }

    unActiveChanged(listener: (active: boolean) => void) {
        this.activeChangedListeners = this.activeChangedListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    getToolbar(): TreeGridToolbar {
        return this.toolbar;
    }

    hasToolbar(): boolean {
        return !!this.toolbar;
    }

    scrollToRow(row: number, skipSelectionCheck: boolean = false) {
        if (!this.scrollable) {
            // not present until shown
            return;
        }
        let scrollEl = this.scrollable.getEl();
        let rowHeight = this.gridOptions.getRowHeight();

        if (row > -1 && (skipSelectionCheck || this.grid.getSelectedRows().length > 0)) {
            if (scrollEl.getScrollTop() > row * rowHeight) {
                scrollEl.setScrollTop(row * rowHeight);
            } else if (scrollEl.getScrollTop() + scrollEl.getHeight() < (row + 1) * rowHeight) {
                scrollEl.setScrollTop((row + 1) * rowHeight - scrollEl.getHeight());
            }
        }
    }

    protected queryScrollable(): Element {
        const gridClasses = (` ${this.grid.getEl().getClass()}`).replace(/\s/g, '.');
        return Element.fromString(`.tree-grid ${gridClasses} .slick-viewport`, false);
    }

    /**
     * Used to determine if a data have child nodes.
     * Must be overridden for the grids with a tree structure.
     */
    protected hasChildren(_data: DATA): boolean {
        return false;
    }

    isEmpty(): boolean {
        return this.getGrid().getDataLength() === 0;
    }

    /**
     * Fetches a single element.
     * Can be used to update/add a single node without
     * retrieving a a full data, or for the purpose of the
     * infinite scroll.
     */
    protected fetch(_node: TreeNode<DATA>, _dataId?: string): Q.Promise<DATA> {
        let deferred = Q.defer<DATA>();
        // Empty logic
        deferred.resolve(null);
        return deferred.promise;
    }

    /**
     * Used as a default children fetcher.
     * Must be overridden to use predefined root nodes.
     */
    protected fetchChildren(_parentNode?: TreeNode<DATA>): Q.Promise<DATA[]> {
        let deferred = Q.defer<DATA[]>();
        // Empty logic
        deferred.resolve([]);
        return deferred.promise;
    }

    /**
     * Used as a default root fetcher.
     * Can be overridden to use predefined root nodes.
     * By default, return empty fetchChildren request.
     */
    protected fetchRoot(): Q.Promise<DATA[]> {
        return this.fetchChildren();
    }

    protected dataToTreeNode(data: DATA, parent: TreeNode<DATA>): TreeNode<DATA> {
        return new TreeNodeBuilder<DATA>()
            .setData(data)
            .setExpandable(this.hasChildren(data))
            .setParent(parent)
            .build();
    }

    protected dataToTreeNodes(dataArray: DATA[], parent: TreeNode<DATA>): TreeNode<DATA>[] {
        return dataArray.map((data: DATA) => this.dataToTreeNode(data, parent));
    }

    filter(dataList: DATA[]) {
        this.setActive(false);
        this.root.setFiltered(true);
        this.root.getCurrentRoot().setChildren(this.dataToTreeNodes(dataList, this.root.getCurrentRoot()));
        this.initData(this.root.getCurrentRoot().treeToList());

        if (this.toolbar?.getSelectionPanelToggler().isActive()) {
            this.setActive(true);
            return Q(null);
        }

        return this.doExpandNode(this.root.getCurrentRoot()).then(() => {
            this.invalidate();
        }).catch((reason) => {
            this.handleError(reason);
        }).finally(() => {
            this.setActive(true);
        });
    }

    resetFilter() {
        this.setActive(false);

        if (this.root.isFiltered()) {
            this.root.setFiltered(false);
            this.initData(this.root.getCurrentRoot().treeToList());
            this.invalidate();
            this.setActive(true);
            this.notifyLoaded();
        } else {
            // replace with refresh in future
            this.reload();
        }
    }

    selectNode(dataId: string, expand: boolean = false) {
        const root: TreeNode<DATA> = this.root.getCurrentRoot();
        const node: TreeNode<DATA> = root.findNode(dataId);

        if (node) {
            this.removeHighlighting(true);

            if (expand) {
                this.recursivelyExpandNode(node);
            }

            this.selection.add(node.getDataId());

            const row: number = this.getRowIndexByNode(node);
            this.selectRow(row);
        }
    }

    selectAll() {
        this.removeHighlighting(true);
        const rows: number[] = [];

        for (let i = 0; i < this.gridData.getLength(); i++) {
            const node: TreeNode<DATA> = this.gridData.getItem(i);
            const dataId: string = node.getDataId();

            if (node.isSelectable() && !StringHelper.isEmpty(dataId)) {
                rows.push(i);

                this.selection.add(node.getDataId());
            }
        }

        this.grid.setSelectedRows(rows);
    }

    deselectAll(unhighlight: boolean = true) {
        if (unhighlight) {
            this.removeHighlighting();
        }

        const forceSelectionHandlers: boolean = this.selection.hasSelectedItems() && !this.grid.isAnySelected();

        this.selection.reset();
        this.grid.clearSelection();

        if (forceSelectionHandlers) {
            this.handleSelectionChanged();
        }
    }

    deselectNodes(dataIds: string[]) {
        const oldSelectedArr: TreeNode<DATA>[] = this.getFullSelectionNodes();
        const newSelectedRows: number[] = [];

        for (const oldSelected of oldSelectedArr) {
            if (dataIds.indexOf(oldSelected.getDataId()) < 0) {
                newSelectedRows.push(this.getRowIndexByNode(oldSelected));
            }
        }

        dataIds.forEach((nodeDataId: string) => {
            this.selection.remove(nodeDataId);
        });

        const isGridSelectionChanged: boolean = this.grid.getSelectedRows().length !== newSelectedRows.length;

        this.grid.setSelectedRows(newSelectedRows);

        if (this.selection.isSelectionChanged() && !isGridSelectionChanged) {
            this.handleSelectionChanged();
        }
    }

    getSelectedDataList(): DATA[] {
        const selectedItems: DATA[] = this.getFullSelection();

        if (!!this.highlightedDataId && selectedItems.length <= 1) {
            const data: DATA = this.getHighlightedItem();
            return !!data ? [data] : [];
        }

        return selectedItems;
    }

    setSelectedItems(dataIds: string[]) {
        this.selection.set(dataIds);
        this.removeHighlighting(true);
        this.resetCurrentSelection();
    }

    getSelectedItems(): string[] {
        return this.selection.getItems();
    }

    protected setSelectionOnClick(type: SelectionOnClickType): void {
        this.selectionOnClick = type;
    }

    reload(): Q.Promise<void> {
        this.root.resetCurrentRoot();
        this.gridData.setItems([], this.idPropertyName);

        return this.doExpandNode(this.root.getCurrentRoot())
            .catch((reason) => {
                this.initData([]);
                this.handleError(reason);
            }).then(() => {
                this.setActive(true);
                this.notifyLoaded();
            });
    }

    updateNodesByData(dataItems: DATA[]) {
        dataItems.forEach((updatedData: DATA) => {
            this.updateNodeByData(updatedData);
        });
    }

    updateNodeByData(updatedData: DATA, oldDataId?: string) {
        const dataId: string = !!oldDataId ? oldDataId : updatedData.getId();
        const treeNodes: TreeNode<DATA>[] = this.root.getNodesByDataId(dataId);

        treeNodes.forEach((updatedNode: TreeNode<DATA>) => {
            this.doUpdateNodeByData(updatedNode, updatedData);
        });
    }

    protected doUpdateNodeByData(nodeToUpdate: TreeNode<DATA>, data: DATA) {
        nodeToUpdate.setData(data);
        this.invalidateNodes([nodeToUpdate]);
        this.notifyDataChanged(new DataChangedEvent<DATA>(this.extractDataFromNodes([nodeToUpdate]), DataChangedType.UPDATED));
    }

    deleteNodeByDataId(dataId: string) {
        const nodes: TreeNode<DATA>[] = this.root.getNodesByDataId(dataId);

        nodes.forEach((node: TreeNode<DATA>) => {
            this.deleteNode(node);
        });
    }

    protected deleteNode(node: TreeNode<DATA>): void {
        this.deleteNodes([node]);
    }

    protected deleteNodes(nodes: TreeNode<DATA>[]): void {
        let isHighlightingToRemove: boolean = false;
        let isSelectionChanged: boolean = false;
        const nodesDeleted: TreeNode<DATA>[] = [];
        const nodesToInvalidate: TreeNode<DATA>[] = [];

        this.gridData.beginUpdate();

        nodes.forEach((node: TreeNode<DATA>) => {
            if (this.highlightedDataId === node.getDataId()) {
                isHighlightingToRemove = true;
            }

            if (this.gridData.getItemById(node.getId())) {
                this.gridData.deleteItem(node.getId());
            }

            if (this.selection.contains(node.getDataId())) {
                this.selection.remove(node.getDataId());
                isSelectionChanged = true;
            }

            const parent: TreeNode<DATA> = node.getParent();

            if (parent) {
                parent.removeChild(node);
                parent.setMaxChildren(parent.getMaxChildren() - 1);

                if (!parent.hasChildren()) {
                    parent.setExpandable(false);
                }

                nodesDeleted.push(node);

                if (nodesToInvalidate.indexOf(parent) < 0) {
                    nodesToInvalidate.push(parent);
                }
            }
        });

        this.gridData.endUpdate();

        this.invalidateNodes(nodesToInvalidate);
        this.notifyDataChanged(new DataChangedEvent<DATA>(this.extractDataFromNodes(nodesDeleted), DataChangedType.DELETED));

        if (isHighlightingToRemove) {
            this.removeHighlighting();
        }

        if (isSelectionChanged) {
            this.handleSelectionChanged();
        }
    }

    protected getGridData(): DataView<TreeNode<DATA>> {
        return this.gridData;
    }

    protected getIdPropertyName(): string {
        return this.idPropertyName;
    }

    initData(nodes: TreeNode<DATA>[]) {
        this.grid.removeCellCssStyles('highlight');
        this.gridData.setItems(nodes, this.idPropertyName);
        this.resetCurrentSelection();
    }

    expandNodeByDataId(dataId: string): Q.Promise<boolean> {
        const node: TreeNode<DATA> = this.root.getNodeByDataIdFromCurrent(dataId);

        if (node) {
            return this.expandNode(node);
        }

        return Q(false);
    }

    protected expandNode(node?: TreeNode<DATA>): Q.Promise<boolean> {
        node = node || this.root.getCurrentRoot();

        if (node) {
            return this.doExpandNode(node);
        }

        return Q(false);
    }

    private doExpandNode(node: TreeNode<DATA>): Q.Promise<boolean> {
        const dataId: string = node.getDataId();

        if (dataId && this.expandedNodesDataIds.indexOf(dataId) < 0) {
            this.expandedNodesDataIds.push(dataId);
        }

        return this.fetchExpandedNodeChildren(node)
            .then(() => {
                node.setExpanded(true);
                this.initData(this.root.getCurrentRoot().treeToList());
                this.invalidateNodes([node]);
                return this.expandNodeChildren(node);
            }).catch((reason) => {
                this.handleError(reason);
                return false;
            }).finally(() => this.setActive(true));
    }

    private fetchExpandedNodeChildren(node: TreeNode<DATA>): Q.Promise<void> {
        if (node.hasChildren()) {
            return Q(null);
        }

        this.mask();

        return this.fetchData(node)
            .then((dataList: DATA[]) => {
                node.setChildren(this.dataToTreeNodes(dataList, node));
            })
            .finally(this.unmask.bind(this));
    }

    private expandNodeChildren(node: TreeNode<DATA>): Q.Promise<void> {
        const promises: Q.Promise<boolean>[] = [];

        node.getChildren().forEach((child: TreeNode<DATA>) => {
            if (this.isToBeExpanded(child)) {
                promises.push(this.doExpandNode(child));
            }
        });

        return Q.all(promises).thenResolve(null);
    }

    isAllSelected(): boolean {
        if (this.grid.isAllSelected()) {
            return true;
        }

        let selectedNodes = this.grid.getSelectedRows();

        if (!selectedNodes) {
            return false;
        }

        const nonEmptyNodes: TreeNode<DATA>[] = this.gridData.getItems().filter((data: TreeNode<DATA>) => {
            return (!!data && data.getDataId() !== '');
        });

        return nonEmptyNodes.length === selectedNodes.length;
    }

    isAnySelected(): boolean {
        return this.grid.isAnySelected();
    }

    collapseNodeByRow(row: number) {
        const nodes: TreeNode<DATA>[] = this.getRoot().getCurrentRoot().treeToList();
        const draggedNode: TreeNode<DATA> = nodes[row];
        this.collapseNode(draggedNode);
    }

    collapseNodeByDataId(dataId: string, collapseAll: boolean = false) {
        const node: TreeNode<DATA> = this.root.getNodeByDataIdFromCurrent(dataId);

        if (node) {
            this.collapseNode(node, collapseAll);
        }
    }

    protected collapseNode(node: TreeNode<DATA>, collapseAll: boolean = false) {
        node.setExpanded(false);

        this.expandedNodesDataIds.splice(this.expandedNodesDataIds.indexOf(node.getDataId()), 1);

        if (collapseAll) {
            node.treeToList(false, false).forEach((n: TreeNode<DATA>) => {
                n.setExpanded(false);
                this.expandedNodesDataIds.splice(this.expandedNodesDataIds.indexOf(n.getDataId()), 1);
            });
        }

        this.grid.removeCellCssStyles('highlight');
        this.gridData.refresh();
        this.invalidate();
        this.setActive(true);
    }

    protected toggleNode(node: TreeNode<DATA>) {
        if (node.isExpanded()) {
            this.collapseNode(node);
        } else {
            this.expandNode(node);
        }
    }

    notifyLoaded(): void {
        this.loadedListeners.forEach((listener) => {
            listener(this);
        });
    }

    onLoaded(listener: () => void) {
        this.loadedListeners.push(listener);
        return this;
    }

    unLoaded(listener: () => void) {
        this.loadedListeners = this.loadedListeners.filter((curr) => {
            return curr !== listener;
        });
        return this;
    }

    protected getItem(rowIndex: number): TreeNode<DATA> {
        return this.gridData.getItem(rowIndex);
    }

    onContextMenuShown(listener: () => void) {
        this.contextMenuListeners.push(listener);
        return this;
    }

    unContextMenuShown(listener: () => void) {
        this.contextMenuListeners = this.contextMenuListeners.filter((curr) => {
            return curr !== listener;
        });
        return this;
    }

    protected notifyDataChanged(event: DataChangedEvent<DATA>) {
        this.dataChangeListeners.forEach((listener) => {
            listener(event);
        });
    }

    onDataChanged(listener: (event: DataChangedEvent<DATA>) => void) {
        this.dataChangeListeners.push(listener);
        return this;
    }

    unDataChanged(listener: (event: DataChangedEvent<DATA>) => void) {
        this.dataChangeListeners = this.dataChangeListeners.filter((curr) => {
            return curr !== listener;
        });
        return this;
    }

    isFiltered() {
        return this.root.isFiltered();
    }

    invalidate() {
        this.grid.invalidate();

        if (this.isHighlightedNodeSelected() && !this.gridOptions.isMultipleSelectionDisabled()) {
            return;
        }

        this.highlightCurrentNode();
    }

    private isHighlightedNodeSelected() {
        return this.highlightedDataId && this.selection.contains(this.highlightedDataId);
    }

    protected invalidateNodes(nodes: TreeNode<DATA>[]) {
        if (!nodes.length) {
            return;
        }
        this.grid.invalidateRows(nodes.map(node => this.getRowIndexByNode(node)));
        this.grid.renderGrid();

        this.highlightCurrentNode();
    }

    protected sortNodeChildren(_node: TreeNode<DATA>): void {
        // must be implemented by children
    }

    protected isNodeHighlighted(node: TreeNode<DATA>) {
        // grid could've been refreshed resulting in new nodeIds, so compare dataIds
        return node !== null && this.highlightedDataId !== null && node.getDataId() === this.highlightedDataId;
    }

    protected createToolbar(): TreeGridToolbar {
        return new TreeGridToolbar(this);
    }

    protected setColumns(columns: GridColumn<TreeNode<DATA>>[], toBegin: boolean = false) {
        this.getGrid().setColumns(columns, toBegin);
        this.highlightCurrentNode();
    }

    protected editItem(_node: TreeNode<DATA>) {
        return;
    }

    protected highlightCurrentNode() {
        if (!this.highlightedDataId || this.isHighlightedNodeSelected()) {
            return;
        }

        this.highlightRowByNode(this.getHighlightedNode());
    }

    protected handleError(reason: any, message?: String) {
        this.grid.show();
        if (this.quietErrorHandling) {
            this.errorPanel.setError(message || reason);
            this.grid.hide();
            this.errorPanel.show();
        } else {
            DefaultErrorHandler.handle(reason);
        }
    }

    // Hard reset

    protected hideErrorPanel() {
        this.grid.show();
        if (this.quietErrorHandling) {
            this.errorPanel.hide();
        }
    }

    protected getErrorPanel(): ValidationRecordingViewer {
        return this.errorPanel;
    }

    protected handleItemMetadata(row: number) {
        const node = this.gridData.getItem(row);

        if (this.isEmptyNode(node)) {
            return {cssClasses: 'empty-node'};
        }

        if (!this.isSelectableNode(node)) {
            node.setSelectable(false);

            return {cssClasses: 'non-selectable', selectable: false} as any;
        }

        return null;
    }

    private initSelectorPlugin() {
        let selectorPlugin = this.grid.getCheckboxSelectorPlugin();
        if (selectorPlugin) {
            this.grid.unregisterPlugin(this.grid.getCheckboxSelectorPlugin());
        }
    }

    private initToolbar(showToolbar: boolean) {
        if (showToolbar) {
            this.toolbar = this.createToolbar();
            this.appendChild(this.toolbar);
            // make sure it won't left from the cloned grid
            this.removeClass('no-toolbar');
        } else {
            this.addClass('no-toolbar');
        }
    }

    private initKeyBindings() {
        if (!this.gridOptions.isMultipleSelectionDisabled()) {
            this.keyBindings = [
                new KeyBinding('shift+up', (event: Mousetrap.ExtendedKeyboardEvent) => {
                    const rowToToggle: number = new GridSelectionHelper(this.grid.getSelectedRows()).getRowToToggleWhenShiftingUp();
                    this.onSelectRange(rowToToggle);
                    event.preventDefault();
                    event.stopImmediatePropagation();
                }),
                new KeyBinding('shift+down', (event: Mousetrap.ExtendedKeyboardEvent) => {
                    const rowToToggle: number =
                        new GridSelectionHelper(this.grid.getSelectedRows()).getRowToToggleWhenShiftingDown(this.grid.getDataLength());
                    this.onSelectRange(rowToToggle);
                    event.preventDefault();
                    event.stopImmediatePropagation();
                })
            ];
        }

        this.keyBindings = this.keyBindings.concat(this.createKeyBindings());
    }

    protected createKeyBindings(): KeyBinding[] {
        return [
            new KeyBinding('up', this.onUpKeyPress.bind(this)),
            new KeyBinding('down', this.onDownKeyPress.bind(this)),
            new KeyBinding('left', this.onLeftKeyPress.bind(this)),
            new KeyBinding('right', this.onRightKeyPress.bind(this)),
            new KeyBinding('mod+a', this.onAwithModKeyPress.bind(this)),
            new KeyBinding('space', this.onSpaceKeyPress.bind(this)),
            new KeyBinding('enter', this.onEnterKeyPress.bind(this))
        ];
    }

    private onSelectRange(rowToToggle: number) {
        if (!this.isActive()) {
            return;
        }

        if (this.highlightedDataId) {
            this.recursivelyExpandHighlightedNode();
            const row: number = this.getRowIndexByNode(this.getHighlightedNode());
            if (!this.grid.isRowSelected(row)) {
                this.selectRow(row);
            }
        }

        if (rowToToggle < 0) {
            return;
        }

        this.toggleRow(rowToToggle);
        this.scrollToRow(this.grid.getSelectedRows().pop());
    }

    private initEventListeners(builder: TreeGridBuilder<DATA>) {
        this.onClicked(() => {
            this.grid.focus();
        });

        if (builder.isAutoLoad()) {
            this.onAdded(() => {
                this.reload().then(() => this.grid.resizeCanvas());
            });
        }

        this.bindClickEvents(builder.isToggleClickEnabled());

        this.grid.onShown(() => {
            this.scrollable = this.queryScrollable();
            this.bindKeys();
            this.enablePostLoad(builder);
        });

        this.onRendered(() => {
            this.grid.resizeCanvas();
        });

        this.grid.onHidden(() => {
            this.unbindKeys();
            this.disablePostLoad(builder);
        });

        this.grid.subscribeOnSelectedRowsChanged((_event, rows) => {
            this.handleSelectionChanged();
        });

        this.onLoaded(() => this.unmask());

        const updateColumns = builder.getColumnUpdater() || function () { /* empty */
        };
        const updateColumnsHandler = (force?: boolean) => {
            if (force) {
                updateColumns();
                this.getGrid().syncGridSelection(true);
            } else {
                this.highlightCurrentNode();
            }

            this.getGrid().resizeCanvas();
        };

        const onBecameActive = (active: boolean) => {
            if (active) {
                updateColumnsHandler(true);
                this.unActiveChanged(onBecameActive);
            }
        };
        // update columns when grid becomes active for the first time
        this.onActiveChanged(onBecameActive);

        ResponsiveManager.onAvailableSizeChanged(this, (item: ResponsiveItem) => {
            if (this.isInRenderingView()) {
                updateColumnsHandler(item.isRangeSizeChanged());
            }
        });
    }

    private enablePostLoad(builder: TreeGridBuilder<DATA>) {
        if (builder.isPartialLoadEnabled() && !this.interval) {
            this.interval = window.setInterval(this.postLoad.bind(this), 200);
        }
    }

    private disablePostLoad(builder: TreeGridBuilder<DATA>) {
        if (builder.isPartialLoadEnabled() && this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    enableKeys() {
        this.hotkeysEnabled = true;
        this.bindKeys();
    }

    private bindKeys() {
        if (!this.hotkeysEnabled || this.keysBound) {
            return;
        }

        this.keysBound = true;

        KeyBindings.get().shelveBindings(this.keyBindings);
        KeyBindings.get().bindKeys(this.keyBindings);
    }

    disableKeys() {
        this.unbindKeys();
        this.hotkeysEnabled = false;
    }

    private unbindKeys() {
        if (!this.hotkeysEnabled || !this.keysBound) {
            return;
        }

        this.keysBound = false;

        KeyBindings.get().unbindKeys(this.keyBindings);
        KeyBindings.get().unshelveBindings(this.keyBindings);
    }

    private bindClickEvents(toggleClickEnabled: boolean): void {
        const clickHandler = ((event, data) => {
            if (!this.isActive()) {
                return;
            }

            const elem = new ElementHelper(event.target);

            if (this.contextMenu) {
                this.contextMenu.hide();
            }

            if (event.shiftKey) {
                this.onClickWithShift(event, data);
                return;
            }

            if (event.metaKey || event.ctrlKey) {
                this.onClickWithCmd(data);
                return;
            }

            this.setActive(false);

            if (toggleClickEnabled) {
                if (elem.hasClass('expand')) {
                    this.expandOnClick(elem, data);
                    return;
                }

                if (elem.hasClass('collapse')) {
                    this.collapseOnClick(elem, data);
                    return;
                }
            }

            this.setActive(true);

            // Checkbox is clicked
            const isCheckboxClicked = elem.hasClass('slick-cell-checkboxsel') || elem.hasAnyParentClass('slick-cell-checkboxsel');
            const selectOnClick = this.selectionOnClick === SelectionOnClickType.SELECT;

            if (selectOnClick || this.gridOptions.isMultipleSelectionDisabled() || isCheckboxClicked) {

                this.onRowSelected(data);
                return;
            }

            if (this.selectionOnClick === SelectionOnClickType.HIGHLIGHT) {
                this.onRowHighlighted(elem, data);
            }
        });

        this.grid.subscribeOnClick(clickHandler);
    }

    private onClickWithShift(event: any, data: Slick.OnClickEventArgs<DATA>) {
        const node = this.gridData.getItem(data.row);
        const thereIsHighlightedNode = !!this.highlightedDataId && !this.isNodeHighlighted(node) && this.getHighlightedNode().isVisible();
        const isMultiSelect = !this.gridOptions.isMultipleSelectionDisabled();

        if (!this.grid.isRowSelected(data.row) && (this.grid.getSelectedRows().length >= 1 || thereIsHighlightedNode)) {
            if (isMultiSelect) {
                const highlightFrom: number =
                    thereIsHighlightedNode ? this.getRowIndexByNode(this.getHighlightedNode()) : this.grid.getSelectedRows()[0];
                const highlightTo: number = data.row;

                this.removeHighlighting();

                if (highlightFrom > highlightTo) {
                    for (let i = highlightFrom; i >= highlightTo; i--) {
                        if (!this.grid.isRowSelected(i)) {
                            this.toggleRow(i);
                        }
                    }
                } else {
                    for (let i = highlightFrom; i <= highlightTo; i++) {
                        if (!this.grid.isRowSelected(i)) {
                            this.toggleRow(i);
                        }
                    }
                }

                event.stopPropagation();
                event.preventDefault();
                return;
            } else {
                this.deselectAll();
            }
        }

        this.toggleRow(data.row);
    }

    private onClickWithCmd(data: Slick.OnClickEventArgs<DATA>) {
        const node = this.gridData.getItem(data.row);
        if (!this.grid.isRowSelected(data.row) && this.getHighlightedNode() !== node) {
            this.removeHighlighting(true);
        }
        this.toggleRow(data.row);
    }

    protected expandOnClick(elem: ElementHelper, data: Slick.OnClickEventArgs<DATA>): void {
        const node: TreeNode<DATA> = this.gridData.getItem(data.row);
        elem.removeClass('expand').addClass('collapse');
        this.expandNode(node).then(() => {
            this.highlightCurrentNode();
        });
    }

    private recursivelyExpandHighlightedNode() {
        this.recursivelyExpandNode(this.getHighlightedNode());
    }

    private recursivelyExpandNode(node: TreeNode<DATA>) {
        if (!node || node.isVisible()) {
            return;
        }

        let parent: TreeNode<DATA> = node.getParent();
        while (parent && !node.isVisible()) {
            this.expandNode(parent);
            parent = parent.getParent();
        }

    }

    protected collapseOnClick(elem: ElementHelper, data: Slick.OnClickEventArgs<DATA>): void {
        const node: TreeNode<DATA> = this.gridData.getItem(data.row);
        elem.removeClass('collapse').addClass('expand');
        this.collapseNode(node);
    }

    private onRowSelected(data: Slick.OnClickEventArgs<DATA>) {
        const node = this.gridData.getItem(data.row);

        if (this.gridOptions.isMultipleSelectionDisabled()) {
            this.selectRow(data.row);
            return;
        }

        if (this.grid.getSelectedRows().length > 1) {
            this.removeHighlighting(true);
        } else if (!this.grid.isRowSelected(data.row) && this.getHighlightedNode() !== node) {
            this.removeHighlighting(true);
        }

        this.toggleRow(data.row);
    }

    private onUpKeyPress() {
        if (!this.isActive()) {
            return;
        }

        this.navigateUp();
    }

    protected navigateUp(): void {
        this.recursivelyExpandHighlightedNode();

        if (this.contextMenu) {
            this.contextMenu.hide();
        }

        if (this.gridOptions.isMultipleSelectionDisabled()) {
            const row: number = new GridSelectionHelper(this.grid.getSelectedRows()).getRowToSingleSelectUp();
            if (row >= 0) {
                this.selectRow(row, true);
                this.scrollToRow(row);
            }
        } else {
            this.highlightPrevious();
        }
    }

    private onDownKeyPress() {
        if (!this.isActive()) {
            return;
        }

        this.navigateDown();
    }

    protected navigateDown(): void {
        this.recursivelyExpandHighlightedNode();

        if (this.contextMenu) {
            this.contextMenu.hide();
        }

        if (this.gridOptions.isMultipleSelectionDisabled()) {
            const row: number = new GridSelectionHelper(this.grid.getSelectedRows()).getRowToSingleSelectDown(this.grid.getDataLength());

            if (row >= 0) {
                this.selectRow(row, true);
                this.scrollToRow(row);
            }
        } else {
            this.highlightNext();
        }
    }

    private onLeftKeyPress() {
        let selected = this.grid.getSelectedRows();
        if (selected.length !== 1 && !this.highlightedDataId) {
            return;
        }

        this.recursivelyExpandHighlightedNode();
        if (this.contextMenu) {
            this.contextMenu.hide();
        }
        let node = this.gridData.getItem(selected[0]) || this.getHighlightedNode();
        if (node && this.isActive()) {
            if (node.isExpanded()) {
                this.setActive(false);
                this.collapseNode(node);
                if (!NumberHelper.isNumber(selected[0])) {
                    this.highlightRowByNode(node);
                }
            } else if (node.getParent() !== this.root.getCurrentRoot()) {
                node = node.getParent();
                this.setActive(false);
                let row = this.getRowIndexByNode(node);
                this.collapseNode(node);
                if (NumberHelper.isNumber(selected[0])) {
                    this.deselectAll();
                    this.selectRow(row, true);
                } else {
                    this.highlightRowByNode(node);
                }
            }
        }
    }

    private onRightKeyPress() {
        let selected = this.grid.getSelectedRows();
        if (selected.length !== 1 && !this.highlightedDataId) {
            return;
        }

        this.recursivelyExpandHighlightedNode();
        if (this.contextMenu) {
            this.contextMenu.hide();
        }
        let node = this.gridData.getItem(selected[0]) || this.getHighlightedNode();
        if (node && this.hasChildren(node.getData())
            && !node.isExpanded() && this.isActive()) {

            this.setActive(false);
            this.invalidate();
            this.expandNode(node).then(() => {
                if (!NumberHelper.isNumber(selected[0])) {
                    this.highlightCurrentNode();
                }
            });
        }
    }

    private onSpaceKeyPress() {
        if (this.highlightedDataId) {
            this.recursivelyExpandHighlightedNode();
            let row = this.getRowIndexByNode(this.getHighlightedNode());
            this.toggleRow(row);
        } else if (this.grid.getSelectedRows().length > 0) {
            this.deselectAll();
        }
    }

    private onEnterKeyPress(e: KeyboardEvent) {
        const node: TreeNode<DATA> = this.getLastSelectedOrHighlightedNode();

        if (node) {
            this.editItem(node);
        }
    }

    private onRowHighlighted(elem: ElementHelper, data: Slick.OnClickEventArgs<DATA>) {
        const node = this.gridData.getItem(data.row);
        const clickedCell = $(elem.getHTMLElement()).closest('.slick-cell');
        const isRowSelected = this.grid.isRowSelected(data.row);
        const isMultipleRowsSelected = this.grid.getSelectedRows().length > 1;
        const isRowHighlighted = clickedCell.hasClass('highlight');

        if (elem.hasClass('sort-dialog-trigger') && (isRowSelected || isRowHighlighted)) {
            if (isMultipleRowsSelected) {
                this.selectRow(data.row);
            }
            return;
        }

        // Clear selection and highlighting if something was selected or highlighted from before
        if (this.selection.hasSelectedItems() || isRowHighlighted) {
            this.deselectAll();
        }

        if (!isRowHighlighted) {
            this.highlightRowByNode(node);
        }
    }

    protected highlightPrevious() {
        let selectedCount = this.grid.getSelectedRows().length;
        if (!this.highlightedDataId && selectedCount === 0) {
            return;
        }

        let selectedIndex = this.highlightedDataId
            ? this.getRowIndexByNode(this.getHighlightedNode())
            : this.grid.getSelectedRows()[selectedCount - 1];

        if (selectedIndex > 0) {
            this.deselectAll();
            selectedIndex--;
            this.highlightRowByNode(this.gridData.getItem(selectedIndex));
            this.scrollToRow(selectedIndex, true);
        }
    }

    protected highlightNext() {
        let selectedIndex = this.highlightedDataId ? this.getRowIndexByNode(this.getHighlightedNode()) : -1;
        if (this.grid.getSelectedRows().length > 0) {
            selectedIndex = this.grid.getSelectedRows()[0];
        }

        if (this.gridData.getLength() > 0 && selectedIndex < this.gridData.getLength() - 1) {
            this.deselectAll();
            selectedIndex++;
            this.highlightRowByNode(this.gridData.getItem(selectedIndex));
            this.scrollToRow(selectedIndex, true);
        }
    }

    private getRowIndexByNode(node: TreeNode<DATA>): number {
        let rowIndex = this.gridData.getRowById(node.getId());
        if (isNaN(rowIndex)) {
            // When search is applied content nodes get different Ids,
            // so we should try to search by dataId and not by nodeId

            let nodesByDataId = this.grid.getDataView().getItems().filter(item => item.getDataId() === node.getDataId());
            if (!nodesByDataId || nodesByDataId.length === 0 || !nodesByDataId[0].isVisible()) {
                return null;
            }

            rowIndex = this.grid.getDataView().getItems().map(item => item.getDataId()).indexOf(node.getDataId());
        }

        return rowIndex;
    }

    private updateColumnsFormatter(columns: GridColumn<TreeNode<DATA>>[]) {
        if (columns.length > 0) {
            let formatter = columns[0].getFormatter();
            let toggleFormatter = (row: number, cell: number, value: any, columnDef: any, node: TreeNode<DATA>) => {
                let toggleSpan = new SpanEl('toggle icon');
                if (node.isExpandable()) {
                    let toggleClass = node.isExpanded() ? 'collapse' : 'expand';
                    toggleSpan.addClass(toggleClass);
                }
                toggleSpan.getEl().setMarginLeft(TreeGrid.LEVEL_STEP_INDENT * (node.calcLevel() - 1) + 'px');

                return toggleSpan.toString() + formatter(row, cell, value, columnDef, node);
            };

            columns[0].setFormatter(toggleFormatter);
        }

        return columns;
    }

    private notifyActiveChanged(active: boolean) {
        this.activeChangedListeners.forEach((listener) => {
            listener(active);
        });
    }

    private loadEmptyNode(node: TreeNode<DATA>) {
        if (node.getDataId()) {
            return;
        }

        this.fetchChildren(node.getParent()).then((dataList: DATA[]) => {
            const oldChildren: TreeNode<DATA>[] = node.getParent().getChildren();
            // Ensure to remove empty node from the end if present
            if (oldChildren.length > 0 && oldChildren[oldChildren.length - 1].getDataId() === '') {
                oldChildren.pop();
            }
            const fetchedChildren: TreeNode<DATA>[] = this.dataToTreeNodes(dataList, node.getParent());
            const childrenToAdd: TreeNode<DATA>[] = fetchedChildren.slice(oldChildren.length);
            childrenToAdd
                .filter((child: TreeNode<DATA>) => this.isToBeExpanded(child))
                .forEach((child: TreeNode<DATA>) => {
                    this.expandNode(child);
                });
            const newChildren: TreeNode<DATA>[] = oldChildren.concat(childrenToAdd);
            node.getParent().setChildren(newChildren);
            this.initData(this.root.getCurrentRoot().treeToList());
        }).catch((reason) => {
            this.handleError(reason);
        }).then(() => {
            this.notifyLoaded();
            this.loading = false;
        });
    }

    private postLoad() {
        // Skip if not visible or active (is loading something)
        const disabled = !this.isInRenderingView() || this.loading;

        if (disabled) {
            return;
        }

        const viewportRange = this.grid.getViewport();
        const lastIndex = this.gridData.getItems().length - 1;
        // first and last rows, that are visible in grid
        const firstVisible = viewportRange.top;
        const lastVisible = Math.min(viewportRange.bottom, lastIndex);
        // interval borders to search for the empty node
        const from = firstVisible;
        const to = Math.min(lastVisible + this.loadBufferSize, lastIndex);

        for (let i = from; i <= to; i++) {
            if (this.gridData.getItem(i) && !this.gridData.getItem(i).getDataId()) {
                this.loading = true;
                this.loadEmptyNode(this.gridData.getItem(i));
                break;
            }
        }
    }

    private fetchData(parentNode?: TreeNode<DATA>): Q.Promise<DATA[]> {
        return parentNode && parentNode.hasParent() ? this.fetchChildren(parentNode) : this.fetchRoot();
    }

    private resetCurrentSelection() {
        const selection: number[] = [];

        this.selection.getItems().forEach((selectionId: string) => {
            const nodeToSelect: TreeNode<DATA> = this.root.getNodeByDataId(selectionId);

            if (nodeToSelect) {
                const rowNumber: number = this.getRowIndexByNode(nodeToSelect);

                if (NumberHelper.isNumber(rowNumber) && rowNumber > -1) {
                    selection.push(rowNumber);
                }
            }
        });

        this.grid.setSelectedRows(selection);
    }

    private handleSelectionChanged(): void {
        if (this.selection.isSelectionChanged()) {
            this.notifySelectionChanged();
            this.selection.resetSelectionChanged();
        }
    }

    private showContextMenuAt(x: number, y: number) {
        this.contextMenu.showAt(x, y);
        this.notifyContextMenuShown(x, y);
        this.setActive(true);
    }

    private highlightRowByNode(node: TreeNode<DATA>, silent: boolean = false) {
        if (!node) {
            return;
        }

        if (this.selectionOnClick === SelectionOnClickType.SELECT) {
            return;
        }

        const isCurRowHighlighted = this.highlightedDataId && this.getHighlightedNode() === node;

        if (this.selection.hasSelectedItems() || isCurRowHighlighted) {
            this.deselectAll(false);
        }

        if (!isCurRowHighlighted) {
            this.removeHighlighting(silent);
            this.highlightedDataId = node.getDataId();

            if (!silent) {
                this.notifyHighlightingChanged();
            }
        }

        let row = this.getRowByNode(node);
        if (row) {
            const rowIndex: number = this.getRowIndexByNode(node);
            const stylesHash: Slick.CellCssStylesHash = {};
            stylesHash[rowIndex] = {};
            this.columns.forEach((col: GridColumn<TreeNode<DATA>>) => {
                stylesHash[rowIndex][col.id] = 'highlight';
            });
            this.grid.setCellCssStyles('highlight', stylesHash);
        }
    }

    private notifyContextMenuShown(x: number, y: number) {
        let showContextMenuEvent = new ContextMenuShownEvent(x, y);
        this.contextMenuListeners.forEach((listener) => {
            listener(showContextMenuEvent);
        });
    }

    private toggleRow(row: number) {
        const node: TreeNode<DATA> = this.gridData.getItem(row);
        if (!node || !node.isSelectable()) {
            return;
        }

        const nodeDataId: string = node.getDataId();

        if (this.grid.isRowSelected(row)) {
            this.selection.remove(nodeDataId);
        } else {
            this.selection.add(nodeDataId);
        }

        this.grid.toggleRow(row);
    }

    resetExpandedNodesDataIds() {
        this.expandedNodesDataIds = [];
    }

    protected selectRow(row: number, debounce?: boolean) {
        const nodeToSelect: TreeNode<DATA> = this.gridData.getItem(row);
        if (!nodeToSelect) {
            return;
        }

        const nodeDataId: string = nodeToSelect.getDataId();
        this.selection.reset();
        this.selection.add(nodeDataId);

        this.grid.selectRow(row, debounce);
    }

    hasItemWithDataId(dataId: string): boolean {
        return !!this.root.getNodeByDataId(dataId);
    }

    hasItemWithDataIdInDefault(dataId: string): boolean {
        return !!this.root.getNodeByDataIdFromDefault(dataId);
    }

    getItemWithDataId(dataId: string): DATA {
        const node: TreeNode<DATA> = this.root.getNodeByDataId(dataId);

        return !!node ? node.getData() : null;
    }

    getItemWithDataIdFromDefault(dataId: string): DATA {
        const node: TreeNode<DATA> = this.root.getNodeByDataIdFromDefault(dataId);

        return !!node ? node.getData() : null;
    }

    getItemWithDataIdFromFiltered(dataId: string): DATA {
        const node: TreeNode<DATA> = this.root.getNodeByDataIdFromFiltered(dataId);

        return !!node ? node.getData() : null;
    }

    protected insertDataToParentNode(data: DATA, parent: TreeNode<DATA>, index: number) {
        const nodeToInsert: TreeNode<DATA> = this.dataToTreeNode(data, parent);
        this.insertNodeToParentNode(nodeToInsert, parent, index);
    }

    protected appendDataToParentNode(data: DATA, parent: TreeNode<DATA>) {
        const insertIndex: number = parent.getChildren().length;
        this.insertDataToParentNode(data, parent, insertIndex);
    }

    protected insertNodeToParentNode(nodeToInsert: TreeNode<DATA>, parent: TreeNode<DATA>, index: number) {
        this.gridData.insertItem(this.getIndexRelativeToParent(parent, index), nodeToInsert);
        parent.insertChild(nodeToInsert, index);
        parent.setExpandable(true);
        this.invalidateNodes([parent]);
        this.notifyDataChanged(new DataChangedEvent<DATA>(this.extractDataFromNodes([nodeToInsert]), DataChangedType.ADDED));
    }

    private getIndexRelativeToParent(parent: TreeNode<DATA>, index: number): number {
        let nodeToInsertBefore: TreeNode<DATA> = parent.getChildren()[index];

        if (nodeToInsertBefore) {
            return this.gridData.getRowById(nodeToInsertBefore.getId());
        }

        if (!parent.hasParent()) {
            return this.gridData.getLength();
        }

        return this.getIndexRelativeToParent(parent.getParent(), parent.getParent().getChildren().indexOf(parent) + 1);
    }

    moveNode(from: number, to: number): number {
        const root: TreeNode<DATA> = this.getRoot().getCurrentRoot();
        const rootChildren: TreeNode<DATA>[] = root.treeToList();

        const item: TreeNode<DATA> = rootChildren.slice(from, from + 1)[0];
        rootChildren.splice(rootChildren.indexOf(item), 1);
        rootChildren.splice(to, 0, item);

        this.initData(rootChildren);
        root.setChildren(rootChildren);

        return rootChildren.indexOf(item);
    }

    getDataByRow(row: number): DATA {
        const nodes: TreeNode<DATA>[] = this.getRoot().getCurrentRoot().treeToList();
        const node = nodes[row];

        return !!node ? node.getData() : null;
    }

    getParentDataById(dataId: string): DATA {
        const node: TreeNode<DATA> = this.root.getNodeByDataIdFromDefault(dataId);

        if (!node) {
            return null;
        }

        return node.getParent().getData();
    }

    getCurrentData(expanded: boolean = true): DATA[] {
        return this.root.getCurrentRoot().treeToList(false, expanded).map((node: TreeNode<DATA>) => node.getData());
    }

    getDefaultData(expanded: boolean = true): DATA[] {
        return this.root.getDefaultRoot().treeToList(false, expanded).map((node: TreeNode<DATA>) => node.getData());
    }

    getDataLevel(data: DATA): number {
        const node: TreeNode<DATA> = this.root.getNodeByDataIdFromCurrent(data.getId());
        return !!node ? node.calcLevel() : -1;
    }

    isExpandedAndHasChildren(dataId: string): boolean {
        const node: TreeNode<DATA> = this.root.getNodeByDataIdFromCurrent(dataId);

        return !!node ? node.isExpandable() && node.hasChildren() : false;
    }

    protected isToBeExpanded(node: TreeNode<DATA>): boolean {
        return this.expandedNodesDataIds.indexOf(node.getDataId()) > -1;
    }

    getDataFromDomEvent(e: DOMEvent): DATA {
        const cell: Slick.Cell = this.grid.getCellFromEvent(e);

        return !!cell ? this.getDataByRow(cell.row) : null;
    }

    private extractDataFromNodes(nodes: TreeNode<DATA>[]): DATA[] {
        return nodes.map((node: TreeNode<DATA>) => node.getData());
    }

    highlightItemById(dataId: string, expand: boolean = false, silent: boolean = false) {
        const root: TreeNode<DATA> = this.root.getCurrentRoot();
        const node: TreeNode<DATA> = root.findNode(dataId);

        if (node) {
            if (expand) {
                this.recursivelyExpandNode(node);
            }

            this.highlightRowByNode(node, silent);
        } else {
            this.removeHighlighting();
        }
    }
}
