module api.notify {

    export class NotificationMessage extends api.dom.DivEl {

        private autoHide: boolean;

        private notificationContent: api.dom.DivEl;

        constructor(message: string, autoHide: boolean = false) {
            super('notification');
            this.autoHide = autoHide;
            const notificationInner = new api.dom.DivEl('notification-inner');
            const notificationRemove = new api.dom.SpanEl('notification-remove');
            notificationRemove.setHtml('X');
            this.notificationContent = new api.dom.DivEl('notification-content');
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
}
