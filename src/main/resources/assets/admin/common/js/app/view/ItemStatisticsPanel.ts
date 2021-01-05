import {Panel} from '../../ui/panel/Panel';
import {ViewItem} from './ViewItem';

export class ItemStatisticsPanel
    extends Panel {

    private viewItem: ViewItem;

    constructor(className?: string) {
        super('item-statistics-panel' + (className ? ' ' + className : ''));
    }

    setItem(item: ViewItem) {
        this.viewItem = item;
    }

    clearItem() {
        this.viewItem = null;
    }

    getItem(): ViewItem {
        return this.viewItem;
    }
}
