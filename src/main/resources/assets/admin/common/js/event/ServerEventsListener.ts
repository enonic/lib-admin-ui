import {ServerEventsConnection} from './ServerEventsConnection';
import {Application} from '../app/Application';
import {Event} from './Event';
import {EventJson} from './EventJson';

export class ServerEventsListener {

    private serverEventsConnection: ServerEventsConnection;

    private applications: Application[];

    constructor(applications: Application[]) {
        this.applications = applications;
        this.serverEventsConnection = ServerEventsConnection.get();
        this.serverEventsConnection.onServerEvent((event: Event) => this.onServerEvent(event));
        this.serverEventsConnection.onUnknownServerEvent((eventJson: EventJson) => this.onUnknownServerEvent(eventJson));
    }

    getApplications(): Application[] {
        return this.applications;
    }

    start() {
        this.serverEventsConnection.connect();
    }

    stop() {
        this.serverEventsConnection.disconnect();
    }

    onConnectionLost(listener: () => void) {
        this.serverEventsConnection.onConnectionLost(listener);
    }

    unConnectionLost(listener: () => void) {
        this.serverEventsConnection.unConnectionLost(listener);
    }

    onConnectionRestored(listener: () => void) {
        this.serverEventsConnection.onConnectionRestored(listener);
    }

    unConnectionRestored(listener: () => void) {
        this.serverEventsConnection.unConnectionRestored(listener);
    }

    protected onServerEvent(event: Event) {
        this.fireEvent(event);
    }

    // tslint:disable-next-line:no-unused-expression
    protected onUnknownServerEvent(_eventJson: EventJson) {
        //
    }

    protected fireEvent(event: Event) {
        this.applications.forEach((application) => {
            let appWindow = application.getWindow();
            if (appWindow) {
                event.fire(appWindow);
            }
        });
    }

}
