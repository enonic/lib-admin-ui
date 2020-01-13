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
import {Body} from '../../dom/Body';
import {SpanEl} from '../../dom/SpanEl';
import {StringHelper} from '../../util/StringHelper';
import {DefaultErrorHandler} from '../../DefaultErrorHandler';
import {TreeNode, TreeNodeBuilder} from './TreeNode';
import {SelectionChangeType, TreeRoot} from './TreeRoot';
import {TreeGridBuilder} from './TreeGridBuilder';
import {DataChangedEvent, DataChangedType} from './DataChangedEvent';
import {TreeGridToolbar} from './TreeGridToolbar';
import {TreeGridContextMenu} from './TreeGridContextMenu';
import {TreeGridItemClickedEvent} from './TreeGridItemClickedEvent';
import {ContextMenuShownEvent} from './ContextMenuShownEvent';

export enum SelectionOnClickType {
    HIGHLIGHT,
    SELECT,
    NONE,
}

/*
 * There are several methods that should be overridden:
 * 1. hasChildren(data: DATA)  -- Should be implemented if a grid has a tree structure and supports expand/collapse.
 * 2. fetch(data?: DATA) -- Should fetch full data with a valid hasChildren() value;
 * 3. fetchChildren(parentData?: DATA) -- Should fetch children of a parent data;
 * 4. fetchRoot() -- Fetches root nodes. by default return fetchChildren() with an empty parameter.
 */
