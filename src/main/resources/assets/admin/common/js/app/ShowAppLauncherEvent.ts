import {Event} from '../event/Event';
import {ClassHelper} from '../ClassHelper';
import {AppApplication} from './AppApplication';

export class ShowAppLauncherEvent
    extends Event {

    private application: AppApplication;

    private sessionExpired: boolean;

    constructor(application: AppApplication, sessionExpired?: boolean) {
        super();
        this.application = application;
        this.sessionExpired = !!sessionExpired;
    }

    static on(handler: (event: ShowAppLauncherEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    getApplication(): AppApplication {
        return this.application;
    }

    isSessionExpired(): boolean {
        return this.sessionExpired;
    }

}
