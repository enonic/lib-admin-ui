import {Store} from '../store/Store';

const APP_MANAGER_KEY: string = 'AppManager';

export class AppManager {

    private connectionLostListeners: (() => void)[];

    private connectionRestoredListeners: (() => void)[];

    constructor() {
        this.connectionLostListeners = [];
        this.connectionRestoredListeners = [];
    }

    static get(): AppManager {
        let instance: AppManager = Store.parentInstance().get(APP_MANAGER_KEY);

        if (instance == null) {
            instance = new AppManager();
            Store.parentInstance().set(APP_MANAGER_KEY, instance);
        }

        return instance;
    }

    onConnectionLost(listener: () => void) {
        this.connectionLostListeners.push(listener);
    }

    onConnectionRestored(listener: () => void) {
        this.connectionRestoredListeners.push(listener);
    }

    unConnectionLost(listener: () => void) {
        this.connectionLostListeners = this.connectionLostListeners.filter((currentListener: () => void) => {
            return listener !== currentListener;
        });
    }

    unConnectionRestored(listener: () => void) {
        this.connectionRestoredListeners = this.connectionRestoredListeners.filter((currentListener: () => void) => {
            return listener !== currentListener;
        });
    }

    notifyConnectionLost() {
        this.connectionLostListeners.forEach((listener: () => void) => {
            listener.call(this);
        });
    }

    notifyConnectionRestored() {
        this.connectionRestoredListeners.forEach((listener: () => void) => {
            listener.call(this);
        });
    }
}
