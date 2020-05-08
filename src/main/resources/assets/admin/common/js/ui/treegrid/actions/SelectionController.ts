import {i18n} from '../../../util/Messages';
import {Checkbox, CheckboxBuilder} from '../../Checkbox';
import {Tooltip} from '../../Tooltip';
import {TreeGrid} from '../TreeGrid';

export class SelectionController
    extends Checkbox {

    protected tooltip: Tooltip;

    protected treeGrid: TreeGrid<any>;

    constructor(treeGrid: TreeGrid<any>) {
        super(new CheckboxBuilder());

        this.treeGrid = treeGrid;

        this.initElements();
        this.initListeners();

        this.addClass('selection-controller');
    }

    protected initElements() {
        this.tooltip = new Tooltip(this, '', 1000);
    }

    protected initListeners() {
        this.treeGrid.onSelectionChanged(() => this.updateState());
        this.treeGrid.onLoaded(() => this.updateState());
        this.onClicked((event) => {
            event.preventDefault();

            if (this.isDisabled()) {
                return;
            }

            if (this.isChecked() || this.isPartial()) {
                this.treeGrid.deselectAll();
            } else {
                this.treeGrid.selectAll();
            }
        });

        this.onRendered(() => {
            this.setChecked(false, true);
        });
    }

    protected updateState() {
        const isAnySelected = this.isAnySelected();
        const isAllSelected = this.isAllSelected();
        const isGridEmpty = this.treeGrid.isEmpty();

        const shouldBeDisabled = isGridEmpty && !isAnySelected;
        if (this.isDisabled() !== shouldBeDisabled) {
            this.setDisabled(shouldBeDisabled);
        }

        if (isAllSelected) {
            this.setChecked(true, true);
        } else {
            if (this.isChecked()) {
                this.setChecked(false, true);
            }
        }
        this.setPartial(isAnySelected && !isAllSelected);

        const tooltipText = this.isChecked() ? i18n('field.selection.clear') : i18n('field.selection.selectAll');
        this.tooltip.setText(tooltipText);
    }

    private isAnySelected(): boolean {
        return this.treeGrid.getTotalSelected() > 0;
    }

    private isAllSelected(): boolean {
        return !this.treeGrid.isEmpty() && this.treeGrid.isAllSelected();
    }
}
