import {i18n} from '../../util/Messages';
import {DeckPanel} from '../../ui/panel/DeckPanel';
import {ItemStatisticsPanel} from '../view/ItemStatisticsPanel';
import {DivEl} from '../../dom/DivEl';
import {ViewItem} from '../view/ViewItem';

export class BrowseItemPanel
    extends DeckPanel {

    protected itemStatisticsPanel: ItemStatisticsPanel;

    private readonly noSelectionContainer: DivEl;

    constructor() {
        super('browse-item-panel no-selection');

        this.itemStatisticsPanel = this.createItemStatisticsPanel();

        this.noSelectionContainer = new DivEl('no-selection-container');
        this.noSelectionContainer.setHtml(i18n('panel.noselection'));

        this.addPanel(this.itemStatisticsPanel);
        this.appendChild(this.noSelectionContainer);

        this.showPanelByIndex(0);
    }

    createItemStatisticsPanel(): ItemStatisticsPanel {
        return new ItemStatisticsPanel();
    }

    togglePreviewForItem(item?: ViewItem) {
        if (item) {
            this.removeClass('no-selection');
        } else {
            this.showNoSelectionMessage();
        }
        this.setStatisticsItem(item);
    }

    setStatisticsItem(item: ViewItem) {
        if (item) {
            this.itemStatisticsPanel.setItem(item);
        } else {
            this.itemStatisticsPanel.clearItem();
        }
    }

    getStatisticsItem(): ViewItem {
        return this.itemStatisticsPanel.getItem();
    }

    hasStatisticsItem(): boolean {
        return !!this.itemStatisticsPanel && !!this.itemStatisticsPanel.getItem();
    }

    getItemStatisticsPanel(): ItemStatisticsPanel {
        return this.itemStatisticsPanel;
    }

    private showNoSelectionMessage() {
        this.addClass('no-selection');
    }
}
