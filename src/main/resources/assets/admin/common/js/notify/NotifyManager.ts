module api.notify {

    export class NotifyManager {

        private static instance: NotifyManager;

        private notificationLimit: number = 3;

        private queue: NotificationMessage[] = [];

        private lifetime: number = 5000;

        private slideDuration: number = 500;

        private timers: Object = {};

        private el: NotificationContainer;

        private registry: Object = {};

        constructor() {

            this.el = new NotificationContainer();
            api.dom.Body.get().appendChild(this.el);

            this.el.getEl().setBottomPx(0);
        }

        showFeedback(message: string, autoHide: boolean = true, instant?: boolean): string {
            let feedback = Message.newInfo(message, autoHide);
            return this.notify(feedback, instant);
        }

        showSuccess(message: string, autoHide: boolean = true, instant?: boolean): string {
            let feedback = Message.newSuccess(message, autoHide);
            return this.notify(feedback, instant);
        }

        showError(message: string, autoHide: boolean = true, instant?: boolean): string {
            let error = Message.newError(message, autoHide);
            return this.notify(error, instant);
        }

        showWarning(message: string, autoHide: boolean = true, instant?: boolean): string {
            let warning = Message.newWarning(message, autoHide);
            return this.notify(warning, instant);
        }

        notify(message: Message, instant?: boolean): string {
            const opts = NotifyOpts.buildOpts(message);

            const limitReached = this.queue.length > 0
                                 || this.el.getWrapper().getChildren().length >= this.notificationLimit;
            const notification = this.createNotification(opts);
            if (limitReached) {
                this.queue.push(notification);
            } else {
                this.renderNotification(notification, instant);
            }

            return notification.getEl().getId();
        }

        private messageExistsInRegistry(opts: NotifyOpts) {
            if (Object.keys(this.registry).length === 0) {
                return false;
            }

            const registryArray = Object.keys(this.registry).map(function (key: string) { return this.registry[key]; });

            return registryArray.some((registryEntry) =>
                                            registryEntry.opts.message == opts.message && registryEntry.opts.type == opts.type);
        }

        private createNotification(opts: NotifyOpts): NotificationMessage {
            if (this.messageExistsInRegistry(opts)) {
                return;
            }

            const notificationEl = new NotificationMessage(opts.message, opts.autoHide);
            if (opts.type) {
                notificationEl.addClass(opts.type);
            }

            this.registry[notificationEl.getEl().getId()] = {
                opts: opts,
                el: notificationEl
            };
            this.setListeners(notificationEl, opts);

            return notificationEl;
        }

        private renderNotification(notification: NotificationMessage, instant?: boolean): NotificationMessage {
            this.el.getWrapper().appendChild(notification);

            const autoHide = () => {
                if (notification.isAutoHide()) {
                    this.timers[notification.getEl().getId()] = {
                        remainingTime: this.lifetime
                    };

                    this.startTimer(notification);
                }
            };

            if (!instant) {
                notification.hide();
                wemjq(notification.getHTMLElement()).animate({height: 'toggle'}, this.slideDuration, autoHide);
            } else {
                autoHide();
            }

            return notification;
        }

        hide(messageId: string, instant?: boolean) {
            if (this.registry[messageId]) {
                this.remove(this.registry[messageId], instant);
            }
        }

        private setListeners(el: NotificationMessage, opts: NotifyOpts) {
            el.onClicked(()=> {
                this.remove(el);
                return false;
            });
            el.onMouseEnter(()=> {
                this.stopTimer(el);
            });
            el.onMouseLeave(()=> {
                this.startTimer(el);
            });

            if (opts.listeners) {
                opts.listeners.forEach((listener)=> {
                    el.onClicked(listener);
                });
            }

            el.onRemoved(() => this.handleNotificationRemoved());
        }

        private handleNotificationRemoved() {
            if (this.queue.length > 0) {
                const notification = this.queue.shift();
                this.renderNotification(notification);
            }
        }

        private remove(el: NotificationMessage, instant?: boolean) {
            if (!el) {
                return;
            }

            if (!instant) {
                wemjq(el.getHTMLElement()).animate({
                        height: 'hide'
                    }, this.slideDuration, 'linear',
                    () => {
                        this.el.getWrapper().removeChild(el);
                    });
            } else {
                this.el.getWrapper().removeChild(el);
            }

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

        static get(): NotifyManager {

            if (window != window.parent) {

                return this.getFromParentIFrame();
            }

            if (!NotifyManager.instance) {
                NotifyManager.instance = new NotifyManager();
            }

            return NotifyManager.instance;
        }

        private static getFromParentIFrame(): NotifyManager {
            let context = window;
            while (context != window.parent) {
                context = window.parent;
            }

            return context['api']['notify']['NotifyManager'].get();
        }
    }

}
