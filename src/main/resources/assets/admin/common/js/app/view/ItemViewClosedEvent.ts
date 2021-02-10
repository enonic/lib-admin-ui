import {ItemViewPanel} from './ItemViewPanel';

export class ItemViewClosedEvent {

    private readonly view: ItemViewPanel;

    constructor(view: ItemViewPanel) {
        this.view = view;
    }

    getView(): ItemViewPanel {
        return this.view;
    }
}
