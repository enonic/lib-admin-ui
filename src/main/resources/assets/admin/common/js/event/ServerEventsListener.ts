module api.event {

    import ServerEventsConnection = api.event.ServerEventsConnection;
    import Application = api.app.Application;
    import Event = api.event.Event;

    export class ServerEventsListener {

        private serverEventsConnection: ServerEventsConnection;

        private applications: Application[];

        constructor(applications: Application[]) {
            this.applications = applications;
            this.serverEventsConnection = ServerEventsConnection.getInstance();
            this.serverEventsConnection.onServerEvent((event: Event) => this.onServerEvent(event));
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

        protected fireEvent(event: Event) {
            this.applications.forEach((application) => {
                let appWindow = application.getWindow();
                if (appWindow) {
                    event.fire(appWindow);
                }
            });
        }

    }
}
