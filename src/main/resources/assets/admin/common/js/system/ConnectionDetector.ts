import {StatusRequest} from './StatusRequest';
import {StatusResult} from './StatusResult';
import {showError} from '../notify/MessageBus';
import {NotifyManager} from '../notify/NotifyManager';
import {Store} from '../store/Store';

export const CONNECTION_DETECTOR_KEY: string = 'ConnectionDetector';

export class ConnectionDetector {

    private intervalId: number = -1;

    private pollIntervalMs: number;

    private connected: boolean = true;

    private authenticated: boolean = false;

    private readonly: boolean;

    private connectionLostListeners: (() => void)[] = [];

    private connectionRestoredListeners: (() => void)[] = [];

    private sessionExpiredListeners: (() => void)[] = [];

    private pollListeners: (() => void)[] = [];

    private readonlyStatusChangedListeners: ((readonly: boolean) => void)[] = [];

    constructor(pollIntervalMs: number = 15000) {
        this.pollIntervalMs = pollIntervalMs;
    }

    static get(): ConnectionDetector {
        let instance: ConnectionDetector = Store.instance().get(CONNECTION_DETECTOR_KEY);

        if (instance == null) {
            instance = new ConnectionDetector();
            Store.instance().set(CONNECTION_DETECTOR_KEY, instance);
        }

        return instance;
    }

    setNotificationMessage(message: string): ConnectionDetector {
        let messageId: string;

        const hideNotificationMessage = () => {
            if (messageId) {
                NotifyManager.get().hide(messageId);
                messageId = null;
            }
        };

        this.onConnectionLost(() => {
            hideNotificationMessage();
            messageId = showError(message, false);
        });

        this.onConnectionRestored(hideNotificationMessage);

        this.onSessionExpired(hideNotificationMessage);

        return this;
    }

    startPolling(immediate: boolean = false) {
        this.stopPolling();
        this.intervalId = setInterval(this.doPoll.bind(this), this.pollIntervalMs) as any;
        if (immediate) {
            this.doPoll();
        }
    }

    stopPolling() {
        clearInterval(this.intervalId);
    }

    setSessionExpireRedirectUrl(url: string): ConnectionDetector {
        this.onSessionExpired(() => {
            window.location.href = url;
        });

        return this;
    }

    setAuthenticated(isAuthenticated: boolean): ConnectionDetector {
        this.authenticated = isAuthenticated;

        return this;
    }

    onConnectionLost(listener: () => void) {
        this.connectionLostListeners.push(listener);
    }

    isConnected(): boolean {
        return this.connected;
    }

    isAuthenticated(): boolean {
        return this.authenticated;
    }

    onConnectionRestored(listener: () => void) {
        this.connectionRestoredListeners.push(listener);
    }

    onSessionExpired(listener: () => void) {
        this.sessionExpiredListeners.push(listener);
    }

    onReadonlyStatusChanged(listener: (readonly: boolean) => void) {
        this.readonlyStatusChangedListeners.push(listener);
    }

    onPoll(listener: () => void) {
        this.pollListeners.push(listener);
    }

    unConnectionLost(listener: () => void) {
        this.connectionLostListeners = this.connectionLostListeners.filter((currentListener: () => void) => {
            return currentListener !== listener;
        });
    }

    unConnectionRestored(listener: () => void) {
        this.connectionRestoredListeners = this.connectionRestoredListeners.filter((currentListener: () => void) => {
            return currentListener !== listener;
        });
    }

    unSessionExpired(listener: () => void) {
        this.sessionExpiredListeners = this.sessionExpiredListeners.filter((currentListener: () => void) => {
            return currentListener !== listener;
        });
    }

    unReadonlyStatusChanged(listener: (readonly: boolean) => void) {
        this.readonlyStatusChangedListeners =
            this.readonlyStatusChangedListeners.filter((currentListener: (readonly: boolean) => void) => {
                return currentListener !== listener;
            });
    }

    unPoll(listener: () => void) {
        this.pollListeners = this.pollListeners.filter((currentListener: () => void) => {
            return currentListener !== listener;
        });
    }

    private doPoll() {
        const request: StatusRequest = new StatusRequest();
        request.setTimeout(this.pollIntervalMs);

        request.sendAndParse().then((status: StatusResult) => {
            if (!this.connected) {
                this.notifyConnectionRestored();
                this.connected = !this.connected;
            }
            if (this.authenticated && !status.isAuthenticated()) {
                this.notifySessionExpired();
            }
            this.authenticated = status.isAuthenticated();

            if (this.readonly !== status.isReadonly()) {
                this.readonly = status.isReadonly();
                this.notifyReadonlyStatusChanged(this.readonly);
            }
        }).catch(() => {
            if (this.connected) {
                this.notifyConnectionLost();
                this.connected = !this.connected;
            }
        }).finally(() => {
            this.notifyPoll();
        }).done();
    }

    private notifyConnectionLost() {
        this.connectionLostListeners.forEach((listener: () => void) => {
            listener.call(this);
        });
    }

    private notifyConnectionRestored() {
        this.connectionRestoredListeners.forEach((listener: () => void) => {
            listener.call(this);
        });
    }

    private notifySessionExpired() {
        this.sessionExpiredListeners.forEach((listener: () => void) => {
            listener.call(this);
        });
    }

    private notifyPoll() {
        this.pollListeners.forEach((listener: () => void) => {
            listener.call(this);
        });
    }

    private notifyReadonlyStatusChanged(readonly: boolean) {
        this.readonlyStatusChangedListeners.forEach((listener) => listener(readonly));
    }
}
