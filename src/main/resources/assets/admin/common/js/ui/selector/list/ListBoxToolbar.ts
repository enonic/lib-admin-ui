import {DivEl} from '../../../dom/DivEl';
import {SelectionPanelToggler} from '../../treegrid/actions/SelectionPanelToggler';
import {Button} from '../../button/Button';
import {StyleHelper} from '../../../StyleHelper';
import {Element} from '../../../dom/Element';
import {ListSelectionController} from './ListSelectionController';
import {SelectableListBoxWrapper} from './SelectableListBoxWrapper';
import {ListSelectionPanelToggler} from './ListSelectionPanelToggler';

export interface ListBoxToolbarParams {
    refreshAction: () => void;
}

export class ListBoxToolbar<I>
    extends DivEl {

    private selectionPanelToggler: ListSelectionPanelToggler<I>;
    private selectionController: ListSelectionController<I>;
    private centerWrapper: DivEl;
    private leftWrapper: DivEl;
    private rightWrapper: DivEl;
    private refreshButton: Button;

    constructor(listBoxWrapper: SelectableListBoxWrapper<I>, params: ListBoxToolbarParams) {
        super('tree-grid-toolbar toolbar');

        this.selectionController = new ListSelectionController(listBoxWrapper);
        this.selectionPanelToggler = new ListSelectionPanelToggler(listBoxWrapper);

        this.refreshButton = new Button();
        this.refreshButton
            .addClass(StyleHelper.getCommonIconCls('loop'))
            .onClicked(() => params.refreshAction());

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

    getSelectionPanelToggler(): ListSelectionPanelToggler<I> {
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
