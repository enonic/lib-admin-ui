import * as $ from 'jquery';
import {Element} from '../../dom/Element';
import {TreeGrid} from '../treegrid/TreeGrid';
import {TreeNode} from '../treegrid/TreeNode';
import {ElementHelper} from '../../dom/ElementHelper';
import {DataView} from './DataView';
import {Event} from '../../event/Event';
import {IDentifiable} from '../../IDentifiable';
import {AppHelper} from '../../util/AppHelper';

export class GridDragHandler<MODEL extends IDentifiable> {

    protected contentGrid: TreeGrid<MODEL>;

    protected activeItem: MODEL;

    private positionChangedListeners: (() => void)[] = [];

    private draggableItem: Element;

    private rowHeight: number;

    constructor(treeGrid: TreeGrid<MODEL>) {
        this.contentGrid = treeGrid;
        this.contentGrid.getGrid().subscribeOnDrag(this.handleDrag.bind(this));
        this.contentGrid.getGrid().subscribeOnDragInit(this.handleDragInit.bind(this));
        this.contentGrid.getGrid().subscribeOnDragEnd(this.handleDragEnd.bind(this));
        this.contentGrid.getGrid().subscribeBeforeMoveRows(this.handleBeforeMoveRows.bind(this));
        this.contentGrid.getGrid().subscribeMoveRows(this.handleMoveRows.bind(this));

        const mouseOver = AppHelper.debounce((e: any) => {
            this.handleMouseOver(e);
        }, 100);
        this.contentGrid.getGrid().subscribeOnMouseEnter(mouseOver);
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

    protected handleMouseOver(e: any) {
       this.activeItem = this.contentGrid.getDataFromDomEvent(e);
    }

    protected handleDragInit(event: DragEvent) {
        event.stopImmediatePropagation();
    }

    protected handleDragStart() {
        let draggableClass: string = this.contentGrid.getOptions().getSelectedCellCssClass() || '';
        draggableClass = (' ' + draggableClass).replace(/\s/g, '.');
        let row: Element = Element.fromString(draggableClass).getParentElement();

        this.contentGrid.collapseNodeByRow(this.getRowIndex(row.getEl()));

        row = Element.fromString(draggableClass).getParentElement();

        this.draggableItem = Element.fromString(row.toString());

        this.draggableItem.addClass('draggable');
        row.getEl().setDisplay('none');

        this.rowHeight = row.getEl().getHeight();
        const proxyEl: ElementHelper = Element.fromString('.slick-reorder-proxy').getEl();
        const top: string = proxyEl.getTop();
        this.draggableItem.getEl().setTop(top).setPosition('absolute');
        const gridClasses: string = (` ${this.contentGrid.getGrid().getEl().getClass()}`).replace(/\s/g, '.');

        $(`.tree-grid ${gridClasses} .slick-viewport`).get(0).appendChild(this.draggableItem.getHTMLElement());
    }

    protected getRowIndex(row: ElementHelper): number {
        const parent: ElementHelper = row.getParent();

        const sortedByTop: number[] = (parent.getChildren() as HTMLElement[])
            .filter((el: HTMLElement) => el.classList.contains('slick-row'))
            .map((el: HTMLElement) => +el.style.top.replace('px', ''))
            .sort((a: number, b: number) => a - b);

        let pos: number = -1;
        const rowTop: number = +row.getHTMLElement().style.top.replace('px','');

        sortedByTop.some((item: number, index: number) => {
            if (item === rowTop) {
                pos = index;
                return true;
            }

            return false;
        });

        return pos;
    }

    protected handleDragEnd(_event: Event, _data: DragEventData) {
        this.draggableItem.remove();
        this.draggableItem = null;
        this.contentGrid.invalidate();
    }

    protected handleBeforeMoveRows(_event: Event, data: DragEventData): boolean {
        if (!this.draggableItem) {
            this.handleDragStart();
        }
        const gridClasses: string = (' ' + this.contentGrid.getGrid().getEl().getClass()).replace(/\s/g, '.');
        const children: Element[] = Element.fromSelector(`.tree-grid ${gridClasses} .grid-canvas .slick-row`, false);

        if (children && !children[0].getPreviousElement()) {
            children.shift();
        }

        const setMarginTop: (element: Element, margin: string) => void = (element, margin) => element.getEl().setMarginTop(margin);

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

        if (selectedRow <= this.contentGrid.getCurrentTotal() - 1) {
            this.contentGrid.getGrid().setSelectedRows([selectedRow]);
        }
        this.handleMovements(rowDataId, moveBeforeRowDataId);

        this.notifyPositionChanged();
    }

    protected makeMovementInNodes(draggableRow: number, insertBefore: number): number {
        return this.contentGrid.moveNode(draggableRow, insertBefore);
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
        this.draggableItem.getEl().setTopPx(top).setZindex(2);
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
