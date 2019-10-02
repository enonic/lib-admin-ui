import {Action} from '../../ui/Action';
import {AppApplication} from '../AppApplication';
import {ShowAppLauncherEvent} from '../ShowAppLauncherEvent';

export class ShowAppLauncherAction
    extends Action {

    constructor(application: AppApplication) {
        super('Start', 'mod+esc', true);

        this.onExecuted(() => {
            new ShowAppLauncherEvent(application).fire(window.parent);
            new ShowAppLauncherEvent(application).fire();
        });
    }
}
