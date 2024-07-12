import {Equitable} from '../../Equitable';
import {Toolbar, ToolbarConfig} from '../../ui/toolbar/Toolbar';

export class ItemPreviewToolbar<M extends Equitable, C extends ToolbarConfig>
    extends Toolbar<C> {

    private item: M;

    constructor(config?: C) {
        super(config);

        this.addClass('item-preview-toolbar');
    }

    setItem(item: M) {
        this.item = item;
    }

    getItem(): M {
        return this.item;
    }
}
