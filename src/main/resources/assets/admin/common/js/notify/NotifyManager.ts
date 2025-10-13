import * as $ from 'jquery';
import {Body} from '../dom/Body';
import {NotificationMessage} from './NotificationMessage';
import {NotificationContainer} from './NotificationContainer';
import {Message, MessageAction} from './Message';
import {Store} from '../store/Store';

export const NOTIFY_MANAGER_KEY: string = 'NotifyManager';

interface Timer {
    id?: number;
    startTime?: number;
    remainingTime: number;
}

export class NotifyManager {

    private notificationLimit: number = 3;

    private queue: NotificationMessage[] = [];

    private shortLifeTime: number = 5000;

    private longLifeTime: number = 30000;

    private slideDuration: number = 500;

    private timers: Map<string, Timer> = new Map<string, Timer>();

    private el: NotificationContainer;

    private registry: Map<string, { opts: Message, el: NotificationMessage }> = new Map<string, { opts: Message, el: NotificationMessage }>();

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
        if (messageId && this.registry.has(messageId)) {
            return this.registry.get(messageId).el;
        }
        return null;
    }

    hide(messageId: string) {
        if (messageId && this.registry.has(messageId)) {
            this.remove(this.registry.get(messageId).el);
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
        const notificationEl = new NotificationMessage(message);

        this.registry.set(notificationEl.getEl().getId(), {
            opts: message,
            el: notificationEl
        });

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
                    this.timers.set(notification.getEl().getId(), {
                        remainingTime: this.getNotificationLifeTime(notification.getMessage())
                    });

                    this.startTimer(notification);
                }
            });

        return notification;
    }

    private getNotificationLifeTime(message: Message): number {
        if (message.isError() || message.isWarning()) {
            return this.longLifeTime;
        }

        return this.shortLifeTime;
    }

    private setListeners(notificationMessage: NotificationMessage) {
        notificationMessage.getRemoveEl().onClicked(() => this.remove(notificationMessage));
        notificationMessage.onMouseEnter(() => this.stopTimer(notificationMessage));
        notificationMessage.onMouseLeave(() => this.startTimer(notificationMessage));
        notificationMessage.onRemoved(() => this.handleNotificationRemoved());
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

        this.registry.delete(el.getEl().getId());
        this.timers.delete(el.getEl().getId());
    }

    private startTimer(el: NotificationMessage) {
        const timer: Timer = this.timers.get(el.getEl().getId());

        if (!timer) {
            return;
        }

        timer.id = setTimeout(() => this.remove(el), timer.remainingTime);
        timer.startTime = Date.now();
    }

    private stopTimer(el: NotificationMessage) {
        const timer: Timer = this.timers.get(el.getEl().getId());

        if (!timer || !timer.id) {
            return;
        }

        clearTimeout(timer.id);
        timer.id = null;
        timer.remainingTime -= Date.now() - timer.startTime;
    }
}
