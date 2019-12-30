import {DivEl} from '../dom/DivEl';
import {PEl} from '../dom/PEl';
import {Store} from '../store/Store';

export const DRAG_HELPER_KEY: string = 'DragHelper';

export class DragHelper
    extends DivEl {

    public static CURSOR_AT: { left: number, top: number } = {left: -10, top: -15};

    public debug: boolean = false;

    private constructor() {
        super('drag-helper');
        this.setId('drag-helper');
    }

    static get(): DragHelper {
        let instance: DragHelper = Store.instance().get(DRAG_HELPER_KEY);

        if (instance == null) {
            instance = new DragHelper();
            Store.instance().set(DRAG_HELPER_KEY, instance);
        }

        return instance;
    }

    public setDropAllowed(allowed: boolean): DragHelper {
        if (this.debug) {
            console.log('DragHelper.setDropAllowed: ' + allowed.toString());
        }
        this.toggleClass('drop-allowed', allowed);
        return this;
    }

    public setItemName(itemName: string) {
        let p = new PEl();
        p.setClass('drag-item-name');
        p.setHtml(itemName);

        this.removeChildren();
        this.appendChild(p);
    }

    isDropAllowed(): boolean {
        return this.hasClass('drop-allowed');
    }

    reset(): DragHelper {
        this.setDropAllowed(false);
        return this;
    }

}
