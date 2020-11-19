import {DivEl} from '../../dom/DivEl';
import {Element} from '../../dom/Element';
import {Button} from '../button/Button';
import {SelectionController} from './actions/SelectionController';
import {SelectionPanelToggler} from './actions/SelectionPanelToggler';
import {StyleHelper} from '../../StyleHelper';
import {TreeGrid} from './TreeGrid';

export class TreeGridToolbar
    extends DivEl {

    private selectionPanelToggler: SelectionPanelToggler;
    private selectionController: SelectionController;
    private centerWrapper: DivEl;
    private leftWrapper: DivEl;
    private rightWrapper: DivEl;
    private refreshButton: Button;

    constructor(treeGrid: TreeGrid<any>) {
        super('tree-grid-toolbar toolbar');

        this.selectionController = new SelectionController(treeGrid);

        this.selectionPanelToggler = new SelectionPanelToggler(treeGrid);

        this.refreshButton = new Button();
        this.refreshButton
            .addClass(StyleHelper.getCommonIconCls('loop'))
            .onClicked(() => treeGrid.reload());

        this.leftWrapper = new DivEl('left-wrapper');
        this.leftWrapper.appendChildren<Element>(this.selectionController, this.selectionPanelToggler);

        this.centerWrapper = new DivEl('center-wrapper');

        this.rightWrapper = new DivEl('right-wrapper');
        this.rightWrapper.appendChild(this.refreshButton);

        this.appendChildren(this.leftWrapper, this.centerWrapper, this.rightWrapper);
    }

    disable() {
        this.refreshButton.setEnabled(false);
        this.selectionController.setEnabled(false);
    }

    enable() {
        this.refreshButton.setEnabled(true);
        this.selectionController.setEnabled(true);
    }

    getSelectionPanelToggler(): SelectionPanelToggler {
        return this.selectionPanelToggler;
    }

    hideAndDisableSelectionToggler() {
        this.selectionController.setEnabled(false);
        this.selectionController.hide();
        this.selectionPanelToggler.hide();
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
