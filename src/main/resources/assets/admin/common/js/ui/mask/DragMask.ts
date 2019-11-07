import {Element} from '../../dom/Element';
import {Mask} from './Mask';

export class DragMask
    extends Mask {

    constructor(itemToMask: Element) {
        super(itemToMask);
        this.addClass('drag-mask');
    }
}
