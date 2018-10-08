module api.system {

    export class ConnectionDetector {

        private intervalId: number = -1;

        private pollIntervalMs: number;

        private connected: boolean = true;

        private authenticated: boolean = false;

        private readonly: boolean;

        private connectionLostListeners: { (): void }[] = [];

        private connectionRestoredListeners: { (): void }[] = [];

        private sessionExpiredListeners: { (): void }[] = [];

        private readonlyStatusChangedListeners: { (readonly: boolean): void }[] = [];

        constructor(pollIntervalMs: number = 15000) {
            this.pollIntervalMs = pollIntervalMs;
        }

        startPolling(immediate: boolean = false) {
            this.stopPolling();
            this.intervalId = setInterval(this.doPoll.bind(this), this.pollIntervalMs);
            if (immediate) {
                this.doPoll();
            }
        }

        stopPolling() {
            clearInterval(this.intervalId);
        }

        setAuthenticated(isAuthenticated: boolean) {
            this.authenticated = isAuthenticated;
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

        private doPoll() {
            let request = new StatusRequest();
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

        private notifyReadonlyStatusChanged(readonly: boolean) {
            this.readonlyStatusChangedListeners.forEach((listener) => listener(readonly));
        }
    }
}
