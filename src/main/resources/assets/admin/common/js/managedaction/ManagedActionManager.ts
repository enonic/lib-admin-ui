import {ManagedActionState} from './ManagedActionState';
import {ManagedActionExecutor} from './ManagedActionExecutor';
import {Store} from '../store/Store';

export const MANAGED_ACTION_MANAGER_KEY: string = 'ManagedActionManager';

export type StateChangedListener = (state: ManagedActionState, executor: ManagedActionExecutor) => void;

export class ManagedActionManager {

    private static INSTANCE: ManagedActionManager = null;

    private executors: ManagedActionExecutor[] = [];

    private managedActionStateChangedListeners: StateChangedListener[] = [];

    private constructor() {
        ManagedActionManager.INSTANCE = this;
    }

    static instance(): ManagedActionManager {
        let instance: ManagedActionManager = Store.parentInstance().get(MANAGED_ACTION_MANAGER_KEY);

        if (instance == null) {
            instance = new ManagedActionManager();
            Store.parentInstance().set(MANAGED_ACTION_MANAGER_KEY, instance);
        }

        return instance;
    }

    addPerformer(executor: ManagedActionExecutor) {
        this.executors.push(executor);
    }

    removePerformer(executor: ManagedActionExecutor) {
        this.executors = this.executors.filter(p => p !== executor);
    }

    isExecuting(): boolean {
        return this.executors.some(p => p.isExecuting());
    }

    onManagedActionStateChanged(listener: StateChangedListener) {
        const alreadyHasListener = this.managedActionStateChangedListeners.some(l => l === listener);
        if (!alreadyHasListener) {
            this.managedActionStateChangedListeners.push(listener);
        }
    }

    unManagedActionStateChanged(listener: StateChangedListener) {
        this.managedActionStateChangedListeners = this.managedActionStateChangedListeners.filter(l => l !== listener);
    }

    notifyManagedActionStateChanged(state: ManagedActionState, executor: ManagedActionExecutor) {
        this.managedActionStateChangedListeners.forEach(handler => handler(state, executor));
    }
}
