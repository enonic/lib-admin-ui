import {DivEl} from '../dom/DivEl';

export class NotificationContainer
    extends DivEl {

    private wrapper: DivEl;

    constructor() {
        super('notification-container');
        this.wrapper = new DivEl('notification-wrapper');
        this.appendChild(this.wrapper);
    }

    getWrapper(): DivEl {
        return this.wrapper;
    }
}
