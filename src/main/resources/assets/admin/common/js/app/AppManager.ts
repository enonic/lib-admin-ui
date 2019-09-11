export class AppManager {
    private static INSTANCE: AppManager = null;

    private connectionLostListeners: { (): void }[] = [];

    private connectionRestoredListeners: { (): void }[] = [];

    constructor() {
        AppManager.INSTANCE = this;

    }

    static instance(): AppManager {
        if (AppManager.INSTANCE) {
            return AppManager.INSTANCE;
        } else if (window !== window.parent) {
            // look for instance in parent frame
            let apiAppModule = (<any> window.parent).api.app;
            if (apiAppModule && apiAppModule.AppManager) {
                let parentAppManager = <AppManager> apiAppModule.AppManager.INSTANCE;
                if (parentAppManager) {
                    AppManager.INSTANCE = parentAppManager;
                }
            }
        }
        return AppManager.INSTANCE;
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
