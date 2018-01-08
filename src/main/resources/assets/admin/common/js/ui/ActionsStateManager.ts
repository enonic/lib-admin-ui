module api.ui {

    export type ActionsState = {
        [key: string]: boolean
    };

    export type ActionsMap = {
        [key: string]: Action
    };

    export class ActionsStateManager {

        private actions: ActionsMap;

        private stashedActionsState: ActionsState;

        constructor(actions: ActionsMap) {
            this.actions = actions;
            this.stashedActionsState = {};
        }

        public stashAction(name: string, state?: boolean) {
            const action = this.actions[name];
            if (action) {
                this.stashedActionsState[name] = action.isEnabled();
                if (state != null) {
                    action.setEnabled(state);
                }
            }
        }

        public unstashAction(name: string) {
            const state = this.stashedActionsState[name];
            if (state != null) {
                this.stashedActionsState[name] = null;
                this.actions[name].setEnabled(state);
            }
        }

        public stashActions(actionsMap: ActionsMap, state?: boolean) {
            for (const name of Object.keys(actionsMap)) {
                this.stashAction(name, state);
            }
        }

        public stashActionsByName(names: string[], state?: boolean) {
            names.forEach(name => this.stashAction(name, state));
        }

        public unstashActions(actionsMap: ActionsMap) {
            for (const name of Object.keys(actionsMap)) {
                this.unstashAction(name);
            }
        }

        public unstashActionsByName(names: string[]) {
            names.forEach(name => this.unstashAction(name));
        }

        public enableAction(name: string, state: boolean) {
            const isStashed = this.stashedActionsState[name] != null;
            const hasAction = this.actions[name] != null;

            if (isStashed) {
                this.stashedActionsState[name] = !!state;
            } else if (hasAction) {
                this.actions[name].setEnabled(!!state);
            }
        }

        public enableActions(actionsState: ActionsState) {
            for(const key of Object.keys(actionsState)) {
                this.enableAction(key, actionsState[key]);
            }
        }

        public isActionEnabled(name: string): boolean {
            const isStashed = this.stashedActionsState[name] != null;
            const hasAction = this.actions[name] != null;

            if (isStashed) {
                return this.stashedActionsState[name];
            } else if (hasAction) {
                return this.actions[name].isEnabled();
            }
            return false;
        }
    }
}
