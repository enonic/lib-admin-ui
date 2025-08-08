import Q from 'q';
import {H6El} from '../../dom/H6El';
import {i18n} from '../../util/Messages';
import {ModalDialog} from './ModalDialog';

export class NotificationDialog
    extends ModalDialog {

    private text: string;

    constructor(text: string) {
        super({
            title: i18n('dialog.notification.title'),
            class: 'notification-dialog'
        });

        this.text = text;
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            const notificationEl = new H6El('notification-dialog-text').setHtml(this.text);
            this.appendChildToContentPanel(notificationEl);

            this.addCancelButtonToBottom(i18n('action.ok'));

            return rendered;
        });
    }
}
