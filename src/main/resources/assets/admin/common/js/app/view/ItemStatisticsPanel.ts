import {Equitable} from '../../Equitable';
import {Panel} from '../../ui/panel/Panel';
import {ViewItem} from './ViewItem';
import {ItemStatisticsHeader} from './ItemStatisticsHeader';

export class ItemStatisticsPanel<M extends Equitable>
    extends Panel {

    private browseItem: ViewItem<M>;

    private header: ItemStatisticsHeader<M>;

    constructor(className?: string) {
        super('item-statistics-panel' + (className ? ' ' + className : ''));

        this.header = new ItemStatisticsHeader<M>();
        this.appendChild(this.header);
    }

    getHeader(): ItemStatisticsHeader<M> {
        return this.header;
    }

    setItem(item: ViewItem<M>) {
        this.browseItem = item;
        this.header.setItem(item);
    }

    clearItem() {
        this.browseItem = null;
        this.header.setItem(null);
    }

    getItem(): ViewItem<M> {
        return this.browseItem;
    }
}
