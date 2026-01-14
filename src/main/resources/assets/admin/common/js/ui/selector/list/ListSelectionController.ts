import {i18n} from '../../../util/Messages';
import {Checkbox, CheckboxBuilder} from '../../Checkbox';
import {Tooltip} from '../../Tooltip';
import {SelectableListBoxWrapper, SelectionMode} from './SelectableListBoxWrapper';

export class ListSelectionController<I>
    extends Checkbox {

    protected tooltip: Tooltip;

    protected selectableListBox: SelectableListBoxWrapper<I>;

    constructor(selectableListBox: SelectableListBoxWrapper<I>) {
        super(new CheckboxBuilder());

        this.selectableListBox = selectableListBox;

        this.initElements();
        this.initListeners();

        this.addClass('selection-controller');
    }

    protected initElements() {
        this.tooltip = new Tooltip(this, '', 1000);
    }

    protected initListeners() {
        const updateStateFunc: () => void = this.updateState.bind(this);
        this.selectableListBox.onSelectionChanged(updateStateFunc);
        this.selectableListBox.onDataChanged(updateStateFunc);

        this.onClicked(this.handleClick.bind(this));

        this.onRendered(() => {
            this.setChecked(false, true);
        });
    }

    private handleClick(event: MouseEvent) {
        event.preventDefault();

        if (this.isDisabled()) {
            return;
        }

        if (this.isChecked() || this.isPartial()) {
            this.selectableListBox.deselectAll();
        } else {
            this.selectableListBox.setSelectionMode(SelectionMode.SELECT);
            this.selectableListBox.selectAll();
        }
    }

    protected updateState() {
        const isAnySelected = this.isAnySelected();
        const isAllSelected = this.isAllSelected();
        const isGridEmpty = this.selectableListBox.getTotalItems() === 0;

        const shouldBeDisabled = isGridEmpty && !isAnySelected;
        if (this.isDisabled() !== shouldBeDisabled) {
            this.setEnabled(!shouldBeDisabled);
        }

        if (isAllSelected) {
            this.setChecked(true, true);
        } else {
            if (this.isChecked()) {
                this.setChecked(false, true);
            }
        }
        this.setPartial(isAnySelected && !isAllSelected);

        const tooltipText: string = this.isChecked() ? i18n('field.selection.clear') : i18n('field.selection.selectAll');
        this.tooltip.setText(tooltipText);
        this.setAriaLabel(tooltipText);
    }

    private isAnySelected(): boolean {
        return this.selectableListBox.getSelectionMode() === SelectionMode.SELECT && this.selectableListBox.getSelectedItems().length > 0;
    }

    private isAllSelected(): boolean {
        return this.isAnySelected() && this.selectableListBox.getSelectedItems().length === this.selectableListBox.getTotalItems();
    }
}
