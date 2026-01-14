import {DivEl} from '../../../dom/DivEl';
import {Button} from '../../button/Button';
import {StyleHelper} from '../../../StyleHelper';
import {Element} from '../../../dom/Element';
import {ListSelectionController} from './ListSelectionController';
import {SelectableListBoxWrapper} from './SelectableListBoxWrapper';
import {ListSelectionPanelToggler} from './ListSelectionPanelToggler';
import {i18n} from '../../../util/Messages';

export interface ListBoxToolbarParams {
    refreshAction: () => void;
}

export class ListBoxToolbar<I>
    extends DivEl {

    private readonly selectionPanelToggler: ListSelectionPanelToggler<I>;
    private readonly selectionController: ListSelectionController<I>;
    private readonly centerWrapper: DivEl;
    private readonly leftWrapper: DivEl;
    private readonly rightWrapper: DivEl;
    private readonly refreshButton: Button;

    constructor(listBoxWrapper: SelectableListBoxWrapper<I>, params: ListBoxToolbarParams) {
        super('tree-grid-toolbar toolbar');

        this.selectionController = new ListSelectionController(listBoxWrapper);
        this.selectionPanelToggler = new ListSelectionPanelToggler(listBoxWrapper);

        this.refreshButton = new Button();
        this.refreshButton
            .addClass(StyleHelper.getCommonIconCls('loop'))
            .setTitle(i18n('action.refresh'))
            .setAriaLabel(i18n('action.refresh'))
            .onClicked(() => params.refreshAction());

        this.leftWrapper = new DivEl('left-wrapper');
        this.leftWrapper.appendChildren<Element>(this.selectionController, this.selectionPanelToggler);

        this.centerWrapper = new DivEl('center-wrapper');

        this.rightWrapper = new DivEl('right-wrapper');
        this.rightWrapper.appendChild(this.refreshButton);

        this.appendChildren(this.leftWrapper, this.centerWrapper, this.rightWrapper);

        this.initListeners();
    }

    private initListeners(): void {
        const onElementFocus = (event: FocusEvent) => this.addClassEx('focused');
        const onElementBlur = (event: FocusEvent) => this.removeClassEx('focused');

        this.refreshButton.onFocus(onElementFocus);
        this.selectionController.onFocus(onElementFocus);

        this.refreshButton.onBlur(onElementBlur);
        this.selectionController.onBlur(onElementBlur);
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
