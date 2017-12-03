module api.heavy {

    export class HeavyOperationsManager {

        private static INSTANCE: HeavyOperationsManager = null;

        private performers: HeavyOperationPerformer[] = [];

        private heavyOperationStartedListeners: ((performer: HeavyOperationPerformer) => void)[] = [];

        private heavyOperationEndedListeners: ((performer: HeavyOperationPerformer) => void)[] = [];

        constructor() {
            HeavyOperationsManager.INSTANCE = this;
        }

        addPerformer(performer: HeavyOperationPerformer) {
            this.performers.push(performer);
        }

        removePerformer(performer: HeavyOperationPerformer) {
            this.performers = this.performers.filter(p => p !== performer);
        }

        isPerforming(): boolean {
            return this.performers.some(p => p.isPerforming());
        }

        onHeavyOperationStarted(listener: (performer: HeavyOperationPerformer) => void) {
            const alreadyHasListener = this.heavyOperationStartedListeners.some(l => l === listener);
            if (!alreadyHasListener) {
                this.heavyOperationStartedListeners.push(listener);
            }
        }

        unHeavyOperationStarted(listener: (performer: HeavyOperationPerformer) => void) {
            this.heavyOperationStartedListeners = this.heavyOperationStartedListeners.filter(l => l !== listener);
        }

        notifyHeavyOperationStarted(performer: HeavyOperationPerformer) {
            this.heavyOperationStartedListeners.forEach(handler => handler(performer));
        }

        onHeavyOperationEnded(listener: (performer: HeavyOperationPerformer) => void) {
            const alreadyHasListener = this.heavyOperationEndedListeners.some(l => l === listener);
            if (!alreadyHasListener) {
                this.heavyOperationEndedListeners.push(listener);
            }
        }

        unHeavyOperationEnded(listener: (performer: HeavyOperationPerformer) => void) {
            this.heavyOperationEndedListeners = this.heavyOperationEndedListeners.filter(l => l !== listener);
        }

        notifyHeavyOperationEnded(performer: HeavyOperationPerformer) {
            this.heavyOperationEndedListeners.forEach(handler => handler(performer));
        }

        clearListeners() {
            this.heavyOperationStartedListeners = [];
            this.heavyOperationEndedListeners = [];
        }

        static instance(): HeavyOperationsManager {
            if (api.heavy.HeavyOperationsManager.INSTANCE) {
                return HeavyOperationsManager.INSTANCE;
            } else if (window !== window.parent) {
                // look for instance in parent frame
                let apiAppModule = (<any> window.parent).api.heavy;
                if (apiAppModule && apiAppModule.HeavyOperationsManager) {
                    let parentHeavyOperationsManager = <api.heavy.HeavyOperationsManager> apiAppModule.HeavyOperationsManager.INSTANCE;
                    if (parentHeavyOperationsManager) {
                        HeavyOperationsManager.INSTANCE = parentHeavyOperationsManager;
                    }
                }
            }
            return new HeavyOperationsManager();
        }
    }
}
