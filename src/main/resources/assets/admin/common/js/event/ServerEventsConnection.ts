import {EventJson} from './EventJson';
import {Event} from './Event';
import {UriHelper} from '../util/UriHelper';
import {NodeEventJson} from './NodeServerEvent';
import {ApplicationEvent, ApplicationEventJson} from '../application/ApplicationEvent';
import {ContentServerEvent} from '../content/event/ContentServerEvent';
import {PrincipalServerEvent} from '../security/event/PrincipalServerEvent';
import {IssueServerEvent} from '../issue/event/IssueServerEvent';
import {RepositoryEvent} from '../content/event/RepositoryEvent';
import {TaskEvent, TaskEventJson} from '../task/TaskEvent';

export class ServerEventsConnection {
    public static debug: boolean = false;
    private static INSTANCE: ServerEventsConnection;
    private static KEEP_ALIVE_TIME: number = 30 * 1000;
    private ws: WebSocket;
    private reconnectInterval: number;
    private serverEventReceivedListeners: { (event: Event): void }[] = [];
    private unknownServerEventReceivedListeners: { (eventJson: EventJson): void }[] = [];
    private connectionLostListeners: { (): void }[] = [];
    private connectionRestoredListeners: { (): void }[] = [];
    private connected: boolean = false;
    private disconnectTimeoutHandle: number;
    private keepConnected: boolean = false;
    private downTime: number;
    private keepAliveIntervalId: number;

    constructor(reconnectIntervalSeconds: number = 5) {
        this.ws = null;
        this.reconnectInterval = reconnectIntervalSeconds * 1000;
    }

    public static getInstance(): ServerEventsConnection {
        if (!ServerEventsConnection.INSTANCE) {
            ServerEventsConnection.INSTANCE = new ServerEventsConnection();
        }

        return ServerEventsConnection.INSTANCE;
    }

    public connect() {
        if (!WebSocket) {
            console.warn('ServerEventsConnection: WebSockets not supported. Server events disabled.');
            return;
        }
        let wsUrl = UriHelper.joinPath(this.getWebSocketUriPrefix(), UriHelper.getAdminUriPrefix(), 'event');
        this.keepConnected = true;
        this.doConnect(wsUrl);
    }

    public disconnect() {
        this.keepConnected = false;
        if (this.ws) {
            this.ws.close();
        }
    }

    public isConnected(): boolean {
        return this.ws.readyState === WebSocket.OPEN;
    }

    onServerEvent(listener: (event: Event) => void) {
        this.serverEventReceivedListeners.push(listener);
    }

    unServerEvent(listener: (event: Event) => void) {
        this.serverEventReceivedListeners =
            this.serverEventReceivedListeners.filter((currentListener: (event: Event) => void) => {
                return currentListener !== listener;
            });
    }

    onUnknownServerEvent(listener: (eventJson: EventJson) => void) {
        this.unknownServerEventReceivedListeners.push(listener);
    }

    unUnknownServerEvent(listener: (eventJson: EventJson) => void) {
        this.unknownServerEventReceivedListeners =
            this.unknownServerEventReceivedListeners.filter((currentListener: (eventJson: EventJson) => void) => {
                return currentListener !== listener;
            });
    }

    onConnectionLost(listener: () => void) {
        this.connectionLostListeners.push(listener);
    }

    unConnectionLost(listener: () => void) {
        this.connectionLostListeners =
            this.connectionLostListeners.filter((currentListener: () => void) => {
                return currentListener !== listener;
            });
    }

    onConnectionRestored(listener: () => void) {
        this.connectionRestoredListeners.push(listener);
    }

    unConnectionRestored(listener: () => void) {
        this.connectionRestoredListeners =
            this.connectionRestoredListeners.filter((currentListener: () => void) => {
                return currentListener !== listener;
            });
    }

