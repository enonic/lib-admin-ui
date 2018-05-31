module api.ui.treegrid {
    import DivEl = api.dom.DivEl;
    import Element = api.dom.Element;
    import Button = api.ui.button.Button;
    import SelectionController = api.ui.treegrid.actions.SelectionController;
    import SelectionPanelToggler = api.ui.treegrid.actions.SelectionPanelToggler;

    export class TreeGridToolbar extends api.dom.DivEl {

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
                .addClass(api.StyleHelper.getCommonIconCls('loop'))
                .onClicked(() => treeGrid.reload());

            this.leftWrapper = new DivEl('left-wrapper');
            this.leftWrapper.appendChildren<Element>(selectionController, this.selectionPanelToggler);

            this.centerWrapper = new DivEl('center-wrapper');

            this.rightWrapper = new DivEl('right-wrapper');
            this.rightWrapper.appendChild(refreshButton);

            this.appendChildren(this.leftWrapper, this.centerWrapper, this.rightWrapper);
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

        getSelectionPanelToggler(): SelectionPanelToggler {
            return this.selectionPanelToggler;
        }
    }
}
