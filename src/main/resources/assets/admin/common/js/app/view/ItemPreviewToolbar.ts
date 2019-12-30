import {Equitable} from '../../Equitable';
import {Toolbar} from '../../ui/toolbar/Toolbar';

export class ItemPreviewToolbar<M extends Equitable>
    extends Toolbar {

    private item: M;

    constructor(className?: string) {
        super('item-preview-toolbar' + (className ? ' ' + className : ''));
    }

    setItem(item: M) {
        this.item = item;
    }

    getItem(): M {
        return this.item;
    }
}
