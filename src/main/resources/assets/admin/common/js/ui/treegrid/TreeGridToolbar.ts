import {DivEl} from '../../dom/DivEl';
import {Element} from '../../dom/Element';
import {Button} from '../button/Button';
import {SelectionController} from './actions/SelectionController';
import {SelectionPanelToggler} from './actions/SelectionPanelToggler';
import {StyleHelper} from '../../StyleHelper';

export class TreeGridToolbar
    extends DivEl {

    private selectionPanelToggler: SelectionPanelToggler;
    private centerWrapper: DivEl;
    private leftWrapper: DivEl;
    private rightWrapper: DivEl;

    constructor(treeGrid: TreeGrid<any>) {
        super('tree-grid-toolbar toolbar');

        const selectionController: SelectionController = new SelectionController(treeGrid);

        this.selectionPanelToggler = new SelectionPanelToggler(treeGrid);

        const refreshButton: Button = new Button();
        refreshButton
            .addClass(StyleHelper.getCommonIconCls('loop'))
            .onClicked(() => treeGrid.reload());

        this.leftWrapper = new DivEl('left-wrapper');
        this.leftWrapper.appendChildren<Element>(selectionController, this.selectionPanelToggler);

        this.centerWrapper = new DivEl('center-wrapper');

        this.rightWrapper = new DivEl('right-wrapper');
        this.rightWrapper.appendChild(refreshButton);

        this.appendChildren(this.leftWrapper, this.centerWrapper, this.rightWrapper);
    }

    getSelectionPanelToggler(): SelectionPanelToggler {
        return this.selectionPanelToggler;
    }

    protected appendToLeft(element: Element) {
        this.leftWrapper.appendChild(element);
    }

    protected appendToCenter(element: Element) {
        this.centerWrapper.appendChild(element);
    }

    protected appendToRight(element: Element) {
        this.rightWrapper.appendChild(element);
    }
}
