import {Element} from '../../dom/Element';
import {TreeGrid} from '../treegrid/TreeGrid';
import {TreeNode} from '../treegrid/TreeNode';
import {ElementHelper} from '../../dom/ElementHelper';
import {DataView} from './DataView';

export class GridDragHandler<MODEL> {

    protected contentGrid: TreeGrid<MODEL>;

    private positionChangedListeners: { (): void }[] = [];

    private draggableItem: Element;

    private rowHeight: number;

    constructor(treeGrid: TreeGrid<MODEL>) {
        this.contentGrid = treeGrid;
        this.contentGrid.getGrid().subscribeOnDrag(this.handleDrag.bind(this));
        this.contentGrid.getGrid().subscribeOnDragInit(this.handleDragInit.bind(this));
        this.contentGrid.getGrid().subscribeOnDragEnd(this.handleDragEnd.bind(this));
        this.contentGrid.getGrid().subscribeBeforeMoveRows(this.handleBeforeMoveRows.bind(this));
        this.contentGrid.getGrid().subscribeMoveRows(this.handleMoveRows.bind(this));
    }

    getDraggableItem(): Element {
        return this.draggableItem;
    }

    onPositionChanged(listener: () => void) {
        this.positionChangedListeners.push(listener);
    }

    unPositionChanged(listener: () => void) {
        this.positionChangedListeners = this.positionChangedListeners.filter((currentListener: () => void) => {
            return currentListener !== listener;
        });
    }

    protected handleDragInit(event: DragEvent) {
        event.stopImmediatePropagation();
    }

    protected handleDragStart() {
        let draggableClass: string = this.contentGrid.getOptions().getSelectedCellCssClass() || '';
        draggableClass = (' ' + draggableClass).replace(/\s/g, '.');
        let row: Element = Element.fromString(draggableClass).getParentElement();

        const nodes: TreeNode<MODEL>[] = this.contentGrid.getRoot().getCurrentRoot().treeToList();
        const draggedNode: TreeNode<MODEL> = nodes[row.getSiblingIndex()];
        this.contentGrid.collapseNode(draggedNode);

        row = Element.fromString(draggableClass).getParentElement();

        this.draggableItem = Element.fromString(row.toString());

        this.draggableItem.addClass('draggable');
        row.getEl().setDisplay('none');

        this.rowHeight = row.getEl().getHeight();
        const proxyEl: ElementHelper = Element.fromString('.slick-reorder-proxy').getEl();
        const top: string = proxyEl.getTop();
        this.draggableItem.getEl().setTop(top).setPosition('absolute');
        const gridClasses: string = (' ' + this.contentGrid.getGrid().getEl().getClass()).replace(/\s/g, '.');

        $('.tree-grid ' + gridClasses + ' .slick-viewport').get(0).appendChild(this.draggableItem.getHTMLElement());
    }

    protected handleDragEnd(_event: Event, _data: DragEventData) {
        this.draggableItem.remove();
        this.draggableItem = null;
        this.contentGrid.refresh();
    }

    protected handleBeforeMoveRows(_event: Event, data: DragEventData): boolean {
        if (!this.draggableItem) {
            this.handleDragStart();
        }
        const gridClasses: string = (' ' + this.contentGrid.getGrid().getEl().getClass()).replace(/\s/g, '.');
        const children: Element[] = Element.fromSelector('.tree-grid ' + gridClasses + ' .grid-canvas .slick-row', false);

        if (children && !children[0].getPreviousElement()) {
            children.shift();
        }

        const setMarginTop: Function = (element: Element, margin: string) => element.getEl().setMarginTop(margin);

        children.forEach((child: Element, index: number) => {
            if (data.rows[0] <= data.insertBefore) { //move item down
                if (index > data.rows[0] && index <= data.insertBefore) {
                    setMarginTop(child, `-${this.rowHeight}px`);
                } else {
                    setMarginTop(child, null);
                }
            } else if (data.rows[0] >= data.insertBefore) { //move item up
                if (index < data.rows[0] && index >= data.insertBefore) {
                    setMarginTop(child, `${this.rowHeight}px`);
                } else {
                    setMarginTop(child, null);
                }
            }
        });

        this.contentGrid.scrollToRow(data.insertBefore);
        return true;
    }

    protected handleMoveRows(_event: Event, args: DragEventData) {
        const dataView: DataView<TreeNode<MODEL>> = this.contentGrid.getGrid().getDataView();
        const draggableRow: number = args.rows[0];

        const rowDataId: any = this.getModelId(dataView.getItem(draggableRow).getData());
        const insertTarget: number = args.insertBefore;

        // when dragging forwards/down insertBefore is the target element
        // when dragging backwards/up insertBefore is one position after the target element
        const insertBefore: number = draggableRow < insertTarget ? insertTarget + 1 : insertTarget;

        const moveBeforeRowDataId: number = ((dataView.getLength() - 1) <= insertTarget)
                                            ? null
                                            : this.getModelId(dataView.getItem(insertBefore).getData());

        // draggable count in new data
        const selectedRow: number = this.makeMovementInNodes(draggableRow, insertTarget);

        if (selectedRow <= this.contentGrid.getRoot().getCurrentRoot().treeToList().length - 1) {
            this.contentGrid.getGrid().setSelectedRows([selectedRow]);
        }
        this.handleMovements(rowDataId, moveBeforeRowDataId);

        this.notifyPositionChanged();
    }

    protected makeMovementInNodes(draggableRow: number, insertBefore: number): number {
        const root: TreeNode<MODEL> = this.contentGrid.getRoot().getCurrentRoot();
        const rootChildren: TreeNode<MODEL>[] = root.treeToList();

        const item: TreeNode<MODEL> = rootChildren.slice(draggableRow, draggableRow + 1)[0];
        rootChildren.splice(rootChildren.indexOf(item), 1);
        rootChildren.splice(insertBefore, 0, item);

        this.contentGrid.initData(rootChildren);
        root.setChildren(rootChildren);

        return rootChildren.indexOf(item);

    }

    protected handleMovements(_rowDataId: any, _moveBeforeRowDataId: any) {
        return;
    }

    protected getModelId(_model: MODEL): any {
        throw new Error('Must be implemented by inheritors');
    }

    private handleDrag() {
        if (!this.draggableItem) {
            this.handleDragStart();
        }
        const top: number = Element.fromString('.slick-reorder-proxy').getEl().getTopPx();
        this.draggableItem.getEl().setTopPx(top /*- this.rowHeight*//* / 2*/).setZindex(2);
    }

    private notifyPositionChanged() {
        this.positionChangedListeners.forEach((listener: () => void) => {
            listener.call(this);
        });
    }
}

export interface DragEventData {
    insertBefore: number;
    rows: number[];
}
