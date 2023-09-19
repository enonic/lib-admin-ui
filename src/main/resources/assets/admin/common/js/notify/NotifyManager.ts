// import * as $ from 'jquery'; // jquery is a peerDependency
import {Body} from '../dom/Body';
import {NotificationMessage} from './NotificationMessage';
import {NotificationContainer} from './NotificationContainer';
import {Message, MessageAction} from './Message';
import {Store} from '../store/Store';

export const NOTIFY_MANAGER_KEY: string = 'NotifyManager';

export class NotifyManager {

    private notificationLimit: number = 3;

    private queue: NotificationMessage[] = [];

    private lifetime: number = 5000;

    private slideDuration: number = 500;

    private timers: Object = {};

    private el: NotificationContainer;

    private registry: Object = {};

    constructor() {

        this.el = new NotificationContainer();
        Body.get().appendChild(this.el);

        this.el.getEl().setBottomPx(0);
    }

    static get(): NotifyManager {
        let instance: NotifyManager = Store.parentInstance().get(NOTIFY_MANAGER_KEY);

        if (instance == null) {
            instance = new NotifyManager();
            Store.parentInstance().set(NOTIFY_MANAGER_KEY, instance);
        }

        return instance;
    }

    showFeedback(message: string, autoHide: boolean = true): string {
        let feedback = Message.newInfo(message, autoHide);
        return this.notify(feedback);
    }

    showSuccess(message: string, autoHide: boolean = true): string {
        let feedback = Message.newSuccess(message, autoHide);
        return this.notify(feedback);
    }

    showError(message: string, autoHide: boolean = true): string {
        let error = Message.newError(message, autoHide);
        return this.notify(error);
    }

    showWarning(message: string, autoHide: boolean = true): string {
        let warning = Message.newWarning(message, autoHide);
        return this.notify(warning);
    }

    notify(message: Message): string {

        if (this.messageExistsInRegistry(message)) {
            return null;
        }

        const limitReached = this.queue.length > 0
                             || this.el.getWrapper().getChildren().length >= this.notificationLimit;

        const notification = this.createNotification(message);

        if (limitReached) {
            this.queue.push(notification);
        } else {
            this.renderNotification(notification);
        }

        return notification.getEl().getId();
    }

    getNotification(messageId: string): NotificationMessage {
        if (messageId && this.registry[messageId]) {
            return this.registry[messageId].el;
        }
        return null;
    }

    hide(messageId: string) {
        if (messageId && this.registry[messageId]) {
            this.remove(this.registry[messageId].el);
        }
    }

    private messageExistsInRegistry(message: Message) {
        if (Object.keys(this.registry).length === 0) {
            return false;
        }

        const registryArray = Object.keys(this.registry).map((key) => this.registry[key].opts);

        return registryArray.some((registryEntry) =>
            registryEntry.message === message && registryEntry.type === message.getType());
    }

    private createNotification(message: Message): NotificationMessage {
        const notificationEl = new NotificationMessage(message);

        this.registry[notificationEl.getEl().getId()] = {
            opts: message,
            el: notificationEl
        };

        this.setListeners(notificationEl);
        this.setActions(notificationEl, message.getActions());

        return notificationEl;
    }

    private renderNotification(notification: NotificationMessage): NotificationMessage {
        this.el.getWrapper().appendChild(notification);
        notification.hide();

        $(notification.getHTMLElement()).animate({
                height: 'toggle'
            },
            this.slideDuration,
            () => {
                if (notification.isAutoHide()) {
                    this.timers[notification.getEl().getId()] = {
                        remainingTime: this.lifetime
                    };

                    this.startTimer(notification);
                }
            });

        return notification;
    }

    private setListeners(el: NotificationMessage) {
        el.onClicked(() => {
            this.remove(el);
            return false;
        });
        el.onMouseEnter(() => {
            this.stopTimer(el);
        });
        el.onMouseLeave(() => {
            this.startTimer(el);
        });
        el.onRemoved(() => this.handleNotificationRemoved());
    }

    private setActions(notificationEl: NotificationMessage, actions: MessageAction[]) {
        actions.forEach(action => notificationEl.addAction(action));
    }

    private handleNotificationRemoved() {
        if (this.queue.length > 0) {
            const notification = this.queue.shift();
            this.renderNotification(notification);
        }
    }

    private remove(el: NotificationMessage) {
        if (!el) {
            return;
        }

        $(el.getHTMLElement()).animate({
                height: 'hide'
            }, this.slideDuration, 'linear',
            () => {
                if (this.el.getWrapper().hasChild(el)) {
                    this.el.getWrapper().removeChild(el);
                } else {
                    this.queue = this.queue.filter(q => q !== el);
                }
            });

        delete this.registry[el.getEl().getId()];
        delete this.timers[el.getEl().getId()];
    }

    private startTimer(el: NotificationMessage) {
        let timer = this.timers[el.getEl().getId()];

        if (!timer) {
            return;
        }

        timer.id = setTimeout(() => {
                this.remove(el);
            },
            timer.remainingTime
        );

        timer.startTime = Date.now();
    }

    private stopTimer(el: NotificationMessage) {
        let timer = this.timers[el.getEl().getId()];

        if (!timer || !timer.id) {
            return;
        }

        clearTimeout(timer.id);
        timer.id = null;
        timer.remainingTime -= Date.now() - timer.startTime;
    }
}
