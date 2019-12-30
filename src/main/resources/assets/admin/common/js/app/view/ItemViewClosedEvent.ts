import {Equitable} from '../../Equitable';
import {ItemViewPanel} from './ItemViewPanel';

export class ItemViewClosedEvent<M extends Equitable> {

    private view: ItemViewPanel<M>;

    constructor(view: ItemViewPanel<M>) {
        this.view = view;
    }

    getView(): ItemViewPanel<M> {
        return this.view;
    }
}
