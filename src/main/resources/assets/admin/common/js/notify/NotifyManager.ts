import {Body} from '../dom/Body';
import {Store} from '../store/Store';
import {Message} from './Message';
import {NotificationContainer} from './NotificationContainer';
import {NotificationMessage} from './NotificationMessage';

export const NOTIFY_MANAGER_KEY: string = 'NotifyManager';

interface Timer {
    id?: number;
    startTime?: number;
    remainingTime: number;
}

export class NotifyManager {

    private notificationLimit: number = 3;

    private queue: NotificationMessage[] = [];

    private timers: Map<string, Timer> = new Map<string, Timer>();

    private el: NotificationContainer;

    private registry: Map<string, { opts: Message; el: NotificationMessage }> = new Map<string, {
        opts: Message;
        el: NotificationMessage
    }>();

    constructor() {

        this.el = new NotificationContainer();
        Body.get().appendChild(this.el);
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
        const feedback = Message.newInfo(message, autoHide);
        return this.notify(feedback);
    }

    showSuccess(message: string, autoHide: boolean = true): string {
        const feedback = Message.newSuccess(message, autoHide);
        return this.notify(feedback);
    }

    showError(message: string, autoHide: boolean = true): string {
        const error = Message.newError(message, autoHide);
        return this.notify(error);
    }

    showWarning(message: string, autoHide: boolean = true): string {
        const warning = Message.newWarning(message, autoHide);
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
        if (messageId && this.registry.has(messageId)) {
            return this.registry.get(messageId).el;
        }
        return null;
    }

    hide(messageId: string) {
        if (messageId && this.registry.has(messageId)) {
            this.handleOpenChange(this.registry.get(messageId).el, false);
        }
    }

    private messageExistsInRegistry(message: Message) {
        if (this.registry.size === 0) {
            return false;
        }

        const registryArray: Message[] = Array.from(this.registry.values()).map(entry => entry.opts);

        return registryArray.some((registryEntry: Message) =>
            registryEntry.getText() === message.getText() && registryEntry.getType() === message.getType());
    }

    private createNotification(message: Message): NotificationMessage {
        const notification = new NotificationMessage(message, open => this.handleOpenChange(notification, open));

        this.registry.set(notification.getEl().getId(), {
            opts: message,
            el: notification
        });

        this.setListeners(notification);

        return notification;
    }

    private renderNotification(notification: NotificationMessage): NotificationMessage {
        this.el.getWrapper().appendChild(notification);

        const message = this.registry.get(notification.getEl().getId())?.opts;

        if (message?.getAutoHide()) {
            const lifeTime = message.getLifeTime() ?? Message.shortLifeTime;
            this.timers.set(notification.getEl().getId(), {
                remainingTime: lifeTime
            });

            this.startTimer(notification);
        }

        return notification;
    }

    private setListeners(notification: NotificationMessage) {
        notification.onMouseEnter(() => this.stopTimer(notification));
        notification.onMouseLeave(() => this.startTimer(notification));
    }

    private handleNotificationRemoved() {
        if (this.queue.length > 0) {
            const notification = this.queue.shift();
            if (notification) {
                this.renderNotification(notification);
            }
        }
    }

    private handleOpenChange(notification: NotificationMessage, open: boolean) {
        notification.setOpen(open);

        if (open) {
            return;
        }

        const id = notification.getEl().getId();

        if (!this.registry.has(id)) {
            return;
        }

        this.clearTimer(id);

        if (this.el.getWrapper().hasChild(notification)) {
            this.el.getWrapper().removeChild(notification);
        } else {
            this.queue = this.queue.filter(q => q !== notification);
        }

        this.registry.delete(id);
        this.handleNotificationRemoved();
    }

    private startTimer(el: NotificationMessage) {
        const timer: Timer = this.timers.get(el.getEl().getId());

        if (!timer || timer.id) {
            return;
        }

        if (timer.remainingTime <= 0) {
            this.handleOpenChange(el, false);
            return;
        }

        timer.id = window.setTimeout(() => this.handleOpenChange(el, false), timer.remainingTime);
        timer.startTime = Date.now();
    }

    private stopTimer(el: NotificationMessage) {
        const timer: Timer = this.timers.get(el.getEl().getId());

        if (!timer?.id || timer.startTime == null) {
            return;
        }

        clearTimeout(timer.id);
        timer.remainingTime = Math.max(0, timer.remainingTime - (Date.now() - timer.startTime));
        timer.id = undefined;
        timer.startTime = undefined;
    }

    private clearTimer(id: string) {
        const timer = this.timers.get(id);

        if (timer?.id) {
            clearTimeout(timer.id);
        }

        this.timers.delete(id);
    }

}
