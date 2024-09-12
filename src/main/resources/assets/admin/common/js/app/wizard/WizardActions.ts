import {Action} from '../../ui/Action';

export class WizardActions<T> {

    private actions: Action[];

    private suspendedActions: Action[] = [];

    constructor(...actions: Action[]) {
        this.setActions(...actions);
    }

    setActions(...actions: Action[]) {
        this.actions = actions;
    }

    enableActionsForNew() {
        throw new Error('Must be overridden by inheritors');
    }

    enableActionsForExisting(_existing: T): void | Q.Promise<void> {
        throw new Error('Must be overridden by inheritors');
    }

    getActions(): Action[] {
        return this.actions;
    }

    suspendActions(suspend: boolean = true) {
        if (suspend) {
            this.actions.forEach((action) => {
                if (action.isEnabled()) {
                    this.suspendedActions.push(action);
                    action.setEnabled(false);
                }
            });
        } else {
            this.suspendedActions.forEach(action => action.setEnabled(true));
            this.suspendedActions.length = 0;
        }
    }
}
