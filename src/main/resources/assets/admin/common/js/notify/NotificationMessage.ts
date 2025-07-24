import {DivEl} from '../dom/DivEl';
import {SpanEl} from '../dom/SpanEl';
import {UlEl} from '../dom/UlEl';
import {Message, MessageAction, MessageType} from './Message';
import {AEl} from '../dom/AEl';

export class NotificationMessage
    extends DivEl {

    private readonly notificationText: DivEl;

    private readonly actionList: UlEl;

    private readonly message: Message;

    constructor(message: Message) {
        super('notification');

        if (message.getType()) {
            this.addClass(MessageType[message.getType()].toLowerCase());
        }

        this.message = message;
        const notificationInner = new DivEl('notification-inner');
        const notificationRemove = new SpanEl('notification-remove icon-close');
        this.notificationText = new DivEl('notification-text');
        this.actionList = new DivEl('notification-actions');
        this.notificationText.setHtml(message.getText());
        notificationInner.appendChildren(this.notificationText, this.actionList);
        this.appendChildren(notificationInner, notificationRemove);
    }

    getMessage(): Message {
        return this.message;
    }

    isAutoHide(): boolean {
        return this.message.getAutoHide();
    }

    setText(text: string): NotificationMessage {
        this.notificationText.getEl().setInnerHtml(text);
        return this;
    }

    addAction(action: MessageAction): NotificationMessage {
        this.actionList.appendChild(NotificationMessage.createAction(action));
        return this;
    }

    private static createAction(action: MessageAction): AEl {
        const aEl = new AEl('action');
        aEl.setHtml(action.getName());
        aEl.onClicked(action.getHandler());
        return aEl;
    }
}
