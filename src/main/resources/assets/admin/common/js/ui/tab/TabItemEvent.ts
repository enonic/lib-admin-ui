import {TabItem} from './TabItem';

export class TabItemEvent {

    private tab: TabItem;

    constructor(tab: TabItem) {
        this.tab = tab;
    }

    getTab(): TabItem {
        return this.tab;
    }
}
