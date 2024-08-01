import {DivEl} from '../../../dom/DivEl';
import {i18n} from '../../../util/Messages';
import {TogglerButton} from '../../button/TogglerButton';
import {Tooltip} from '../../Tooltip';
import {SelectableListBoxWrapper, SelectionMode} from './SelectableListBoxWrapper';

export class ListSelectionPanelToggler<I>
    extends TogglerButton {

    private tooltip: Tooltip;

    private counterDescription: DivEl;

    constructor(selectableListBox: SelectableListBoxWrapper<I>) {
        super('selection-toggler');

        this.counterDescription = new DivEl('description');
        this.appendChild(this.counterDescription);

        this.setEnabled(true);

        this.tooltip = new Tooltip(this, '', 1000);

        selectableListBox.onSelectionChanged(() => {
            const oldLabel: string = this.getLabel();
            const totalSelected: number = selectableListBox.getSelectionMode() === SelectionMode.SELECT
                                          ? selectableListBox.getSelectedItems().length
                                          : 0;
            const newLabel: string = totalSelected ? totalSelected.toString() : '';

            if (oldLabel === newLabel) {
                return;
            }

            this.tooltip.setText(this.isActive() ? i18n('field.selection.hide') : i18n('field.selection.show'));

            this.removeClass('any-selected');
            this.removeClass(`size-${oldLabel.length}`);
            this.setLabel(newLabel);

            if (newLabel !== '') {
                this.addClass(`size-${newLabel.length}`);
                this.addClass('updated');
                if (totalSelected >= 1) {
                    this.addClass('any-selected');
                    const description = i18n(`field.item.${totalSelected === 1 ? 'single' : 'multiple'}`);
                    this.counterDescription.getEl().setAttribute('data-label', description);
                }
                setTimeout(() => {
                    this.removeClass('updated');
                }, 200);
            }

        });

        this.onActiveChanged((isActive: boolean) => {
            let isVisible = this.tooltip.isVisible();
            if (isVisible) {
                this.tooltip.hide();
            }
            this.tooltip.setText(isActive ? 'Hide selection' : 'Show selection');
            if (isVisible) {
                this.tooltip.show();
            }
        });
    }
}