    private doConnect(wsUrl: string) {
        this.ws = new WebSocket(wsUrl, 'text');

        this.ws.addEventListener('close', () => {
            clearInterval(this.keepAliveIntervalId);
            if (ServerEventsConnection.debug) {
                let m = 'ServerEventsConnection: connection closed to ' + wsUrl;
                if (this.downTime > 0) {
                    m += '\nUptime: ' + (new Date().getTime() - this.downTime);
                }
                console.warn(m);
                this.downTime = new Date().getTime();
            }
            this.disconnectTimeoutHandle = setTimeout(() => {
                if (this.connected) {
                    if (this.keepConnected) {
                        this.notifyConnectionLost();
                    }
                    this.connected = !this.connected;
                }
            }, this.reconnectInterval + 1000);

            // attempt to reconnect
            if (this.keepConnected) {
                setTimeout(() => {
                    if (this.keepConnected) {
                        this.doConnect(wsUrl);
                    }
                }, this.reconnectInterval);
            }
        });

        this.ws.addEventListener('error', (ev: ErrorEvent) => {
            if (ServerEventsConnection.debug) {
                console.error('ServerEventsConnection: Unable to connect to server web socket on ' + wsUrl, ev);
            }
        });

        this.ws.addEventListener('message', (remoteEvent: any) => {
            let jsonEvent = <NodeEventJson> JSON.parse(remoteEvent.data);
            if (ServerEventsConnection.debug) {
                console.debug('ServerEventsConnection: Server event [' + jsonEvent.type + ']', jsonEvent);
            }
            this.handleServerEvent(jsonEvent);
        });

        this.ws.addEventListener('open', () => {
            if (ServerEventsConnection.debug) {
                let m = 'ServerEventsConnection: connection opened to ' + wsUrl;
                if (this.downTime > 0) {
                    m += '\nDowntime: ' + (new Date().getTime() - this.downTime);
                }
                console.log(m);
                this.downTime = new Date().getTime();
            }
            clearTimeout(this.disconnectTimeoutHandle);
            this.keepAliveIntervalId = setInterval(() => {
                if (this.connected) {
                    this.ws.send('KeepAlive');
                    if (ServerEventsConnection.debug) {
                        console.log('ServerEventsConnection: Sending Keep Alive message');
                    }
                }
            }, ServerEventsConnection.KEEP_ALIVE_TIME);
            if (!this.connected) {
                this.notifyConnectionRestored();
                this.connected = !this.connected;
            }
        });
    }

    private handleServerEvent(eventJson: NodeEventJson): void {
        const clientEvent: Event = this.translateServerEvent(eventJson);

        if (clientEvent) {
            this.notifyServerEvent(clientEvent);
        } else {
            this.notifyUnknownEvent(eventJson);
        }
    }

    private translateServerEvent(eventJson: EventJson): Event {
        const eventType = eventJson.type;

        if (eventType === 'application') {
            return ApplicationEvent.fromJson(<ApplicationEventJson>eventJson);
        }
        if (eventType.indexOf('node.') === 0) {
            let event;
            if (ContentServerEvent.is(<NodeEventJson>eventJson)) {
                event = ContentServerEvent.fromJson(<NodeEventJson>eventJson);
            }

            if (PrincipalServerEvent.is(<NodeEventJson>eventJson)) {
                event = PrincipalServerEvent.fromJson(<NodeEventJson>eventJson);
            }

            if (IssueServerEvent.is(<NodeEventJson>eventJson)) {
                event = IssueServerEvent.fromJson(<NodeEventJson>eventJson);
            }

            if (event && event.getNodeChange()) {
                return event;
            }
        }
        if (eventType.indexOf('repository.') === 0) {
            return RepositoryEvent.fromJson(eventJson);
        }
        if (eventType.indexOf('task.') === 0) {
            return TaskEvent.fromJson(<TaskEventJson>eventJson);
        }

        return null;
    }

    private getWebSocketUriPrefix(): string {
        let loc = window.location;
        let newUri;
        if (loc.protocol === 'https:') {
            newUri = 'wss:';
        } else {
            newUri = 'ws:';
        }
        newUri += '//' + loc.host;
        return newUri;
    }

    private notifyServerEvent(serverEvent: Event) {
        this.serverEventReceivedListeners.forEach((listener: (event: Event) => void) => {
            listener.call(this, serverEvent);
        });
    }

    private notifyUnknownEvent(eventJson: EventJson) {
        this.unknownServerEventReceivedListeners.forEach((listener: (eventJson: EventJson) => void) => {
            listener.call(this, eventJson);
        });
    }

    private notifyConnectionLost() {
        this.connectionLostListeners.forEach((listener: (event: any) => void) => {
            listener.call(this);
        });
    }

    private notifyConnectionRestored() {
        this.connectionRestoredListeners.forEach((listener: (event: any) => void) => {
            listener.call(this);
        });
    }

}
