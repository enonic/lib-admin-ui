import {ServerEventsConnection} from './ServerEventsConnection';
import {Application} from '../app/Application';
import {Event} from './Event';
import {EventJson} from './EventJson';
import {ServerEventsTranslator} from './ServerEventsTranslator';

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

    setServerEventsTranslator(serverEventsTranslator: ServerEventsTranslator) {
        this.serverEventsConnection.setServerEventsTranslator(serverEventsTranslator);
    }

    onConnectionLost(listener: () => void) {
        this.serverEventsConnection.onDisconnected(listener);
    }

    unConnectionLost(listener: () => void) {
        this.serverEventsConnection.unDisconnected(listener);
    }

    onConnectionRestored(listener: () => void) {
        this.serverEventsConnection.onConnected(listener);
    }

    unConnectionRestored(listener: () => void) {
        this.serverEventsConnection.unConnected(listener);
    }

    onConnectionError(listener: () => void) {
        this.serverEventsConnection.onConnectionError(listener);
    }

    unConnectionError(listener: () => void) {
        this.serverEventsConnection.unConnectionError(listener);
    }

    protected onServerEvent(event: Event) {
        this.fireEvent(event);
    }

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
