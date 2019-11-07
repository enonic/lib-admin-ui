import {DivEl} from '../dom/DivEl';
import {SpanEl} from '../dom/SpanEl';

export class NotificationMessage
    extends DivEl {

    private autoHide: boolean;

    private notificationContent: DivEl;

    constructor(message: string, autoHide: boolean = false) {
        super('notification');
        this.autoHide = autoHide;
        const notificationInner = new DivEl('notification-inner');
        const notificationRemove = new SpanEl('notification-remove');
        notificationRemove.setHtml('X');
        this.notificationContent = new DivEl('notification-content');
        this.notificationContent.getEl().setInnerHtml(message, false);
        notificationInner.appendChild(notificationRemove).appendChild(this.notificationContent);
        this.appendChild(notificationInner);
    }

    isAutoHide(): boolean {
        return this.autoHide;
    }

    setText(text: string) {
        this.notificationContent.getEl().setInnerHtml(text, false);
    }
}
