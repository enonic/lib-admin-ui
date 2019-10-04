import {Event} from '../event/Event';
import {ClassHelper} from '../ClassHelper';
import {Application} from './Application';

export class ShowAppLauncherEvent
    extends Event {

    private application: Application;

    private sessionExpired: boolean;

    constructor(application: Application, sessionExpired?: boolean) {
        super();
        this.application = application;
        this.sessionExpired = !!sessionExpired;
    }

    static on(handler: (event: ShowAppLauncherEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    getApplication(): Application {
        return this.application;
    }

    isSessionExpired(): boolean {
        return this.sessionExpired;
    }

}