export class TreeGrid<DATA>
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
    private expandAll: boolean;
    private expandFn: (item: DATA) => boolean;
    private active: boolean;
    private loadedListeners: Function[] = [];
    private contextMenuListeners: Function[] = [];
    private selectionChangeListeners: Function[] = [];
    private highlightingChangeListeners: Function[] = [];
    private dataChangeListeners: { (event: DataChangedEvent<DATA>): void }[] = [];
    private activeChangedListeners: { (active: boolean): void }[] = [];
    private loadBufferSize: number;
    private scrollable: Element;

    private quietErrorHandling: boolean;

    private errorPanel: ValidationRecordingViewer;

    private highlightedNode: TreeNode<DATA>;

    private selectionOnClick: SelectionOnClickType = SelectionOnClickType.HIGHLIGHT;

    private interval: number;

    private idPropertyName: string;

    private keyBindings: KeyBinding[] = [];

    private expandedNodesDataIds: string[] = [];

    private onAwithModKeyPress = (event: ExtendedKeyboardEvent) => {
        let selected = this.grid.getSelectedRows();
        if (selected.length === this.gridData.getLength()) {
            this.deselectAll();
        } else {
            this.selectAll();
        }

        event.preventDefault();
        event.stopImmediatePropagation();
    }

    constructor(builder: TreeGridBuilder<DATA>) {

        super(builder.getClasses());

        this.expandAll = builder.isExpandAll();
        this.expandFn = builder.getExpandFn();
        this.quietErrorHandling = builder.getQuietErrorHandling();

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

        this.initEventListeners(builder);
        this.initKeyBindings(builder);
    }

    public hasHighlightedNode(): boolean {
        return this.highlightedNode != null;
    }

    public getFirstSelectedOrHighlightedNode(): TreeNode<DATA> {
        return this.highlightedNode ? this.highlightedNode : this.getRoot().getFullSelection()[0];
    }

    public setContextMenu(contextMenu: TreeGridContextMenu) {
        this.contextMenu = contextMenu;
        this.grid.subscribeOnContextMenu((event) => {
            event.preventDefault();
            this.setActive(false);
            this.contextMenu.hide();

            let cell = this.grid.getCellFromEvent(event);

            if (!this.grid.isRowSelected(cell.row)) {
                if (!this.highlightedNode || this.getRowIndexByNode(this.highlightedNode) !== cell.row) {
                    this.highlightRowByNode(this.gridData.getItem(cell.row), true,
                        () => this.showContextMenuAt(event.pageX, event.pageY));
                    return;
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

    onHighlightingChanged(listener: (node: TreeNode<DATA>, force: boolean, callback: Function) => void) {
        this.highlightingChangeListeners.push(listener);
        return this;
    }

    public getRowByNode(node: TreeNode<DATA>): JQuery {
        let rowIndex = this.getRowIndexByNode(node);
        let cell = this.grid.getCellNode(rowIndex, 0);

        return $(cell).closest('.slick-row');
    }

    unHighlightingChanged(listener: (node: TreeNode<DATA>, force: boolean, callback: Function) => void) {
        this.highlightingChangeListeners = this.highlightingChangeListeners.filter((curr) => {
            return curr !== listener;
        });
        return this;
    }

    removeHighlighting(skipEvent: boolean = false) {
        if (!this.highlightedNode) {
            return;
        }

        this.highlightedNode = null;

        this.grid.removeCellCssStyles('highlight');

        if (!skipEvent) {
            this.notifyHighlightingChanged();
        }
    }

    public isInRenderingView(): boolean {
        // TreeGrid in visible tab or TreeGrid is active
        return this.isVisible() && this.isActive();
    }

    isEmptyNode(_node: TreeNode<DATA>): boolean {
        return false;
    }

    getEmptyNodesCount(): number {

        let viewportRange = this.grid.getViewport();
        let lastIndex = this.gridData.getItems().length - 1;
        // first and last rows, that are visible in grid
        let firstVisible = viewportRange.top;
        // interval borders to search for the empty node
        let from = firstVisible;
        let emptyNodesCount = 0;

        for (let i = from; i <= lastIndex; i++) {
            if (!!this.gridData.getItem(i) && this.gridData.getItem(i).getDataId() === '') {
                emptyNodesCount++;
            }
        }

        return emptyNodesCount;

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

    getRoot(): TreeRoot<DATA> {
        return this.root;
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

    queryScrollable(): Element {
        let gridClasses = (' ' + this.grid.getEl().getClass()).replace(/\s/g, '.');
        let viewport = Element.fromString('.tree-grid ' + gridClasses + ' .slick-viewport', false);
        return viewport;
    }

    /**
     * Used to determine if a data have child nodes.
     * Must be overridden for the grids with a tree structure.
     */
    hasChildren(_data: DATA): boolean {
        return false;
    }

    /**
     * Used to get the data identifier or key.
     * Must be overridden.
     */
    getDataId(_data: DATA): string {
        throw new Error('Must be implemented by inheritors');
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
    fetch(_node: TreeNode<DATA>, _dataId?: string): Q.Promise<DATA> {
        let deferred = Q.defer<DATA>();
        // Empty logic
        deferred.resolve(null);
        return deferred.promise;
    }

    /**
     * Used as a default children fetcher.
     * Must be overridden to use predefined root nodes.
     */
    fetchChildren(_parentNode?: TreeNode<DATA>): Q.Promise<DATA[]> {
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
    fetchRoot(): Q.Promise<DATA[]> {
        return this.fetchChildren();
    }

    fetchDataAndSetNodes(parentNode: TreeNode<DATA>): Q.Promise<TreeNode<DATA>[]> {
        let deferred = Q.defer<TreeNode<DATA>[]>();

        if (parentNode.hasChildren()) {
            deferred.resolve(parentNode.getChildren());
        } else {
            this.fetchData(parentNode).then((dataList: DATA[]) => {
                parentNode.setChildren(this.dataToTreeNodes(dataList, parentNode));
                this.initData(this.root.getCurrentRoot().treeToList());

                deferred.resolve(parentNode.getChildren());
            });
        }

        return deferred.promise;
    }

    dataToTreeNode(data: DATA, parent: TreeNode<DATA>, expandAllowed: boolean = true): TreeNode<DATA> {
        return new TreeNodeBuilder<DATA>().setData(data, this.getDataId(data))
            .setExpanded(expandAllowed && (this.expandAll || this.expandFn && this.expandFn(data)))
            .setParent(parent).build();
    }

    dataToTreeNodes(dataArray: DATA[], parent: TreeNode<DATA>, expandAllowed: boolean = true): TreeNode<DATA>[] {
        const nodes: TreeNode<DATA>[] = [];
        dataArray.forEach((data) => {
            nodes.push(this.dataToTreeNode(data, parent, expandAllowed));
        });
        return nodes;
    }

    filter(dataList: DATA[]) {
        this.setActive(false);
        this.root.setFiltered(true);
        this.root.getCurrentRoot().setChildren(this.dataToTreeNodes(dataList, this.root.getCurrentRoot()));
        this.initData(this.root.getCurrentRoot().treeToList());
        this.invalidate();
        this.setActive(true);
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
        let root = this.root.getCurrentRoot();
        let node = root.findNode(dataId);

        if (node) {
            this.removeHighlighting(true);

            if (expand) {
                this.recursivelyExpandNode(node);
            }
            let row = this.getRowIndexByNode(node);
            this.grid.selectRow(row);
        }
    }

    refreshNodeById(dataId: string) {
        let root = this.root.getCurrentRoot();
        let node = root.findNode(dataId);

        if (node) {
            this.refreshNode(node);
        }
    }

    selectAll() {
        this.removeHighlighting(true);
        let rows = [];
        for (let i = 0; i < this.gridData.getLength(); i++) {
            if (!StringHelper.isEmpty(this.gridData.getItem(i).getDataId())) {
                rows.push(i);
            }
        }
        this.grid.setSelectedRows(rows);
    }

    deselectAll() {
        this.removeHighlighting(true);
        this.grid.clearSelection();
    }

    deselectNodes(dataIds: string[]) {
        let oldSelected = this.root.getFullSelection();
        let newSelected = [];
        let newSelectedRows = [];

        for (let i = 0; i < oldSelected.length; i++) {
            if (dataIds.indexOf(oldSelected[i].getDataId()) < 0) {
                newSelected.push(oldSelected[i]);
                newSelectedRows.push(this.getRowIndexByNode(oldSelected[i]));
            }
        }

        this.root.removeSelections(dataIds);

        if (oldSelected.length !== newSelected.length) {
            this.grid.setSelectedRows(newSelectedRows);
        }
    }

    getSelectedNodes(): TreeNode<DATA>[] {
        return this.grid.getSelectedRowItems();
    }

    getSelectedDataList(): DATA[] {
        let selectedItems = this.root.getFullSelection();

        if (!!this.highlightedNode && selectedItems.length <= 1) {
            return [this.highlightedNode.getData()];
        }

        return selectedItems.map((node: TreeNode<DATA>) => {
            return node.getData();
        });
    }

    setSelectionOnClick(type: SelectionOnClickType): void {
        this.selectionOnClick = type;
    }

    reload(parentNodeData?: DATA, _idPropertyName?: string, rememberExpanded: boolean = true): Q.Promise<void> {
        const expandedNodesDataId = rememberExpanded ? this.grid.getDataView().getItems()
            .filter(item => item.isExpanded()).map(item => item.getDataId()) : [];

        const selection = this.root.getCurrentSelection();
        const highlightedNode = this.highlightedNode;

        this.root.resetCurrentRoot(parentNodeData);
        this.initData([]);

        this.highlightedNode = null;

        this.mask();

        return this.reloadNode(null, expandedNodesDataId)
            .then(() => {
                this.root.setCurrentSelection(selection);
                const root = this.root.getCurrentRoot();
                this.initData(root.treeToList());
                this.updateExpanded();
                if (highlightedNode) {
                    const dataId = highlightedNode.getDataId();
                    const updatedHighlightedNode = root.findNode(dataId);
                    if (updatedHighlightedNode) {
                        this.highlightRowByNode(updatedHighlightedNode);
                    } else {
                        return this.fetch(highlightedNode).then(data => {
                            highlightedNode.setDataId(this.getDataId(data));
                            highlightedNode.setData(data);
                            this.highlightRowByNode(highlightedNode);
                        });
                    }
                }
                return Q(null);
            }).catch((reason: any) => {
                this.initData([]);
                this.handleError(reason);
            }).then(() => {
                this.updateExpanded();
            }).then(() => this.notifyLoaded());
    }

    refreshNode(node?: TreeNode<DATA>): void {
        let root = this.root.getCurrentRoot();
        this.setActive(false);

        node = node || root;
        node.regenerateIds();
        root.setExpanded(true);
        this.initData(root.treeToList());

        this.invalidate();

        this.setActive(true);

        this.notifyLoaded();
    }

    // Soft reset, that saves node status
    refresh(): void {
        let root = this.root.getCurrentRoot();

        this.setActive(false);

        this.grid.invalidate();

        root.setExpanded(true);
        this.initData(root.treeToList());
        this.invalidate();

        this.setActive(true);

        this.notifyLoaded();
    }

    updateNode(data: DATA, oldDataId?: string): Q.Promise<void> {

        let dataId = oldDataId || this.getDataId(data);
        let nodeToUpdate = this.root.getCurrentRoot().findNode(dataId);

        if (!nodeToUpdate) {
            throw new Error('TreeNode to update not found: ' + dataId);
        }

        return this.fetchAndUpdateNodes([nodeToUpdate], oldDataId ? this.getDataId(data) : undefined);
    }

    updateNodes(data: DATA, oldDataId?: string): Q.Promise<void> {

        let dataId = oldDataId || this.getDataId(data);
        let nodesToUpdate = this.root.getCurrentRoot().findNodes(dataId);

        if (!nodesToUpdate) {
            throw new Error('TreeNode to update not found: ' + dataId);
        }

        return this.fetchAndUpdateNodes(nodesToUpdate, oldDataId ? this.getDataId(data) : undefined);
    }

    deleteNode(data: DATA): void {
        if (this.highlightedNode && this.highlightedNode.getDataId() === this.getDataId(data)) {
            this.removeHighlighting();
        }
        this.deleteRootNode(this.root.getDefaultRoot(), data);
        if (this.root.isFiltered()) {
            this.deleteRootNode(this.root.getFilteredRoot(), data);
        }
    }

    /**
     * @param data
     * @param nextToSelection - by default node is appended as child to selection or root, set this to true to append to the same level
     * @param stashedParentNode
     */
    appendNode(data: DATA, nextToSelection: boolean = false, prepend: boolean = true,
               stashedParentNode?: TreeNode<DATA>): Q.Promise<void> {
        let parentNode = this.getParentNode(nextToSelection, stashedParentNode);
        let index = prepend ? 0 : Math.max(0, parentNode.getChildren().length - 1);
        return this.insertNode(data, nextToSelection, index, stashedParentNode);
    }

    appendNodeToParent(parentNode: TreeNode<DATA>, data: DATA) {
        let index = Math.max(0, parentNode.getChildren().length - 1);
        let root = this.root.getCurrentRoot();

        this.doInsertNodeToParentWithChildren(parentNode, data, root, index);
    }

    getParentNode(nextToSelection: boolean = false, stashedParentNode?: TreeNode<DATA>) {
        let root = stashedParentNode || this.root.getCurrentRoot();
        let parentNode: TreeNode<DATA>;

        parentNode = this.getFirstSelectedOrHighlightedNode();

        if (parentNode) {
            if (nextToSelection) {
                parentNode = parentNode.getParent() || this.root.getCurrentRoot();
            }
        } else {
            parentNode = root;
        }
        return parentNode;
    }

    insertNode(data: DATA, nextToSelection: boolean = false, index: number = 0,
               stashedParentNode?: TreeNode<DATA>): Q.Promise<void> {
        let deferred = Q.defer<void>();
        let root = stashedParentNode || this.root.getCurrentRoot();
        let parentNode = this.getParentNode(nextToSelection, stashedParentNode);

        if (!parentNode.hasChildren() && (parentNode !== root)) {
            this.fetchData(parentNode)
                .then((dataList: DATA[]) => {
                    if (parentNode.hasChildren()) {
                        this.doInsertNodeToParentWithChildren(parentNode, data, root, index, stashedParentNode);

                    } else {
                        parentNode.setChildren(this.dataToTreeNodes(dataList, parentNode));
                        this.initData(root.treeToList());
                        let node = root.findNode(this.getDataId(data));
                        if (!node) {
                            parentNode.insertChild(this.dataToTreeNode(data, root), index);
                            node = root.findNode(this.getDataId(data));
                        }

                        if (node) {
                            if (!stashedParentNode) {
                                this.gridData.setItems(root.treeToList(), this.idPropertyName);
                            }
                            this.notifyDataChanged(new DataChangedEvent<DATA>([node], DataChangedType.ADDED));

                            if (parentNode !== root) {
                                this.refreshNodeData(parentNode).then((refreshedNode: TreeNode<DATA>) => {
                                    if (!stashedParentNode) {
                                        this.updateSelectedNode(refreshedNode);
                                    }
                                });
                            }
                        }
                    }
                    deferred.resolve(null);
                }).catch((reason: any) => {
                this.handleError(reason);
                deferred.reject(reason);
            });
        } else {
            this.doInsertNodeToParentWithChildren(parentNode, data, root, index, stashedParentNode);
            deferred.resolve(null);
        }

        return deferred.promise;
    }

    deleteNodes(dataList: DATA[]): void {
        this.deleteRootNodes(this.root.getDefaultRoot(), dataList);
        if (this.root.isFiltered()) {
            this.deleteRootNodes(this.root.getFilteredRoot(), dataList);
        }
    }

    initData(nodes: TreeNode<DATA>[]) {
        this.gridData.setItems(nodes, this.idPropertyName);
        this.notifyDataChanged(new DataChangedEvent<DATA>(nodes, DataChangedType.ADDED));
        this.resetCurrentSelection(nodes);
        this.resetHighlightedNode(nodes);
    }

    expandNode(node?: TreeNode<DATA>, expandAll: boolean = false): Q.Promise<boolean> {
        let deferred = Q.defer<boolean>();

        node = node || this.root.getCurrentRoot();

        if (node) {
            return this.doExpandNode(node, expandAll);
        }

        return Q(false);
    }

    private doExpandNode(node: TreeNode<DATA>, expandAll: boolean = false): Q.Promise<boolean> {
        node.setExpanded(true);

        if (this.expandedNodesDataIds.indexOf(node.getDataId()) < 0) {
            this.expandedNodesDataIds.push(node.getDataId());
        }

        return this.fetchExpandedNodeChildren(node)
            .then(() => {
                this.initData(this.root.getCurrentRoot().treeToList());
                this.updateExpanded();
                this.expandNodeChildren(node, expandAll);

                return true;
            }).catch((reason: any) => {
                this.handleError(reason);
                return false;
            });
    }

    private fetchExpandedNodeChildren(node: TreeNode<DATA>, expandAll: boolean = false): Q.Promise<void> {
        if (node.hasChildren()) {
            return Q(null);
        }

        this.mask();

        return this.fetchData(node)
            .then((dataList: DATA[]) => {
                node.setChildren(this.dataToTreeNodes(dataList, node, expandAll));
            })
            .finally(this.unmask.bind(this));
    }

    private expandNodeChildren(node: TreeNode<DATA>, expandAll: boolean) {
        node.getChildren().forEach((child: TreeNode<DATA>) => {
            if (expandAll || this.expandedNodesDataIds.indexOf(child.getDataId()) > -1) {
                this.expandNode(child);
            }
        });
    }

    isAllSelected(): boolean {
        if (this.grid.isAllSelected()) {
            return true;
        }

        let selectedNodes = this.grid.getSelectedRows();

        if (!selectedNodes) {
            return false;
        }

        let nonEmptyNodes = this.gridData.getItems().filter((data: TreeNode<DATA>) => {
            return (!!data && data.getDataId() !== '');
        });

        return nonEmptyNodes.length === selectedNodes.length;
    }

    isAnySelected(): boolean {
        return this.grid.isAnySelected();
    }

    collapseNode(node: TreeNode<DATA>, collapseAll: boolean = false) {
        node.setExpanded(false);

        this.expandedNodesDataIds.splice(this.expandedNodesDataIds.indexOf(node.getDataId()), 1);

        if (collapseAll) {
            node.treeToList(false, false).forEach((n: TreeNode<DATA>) => {
                n.setExpanded(false);
                this.expandedNodesDataIds.splice(this.expandedNodesDataIds.indexOf(n.getDataId()), 1);
            });
        }

        // Save the selected collapsed rows in cache
        this.root.stashSelection();

        this.gridData.refresh();
        this.triggerSelectionChangedListeners();
        this.invalidate();
        this.setActive(true);
    }

    toggleNode(node: TreeNode<DATA>, all: boolean = false) {
        if (node.isExpanded()) {
            this.collapseNode(node, all);
        } else {
            this.expandNode(node, all);
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

    getItem(rowIndex: number): TreeNode<DATA> {
        return this.gridData.getItem(rowIndex);
    }

    triggerSelectionChangedListeners() {
        this.selectionChangeListeners.forEach((listener: Function) => {
            listener(this.root.getCurrentSelection(), this.root.getFullSelection(), !!this.highlightedNode);
        });
    }

    onSelectionChanged(listener: (currentSelection: TreeNode<DATA>[], fullSelection: TreeNode<DATA>[], highlighted: boolean) => void) {
        this.selectionChangeListeners.push(listener);
        return this;
    }

    unSelectionChanged(listener: (currentSelection: TreeNode<DATA>[], fullSelection: TreeNode<DATA>[], highlighted: boolean) => void) {
        this.selectionChangeListeners = this.selectionChangeListeners.filter((curr) => {
            return curr !== listener;
        });
        return this;
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

    notifyDataChanged(event: DataChangedEvent<DATA>) {
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

        this.highlightCurrentNode();
    }

    invalidateNodes(nodes: TreeNode<DATA>[]) {
        if (!nodes.length) {
            return;
        }
        this.grid.invalidateRows(nodes.map(node => this.getRowIndexByNode(node)));
        this.grid.renderGrid();

        this.highlightCurrentNode();
    }

    initAndRender() {
        this.initData(this.getRoot().getCurrentRoot().treeToList());
        this.invalidate();
    }

    refreshNodeData(_parentNode: TreeNode<DATA>): Q.Promise<TreeNode<DATA>> {
        return null;
    }

    sortNodeChildren(_node: TreeNode<DATA>): void {
        // must be implemented by children
    }

    isNodeHighlighted(node: TreeNode<DATA>) {
        // grid could've been refreshed resulting in new nodeIds, so compare dataIds
        return node !== null && this.highlightedNode !== null && node.getDataId() === this.highlightedNode.getDataId();
    }

    protected createToolbar(): TreeGridToolbar {
        return new TreeGridToolbar(this);
    }

    protected setColumns(columns: GridColumn<TreeNode<DATA>>[], toBegin: boolean = false) {
        this.getGrid().setColumns(columns, toBegin);
        this.highlightCurrentNode();
    }

    protected isClickOutsideGridViewport(clickedEl: HTMLElement) {
        const element = Element.fromHtmlElement(clickedEl);

        return (element.hasClass('grid-canvas tree-grid-toolbar browse-toolbar appbar'));
    }

    protected editItem(_node: TreeNode<DATA>) {
        return;
    }

    protected highlightCurrentNode() {
        if (!this.highlightedNode) {
            return;
        }

        this.highlightRowByNode(this.highlightedNode);
        this.notifyHighlightingChanged();
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

    protected updateExpanded() {
        this.invalidate();
        this.setActive(true);
    }

    protected updateSelectedNode(node: TreeNode<DATA>) {
        this.getGrid().clearSelection();
        this.refreshNode(node);
        let row = this.getRowIndexByNode(node);
        this.grid.selectRow(row);
    }

    protected getErrorPanel(): ValidationRecordingViewer {
        return this.errorPanel;
    }

    protected handleItemMetadata(row: number) {
        const node = this.gridData.getItem(row);
        if (this.isEmptyNode(node)) {
            return {cssClasses: 'empty-node'};
        }

        return null;
    }

    private initSelectorPlugin() {
        let selectorPlugin = this.grid.getCheckboxSelectorPlugin();
        if (selectorPlugin) {
            this.grid.unregisterPlugin(<Slick.Plugin<TreeNode<DATA>>>this.grid.getCheckboxSelectorPlugin());
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

    private initKeyBindings(builder: TreeGridBuilder<DATA>) {
        this.grid.resizeCanvas();
        if (builder.isHotkeysEnabled()) {

            if (!this.gridOptions.isMultipleSelectionDisabled()) {
                this.keyBindings = [
                    new KeyBinding('shift+up', (event: ExtendedKeyboardEvent) => {
                        this.onSelectRange(event, this.grid.addSelectedUp.bind(this.grid));
                    }),
                    new KeyBinding('shift+down', (event: ExtendedKeyboardEvent) => {
                        this.onSelectRange(event, this.grid.addSelectedDown.bind(this.grid));
                    })
                ];
            }

            this.keyBindings = this.keyBindings.concat([
                new KeyBinding('up', this.onUpKeyPress.bind(this)),
                new KeyBinding('down', this.onDownKeyPress.bind(this)),
                new KeyBinding('left', this.onLeftKeyPress.bind(this)),
                new KeyBinding('right', this.onRightKeyPress.bind(this)),
                new KeyBinding('mod+a', this.onAwithModKeyPress.bind(this)),
                new KeyBinding('space', this.onSpaceKeyPress.bind(this)),
                new KeyBinding('enter', this.onEnterKeyPress.bind(this))
            ]);
        }
    }

    private onSelectRange(event: ExtendedKeyboardEvent, navigateFn: Function) {
        if (this.isActive()) {
            let row;
            if (this.highlightedNode) {
                this.recursivelyExpandHighlightedNode();
                row = this.getRowIndexByNode(this.highlightedNode);
                if (!this.grid.isRowSelected(row)) {
                    this.grid.selectRow(row);
                }
            } else if (this.grid.getSelectedRows().length === 1) {
                row = this.grid.getSelectedRows()[0];
            }
            this.scrollToRow(navigateFn(row));
        }
        event.preventDefault();
        event.stopImmediatePropagation();
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
        });

        this.onRendered(() => {
            this.grid.resizeCanvas();
        });

        let keysBound: boolean = false;
        this.grid.onShown(() => {
            if (!keysBound) {
                keysBound = true;
                this.bindKeys(builder);
            }
            this.enablePostLoad(builder);
        });

        this.grid.onHidden(() => {
            if (keysBound) {
                keysBound = false;
                this.unbindKeys(builder);
            }
            this.disablePostLoad(builder);
        });

        this.grid.subscribeOnSelectedRowsChanged((_event, rows) => {
            this.notifySelectionChanged(rows.rows);
        });

        this.onLoaded(() => this.unmask());

        const updateColumns = builder.getColumnUpdater() || function () { /* empty */
        };
        const updateColumnsHandler = (force?: boolean) => {
            if (force) {
                updateColumns();
                this.getGrid().syncGridSelection(true);
            } else {
                this.getGrid().resizeCanvas();
                this.highlightCurrentNode();
            }
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

        Body.get().onClicked((event: MouseEvent) => this.unhighlightRowOnMouseClick(event));
    }

    private unhighlightRowOnMouseClick(e: Event): void {
        if (!!this.highlightedNode && this.isClickOutsideGridViewport(<HTMLElement>e.target)) {
            this.removeHighlighting();
        }
    }

    private enablePostLoad(builder: TreeGridBuilder<DATA>) {
        if (builder.isPartialLoadEnabled() && !this.interval) {
            this.interval = setInterval(this.postLoad.bind(this), 200);
        }
    }

    private disablePostLoad(builder: TreeGridBuilder<DATA>) {
        if (builder.isPartialLoadEnabled() && this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    private bindKeys(_builder: TreeGridBuilder<DATA>) {
        if (this.keyBindings.length > 0) {
            KeyBindings.get().shelveBindings(this.keyBindings);
            KeyBindings.get().bindKeys(this.keyBindings);
        }
    }

    private unbindKeys(builder: TreeGridBuilder<DATA>) {
        if (this.keyBindings.length > 0 &&
            this.keyBindings.every((keyBinding) => KeyBindings.get().isActive(keyBinding))) {
            if (builder.isHotkeysEnabled()) {
                KeyBindings.get().unbindKeys(this.keyBindings);
                KeyBindings.get().unshelveBindings(this.keyBindings);
            }
        }
    }

    private bindClickEvents(toggleClickEnabled: boolean) {
        let clickHandler = ((event, data) => {
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
                    this.onExpand(elem, data);
                    return;
                }

                if (elem.hasClass('collapse')) {
                    this.onCollapse(elem, data);
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

            if (!elem.hasClass('sort-dialog-trigger')) {
                new TreeGridItemClickedEvent(this.getItem(data.row), !!this.getFirstSelectedOrHighlightedNode()).fire();
            }
        });

        this.grid.subscribeOnClick(clickHandler);
    }

    private onClickWithShift(event: any, data: Slick.OnClickEventArgs<DATA>) {
        const node = this.gridData.getItem(data.row);
        const thereIsHighlightedNode = !!this.highlightedNode && !this.isNodeHighlighted(node) && this.highlightedNode.isVisible();
        const isMultiSelect = !this.gridOptions.isMultipleSelectionDisabled();

        if (!this.grid.isRowSelected(data.row) && (this.grid.getSelectedRows().length >= 1 || thereIsHighlightedNode)) {
            if (isMultiSelect) {
                let firstSelectedRow;
                let highlightFrom;
                let highlightTo;

                if (thereIsHighlightedNode) {
                    const highlightedRow = this.getRowIndexByNode(this.highlightedNode);
                    highlightFrom = highlightedRow < data.row ? highlightedRow : data.row;
                    highlightTo = data.row > highlightedRow ? data.row : highlightedRow;
                } else {
                    firstSelectedRow = this.grid.getSelectedRows()[0];
                    highlightFrom = firstSelectedRow < data.row ? firstSelectedRow : data.row;
                    highlightTo = data.row > firstSelectedRow ? data.row : firstSelectedRow;
                }

                this.removeHighlighting();

                for (let i = highlightFrom; i <= highlightTo; i++) {
                    if (!this.grid.isRowSelected(i)) {
                        this.grid.toggleRow(i);
                    }
                }
                event.stopPropagation();
                event.preventDefault();
                return;
            } else {
                this.deselectAll();
            }
        }
        this.grid.toggleRow(data.row);
    }

    private onClickWithCmd(data: Slick.OnClickEventArgs<DATA>) {
        const node = this.gridData.getItem(data.row);
        if (!this.grid.isRowSelected(data.row) && this.highlightedNode !== node) {
            this.removeHighlighting(true);
        }
        this.grid.toggleRow(data.row);
    }

    private onExpand(elem: ElementHelper, data: Slick.OnClickEventArgs<DATA>) {
        const node = this.gridData.getItem(data.row);
        elem.removeClass('expand').addClass('collapse');
        this.expandNode(node).then(() => {
            this.highlightCurrentNode();
        });
    }

    private recursivelyExpandHighlightedNode() {
        this.recursivelyExpandNode(this.highlightedNode);
    }

    private recursivelyExpandNode(node: TreeNode<DATA>) {
        if (!node || node.isVisible()) {
            return;
        }
        let parent: TreeNode<DATA> = node.getParent();
        while (!node.isVisible()) {
            this.expandNode(parent);
            parent = parent.getParent();
        }

    }

    private onCollapse(elem: ElementHelper, data: Slick.OnClickEventArgs<DATA>) {
        const node = this.gridData.getItem(data.row);
        elem.removeClass('collapse').addClass('expand');
        this.collapseNode(node);
    }

    private onRowSelected(data: Slick.OnClickEventArgs<DATA>) {
        const node = this.gridData.getItem(data.row);

        if (this.gridOptions.isMultipleSelectionDisabled()) {
            this.root.clearStashedSelection();
            this.grid.selectRow(data.row);
            return;
        }

        if (this.grid.getSelectedRows().length > 1) {
            this.removeHighlighting(true);
        } else if (!this.grid.isRowSelected(data.row) && this.highlightedNode !== node) {
            this.removeHighlighting(true);
        }

        this.grid.toggleRow(data.row);
    }

    private isSelectionNotEmpty() {
        return this.grid.getSelectedRows().length > 0 || this.root.getStashedSelection().length > 0;
    }

    private onUpKeyPress() {
        if (this.isActive()) {
            this.recursivelyExpandHighlightedNode();

            if (this.contextMenu) {
                this.contextMenu.hide();
            }
            if (this.gridOptions.isMultipleSelectionDisabled()) {
                this.scrollToRow(this.grid.moveSelectedUp());
            } else {
                this.navigateUp();
            }
        }
    }

    private onDownKeyPress() {
        if (this.isActive()) {
            this.recursivelyExpandHighlightedNode();

            if (this.contextMenu) {
                this.contextMenu.hide();
            }
            if (this.gridOptions.isMultipleSelectionDisabled()) {
                this.scrollToRow(this.grid.moveSelectedDown());
            } else {
                this.navigateDown();
            }
        }
    }

    private onLeftKeyPress() {
        let selected = this.grid.getSelectedRows();
        if (selected.length !== 1 && !this.highlightedNode) {
            return;
        }

        this.recursivelyExpandHighlightedNode();
        if (this.contextMenu) {
            this.contextMenu.hide();
        }
        let node = this.gridData.getItem(selected[0]) || this.highlightedNode;
        if (node && this.isActive()) {
            if (node.isExpanded()) {
                this.setActive(false);
                this.collapseNode(node);
                if (!selected[0]) {
                    this.highlightRowByNode(node);
                }
            } else if (node.getParent() !== this.root.getCurrentRoot()) {
                node = node.getParent();
                this.setActive(false);
                let row = this.getRowIndexByNode(node);
                this.collapseNode(node);
                if (selected[0]) {
                    this.unselectAllRows();
                    this.grid.selectRow(row, true);
                } else {
                    this.highlightRowByNode(node);
                }
            }
        }
    }

    private onRightKeyPress() {
        let selected = this.grid.getSelectedRows();
        if (selected.length !== 1 && !this.highlightedNode) {
            return;
        }

        this.recursivelyExpandHighlightedNode();
        if (this.contextMenu) {
            this.contextMenu.hide();
        }
        let node = this.gridData.getItem(selected[0]) || this.highlightedNode;
        if (node && this.hasChildren(node.getData())
            && !node.isExpanded() && this.isActive()) {

            this.setActive(false);
            this.invalidate();
            this.expandNode(node).then(() => {
                if (!selected[0]) {
                    this.highlightCurrentNode();
                }
            });
        }
    }

    private onSpaceKeyPress() {
        if (this.highlightedNode) {
            this.recursivelyExpandHighlightedNode();
            let row = this.getRowIndexByNode(this.highlightedNode);
            this.grid.toggleRow(row);
        } else if (this.grid.getSelectedRows().length > 0) {
            this.deselectAll();
        }
    }

    private onEnterKeyPress() {
        if (this.highlightedNode) {
            this.editItem(this.highlightedNode);
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
                this.grid.selectRow(data.row);
            }
            return;
        }

        // Clear selection and highlighting if something was selected or highlighted from before
        if (this.isSelectionNotEmpty() || isRowHighlighted) {
            this.clearAllSelection();
        }

        if (!isRowHighlighted) {
            this.highlightRowByNode(node);
        }
    }

    private navigateUp() {
        let selectedCount = this.grid.getSelectedRows().length;
        if (!this.highlightedNode && selectedCount === 0) {
            return;
        }

        let selectedIndex = this.highlightedNode
                            ? this.getRowIndexByNode(this.highlightedNode)
                            : this.grid.getSelectedRows()[selectedCount - 1];

        if (selectedIndex > 0) {
            this.unselectAllRows();
            selectedIndex--;
            this.highlightRowByNode(this.gridData.getItem(selectedIndex));
            this.scrollToRow(selectedIndex, true);
        }
    }

    private navigateDown() {
        let selectedIndex = this.highlightedNode ? this.getRowIndexByNode(this.highlightedNode) : -1;
        if (this.grid.getSelectedRows().length > 0) {
            selectedIndex = this.grid.getSelectedRows()[0];
        }

        if (this.gridData.getLength() > 0 && selectedIndex < this.gridData.getLength() - 1) {
            this.unselectAllRows();
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

    private unselectAllRows(unhighlight: boolean = true) {

        if (unhighlight) {
            this.removeHighlighting();
        }
        if (this.grid.getSelectedRows().length > 0) {
            this.grid.clearSelection();
        }
    }

    private updateColumnsFormatter(columns: GridColumn<TreeNode<DATA>>[]) {
        if (columns.length > 0) {
            let formatter = columns[0].getFormatter();
            let toggleFormatter = (row: number, cell: number, value: any, columnDef: any, node: TreeNode<DATA>) => {
                let toggleSpan = new SpanEl('toggle icon');
                if (this.hasChildren(node.getData())) {
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
        if (!this.getDataId(node.getData())) {
            this.fetchChildren(node.getParent()).then((dataList: DATA[]) => {
                const oldChildren: TreeNode<DATA>[] = node.getParent().getChildren();
                // Ensure to remove empty node from the end if present
                if (oldChildren.length > 0 && oldChildren[oldChildren.length - 1].getDataId() === '') {
                    oldChildren.pop();
                }
                const fetchedChildren: TreeNode<DATA>[] = this.dataToTreeNodes(dataList, node.getParent());
                const needToCheckFetchedChildren: boolean = this.areAllOldChildrenSelected(oldChildren);
                const childrenToAdd: TreeNode<DATA>[] = fetchedChildren.slice(oldChildren.length);
                childrenToAdd
                    .filter((child: TreeNode<DATA>) => this.expandedNodesDataIds.indexOf(child.getDataId()) > -1)
                    .forEach((child: TreeNode<DATA>) => {
                        child.setExpanded(true);
                        this.expandNode(child);
                    });
                const newChildren: TreeNode<DATA>[] = oldChildren.concat(childrenToAdd);
                node.getParent().setChildren(newChildren);
                this.initData(this.root.getCurrentRoot().treeToList());
                if (needToCheckFetchedChildren) {
                    this.select(fetchedChildren);
                } else {
                    this.triggerSelectionChangedListeners();
                }
            }).catch((reason: any) => {
                this.handleError(reason);
            }).then(() => {
                this.notifyLoaded();
                this.loading = false;
            });
        }
    }

    private select(fetchedChildren: TreeNode<DATA>[]) {
        let rowsToSelect: number[] = [];
        fetchedChildren.forEach((node: TreeNode<DATA>) => {
            let row = this.getRowIndexByNode(node);
            if (row) {
                rowsToSelect.push(row);
            }
        });
        this.grid.addSelectedRows(rowsToSelect);
    }

    private areAllOldChildrenSelected(oldChildren: TreeNode<DATA>[]): boolean {
        if (oldChildren && oldChildren.length > 0) {
            return oldChildren.every(node =>
                this.grid.isRowSelected(this.getRowIndexByNode(node))
            );
        } else {
            return false;
        }
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
            if (this.gridData.getItem(i) && this.gridData.getItem(i).isEmptyDataId()) {
                this.loading = true;
                this.loadEmptyNode(this.gridData.getItem(i));
                break;
            }
        }
    }

    private fetchData(parentNode?: TreeNode<DATA>): Q.Promise<DATA[]> {
        return parentNode ? this.fetchChildren(parentNode) : this.fetchRoot();
    }

    private reloadNode(parentNode?: TreeNode<DATA>, expandedNodesDataId?: String[]): Q.Promise<void> {

        let deferred = Q.defer<void>();
        let promises = [];

        this.fetchData(parentNode).then((dataList: DATA[]) => {
            let hasNotEmptyChildren = false;

            parentNode = parentNode || this.root.getCurrentRoot();
            parentNode.getChildren().length = 0;

            dataList.forEach((data: DATA) => {
                let child = this.dataToTreeNode(data, parentNode);
                let dataId = this.getDataId(data);
                child.setExpanded(this.expandAll || this.expandFn && this.expandFn(data) || expandedNodesDataId.indexOf(dataId) > -1);
                parentNode.addChild(child);

                if (child.isExpanded() && this.hasChildren(data)) {
                    hasNotEmptyChildren = true;
                    promises.push(this.reloadNode(child, expandedNodesDataId));
                }
            });

            if (!hasNotEmptyChildren) {
                deferred.resolve(null);
            } else {
                Q.all(promises).spread(() => {
                    deferred.resolve(null);
                }).catch((reason: any) => {
                    deferred.reject(reason);
                }).done();
            }
        }).catch((reason: any) => {
            this.handleError(reason);
            deferred.reject(reason);
        }).done();

        return deferred.promise;
    }

    private fetchAndUpdateNodes(nodesToUpdate: TreeNode<DATA>[], dataId?: string): Q.Promise<void> {
        return this.fetch(nodesToUpdate[0], dataId)
            .then((data: DATA) => {
                const updates = nodesToUpdate.map(node => {
                    if (dataId) {
                        node.setDataId(dataId);
                    }
                    node.setData(data);

                    const reload = () => (this.expandAll || this.expandFn && this.expandFn(data) ? this.expandNode(node) : Q.resolve(true));

                    return reload().then(() => {
                        node.setDataId(this.getDataId(data));
                        node.clearViewers();

                        if (node.isVisible()) {
                            let rowIndex = this.getRowIndexByNode(node);
                            let selected = this.grid.isRowSelected(rowIndex);
                            let highlighted = this.isNodeHighlighted(node);
                            this.gridData.updateItem(node.getId(), node);
                            if (selected) {
                                this.grid.addSelectedRow(rowIndex);
                            } else if (highlighted) {
                                this.removeHighlighting(true);
                                this.highlightRowByNode(node);
                            }
                        }
                    });
                });

                return Q.all(updates).then(() => {
                    this.notifyDataChanged(new DataChangedEvent<DATA>(nodesToUpdate, DataChangedType.UPDATED));

                    return Q(null);
                });
            }).catch(reason => this.handleError(reason));
    }

    private deleteRootNode(root: TreeNode<DATA>, data: DATA): void {
        const dataId = this.getDataId(data);

        AppHelper.whileTruthy(() => root.findNode(dataId), (node: TreeNode<DATA>) => {
            if (node.hasChildren()) {
                node.getChildren().forEach((child: TreeNode<DATA>) => {
                    this.deleteNode(child.getData());
                });
            }
            if (this.gridData.getItemById(node.getId())) {
                this.gridData.deleteItem(node.getId());
            }

            const parent = node.getParent();
            if (node && parent) {
                parent.removeChild(node);
                parent.setMaxChildren(parent.getMaxChildren() - 1);
                this.notifyDataChanged(new DataChangedEvent<DATA>([node], DataChangedType.DELETED));
            }
        });

        this.root.removeSelections([dataId]);
    }

    private doInsertNodeToParentWithChildren(parentNode: TreeNode<DATA>,
                                             data: DATA,
                                             root: TreeNode<DATA>,
                                             index: number,
                                             stashedParentNode?: TreeNode<DATA>) {

        let isRootParentNode: boolean = (parentNode === root);
        parentNode.insertChild(this.dataToTreeNode(data, root), index);

        let node = root.findNode(this.getDataId(data));
        if (node) {
            if (!stashedParentNode) {
                this.gridData.setItems(root.treeToList(), this.idPropertyName);
            }
            if (isRootParentNode) {
                this.sortNodeChildren(parentNode);
            } else {
                if (!stashedParentNode) {
                    this.updateSelectedNode(parentNode);
                }
            }
        }
    }

    private deleteRootNodes(root: TreeNode<DATA>, dataList: DATA[]): void {
        let updated: TreeNode<DATA>[] = [];
        let deleted: TreeNode<DATA>[] = [];

        dataList.forEach((data: DATA) => {
            let node = root.findNode(this.getDataId(data));
            if (node && node.getParent()) {
                let parent = node.getParent();
                this.deleteRootNode(root, node.getData());
                updated.push(parent);
                deleted.push(node);
                updated.filter((el) => {
                    return el.getDataId() !== node.getDataId();
                });
            }
        });
        root.treeToList().forEach((child: TreeNode<DATA>) => {
            this.refreshNodeData(child);
        });
        this.notifyDataChanged(new DataChangedEvent<DATA>(deleted, DataChangedType.DELETED));
    }

    private resetCurrentSelection(nodes: TreeNode<DATA>[]) {
        const selection: number[] = [];
        const selectionIds: string[] = this.root.getFullSelection().map(el => el.getDataId());

        selectionIds.forEach((selectionId) => {
            nodes.forEach((node, index) => {
                if (node.getDataId() === selectionId) {
                    selection.push(index);
                }
            });
        });

        this.grid.setSelectedRows(selection);
    }

    private resetHighlightedNode(nodes: TreeNode<DATA>[]) {
        if (!this.hasHighlightedNode()) {
            return;
        }

        nodes.some((node) => {
            if (node.getDataId() === this.highlightedNode.getDataId()) {
                this.highlightedNode = node;
                return true;
            }

            return false;
        });
    }

    private notifySelectionChanged(rows: number[]): void {
        const newSelection: TreeNode<DATA>[] = [];
        if (rows) {
            rows.forEach((rowIndex) => {
                newSelection.push(this.gridData.getItem(rowIndex));
            });
        }

        const selectionWasRemoved = this.root.getSelectionChangeType() === SelectionChangeType.REMOVED;

        this.root.setCurrentSelection(newSelection);

        if (this.root.isSelectionChanged() || selectionWasRemoved) {
            this.triggerSelectionChangedListeners();
        }
    }

    private showContextMenuAt(x: number, y: number) {
        this.contextMenu.showAt(x, y);
        this.notifyContextMenuShown(x, y);
        this.setActive(true);
    }

    private highlightRowByNode(node: TreeNode<DATA>, immediateNotification: boolean = false, callback?: Function) {
        if (this.selectionOnClick === SelectionOnClickType.SELECT) {
            return;
        }

        const isCurRowHighlighted = this.highlightedNode && this.highlightedNode === node;

        if (this.isSelectionNotEmpty() || isCurRowHighlighted) {
            this.clearAllSelection(false);
        }

        if (!isCurRowHighlighted) {
            this.removeHighlighting();
            this.highlightedNode = node;
            this.notifyHighlightingChanged(immediateNotification, callback);
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

    private clearAllSelection(unhighlight: boolean = true) {
        this.unselectAllRows(unhighlight);
        this.root.clearStashedSelection();
        this.triggerSelectionChangedListeners();
    }

    private notifyHighlightingChanged(force: boolean = false, callback?: Function): void {
        this.highlightingChangeListeners.forEach((listener: Function) => {
            listener(this.highlightedNode, force, callback);
        });
    }

    private notifyContextMenuShown(x: number, y: number) {
        let showContextMenuEvent = new ContextMenuShownEvent(x, y);
        this.contextMenuListeners.forEach((listener) => {
            listener(showContextMenuEvent);
        });
    }

    resetExpandedNodesDataIds() {
        this.expandedNodesDataIds = [];
    }
}
