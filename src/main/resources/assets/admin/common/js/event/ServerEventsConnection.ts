import {EventJson} from './EventJson';
import {Event} from './Event';
import {UriHelper} from '../util/UriHelper';
import {NodeEventJson} from './NodeServerEvent';
import {Store} from '../store/Store';
import {ServerEventsTranslator} from './ServerEventsTranslator';

export const SERVER_EVENTS_CONNECTION_KEY: string = 'ServerEventsConnection';

export class ServerEventsConnection {

    private static KEEP_ALIVE_TIME: number = 30 * 1000;

    private ws: WebSocket;

    readonly reconnectInterval: number;

    private reconnectIntervalId: number;

    private keepAliveIntervalId: number;

    private serverEventReceivedListeners: { (event: Event): void }[] = [];

    private unknownServerEventReceivedListeners: { (eventJson: EventJson): void }[] = [];

    private disconnectedListeners: { (): void }[] = [];

    private connectedListeners: { (): void }[] = [];

    private connectionErrorListeners: { (): void }[] = [];

    private keepConnected: boolean = false;

    private stateChangeTime: number;

    private serverEventsTranslator: ServerEventsTranslator;

    private connectionState: CONNECTION_STATE = CONNECTION_STATE.NOT_ESTABLISHED;

    public debug: boolean = false;

    private constructor(reconnectIntervalSeconds: number = 5) {
        this.ws = null;
        this.reconnectInterval = reconnectIntervalSeconds * 1000;
        this.serverEventsTranslator = new ServerEventsTranslator();
    }

    static get(): ServerEventsConnection {
        let instance: ServerEventsConnection = Store.parentInstance().get(SERVER_EVENTS_CONNECTION_KEY);

        if (instance == null) {
            instance = new ServerEventsConnection();
            Store.parentInstance().set(SERVER_EVENTS_CONNECTION_KEY, instance);
        }

        return instance;
    }

    setServerEventsTranslator(serverEventsTranslator: ServerEventsTranslator) {
        this.serverEventsTranslator = serverEventsTranslator;
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
            this.unknownServerEventReceivedListeners.filter((currentListener: (eventJson: EventJson) => void) => currentListener !== listener);
    }

    onDisconnected(listener: () => void) {
        this.disconnectedListeners.push(listener);
    }

    unDisconnected(listener: () => void) {
        this.disconnectedListeners =
            this.disconnectedListeners.filter((currentListener: () => void) => currentListener !== listener);
    }

    onConnected(listener: () => void) {
        this.connectedListeners.push(listener);
    }

    unConnected(listener: () => void) {
        this.connectedListeners =
            this.connectedListeners.filter((currentListener: () => void) => currentListener !== listener);
    }

    onConnectionError(listener: () => void) {
        this.connectionErrorListeners.push(listener);
    }

    unConnectionError(listener: () => void) {
        this.connectionErrorListeners =
            this.connectionErrorListeners.filter((currentListener: () => void) => currentListener !== listener);
    }

    private doConnect(wsUrl: string) {
        this.ws = new WebSocket(wsUrl, 'text');

        this.ws.addEventListener('close', () => {
            clearInterval(this.keepAliveIntervalId);
            if (this.debug) {
                let m = 'ServerEventsConnection: connection closed to ' + wsUrl;
                if (this.isConnected() && this.stateChangeTime > 0) {
                    m += '\nUptime: ' + (new Date().getTime() - this.stateChangeTime);
                }
                console.warn(m);
            }

            if (this.connectionState === CONNECTION_STATE.NOT_ESTABLISHED) {
                if (this.debug) {
                    console.warn('Error establishing WS connection');
                }
            }

            this.reconnectIntervalId = setTimeout(() => {
                if (this.isConnected()) {
                    if (this.keepConnected) {
                        this.notifyDisconnected();
                    }
                    if (this.connectionState === CONNECTION_STATE.ESTABLISHED ||
                        this.connectionState === CONNECTION_STATE.RESTORED) {
                            this.connectionState = CONNECTION_STATE.LOST;
                        this.stateChangeTime = new Date().getTime();
                    }
                }
                if (this.debug) {
                    console.log('Checking reconnect status. Connection state: ', CONNECTION_STATE[this.connectionState].toString());
                }
            }, this.reconnectInterval + 1000);

            // attempt to reconnect
            if (this.keepConnected) {
                setTimeout(() => {
                    if (this.keepConnected) {
                        if (this.debug) {
                            console.log('Trying to reconnect...');
                        }
                        this.doConnect(wsUrl);
                    }
                }, this.reconnectInterval);
            }
        });

        this.ws.addEventListener('error', (ev: ErrorEvent) => {
            if (this.debug) {
                console.error('ServerEventsConnection: Unable to connect to server web socket on ' + wsUrl, ev);
            }
            this.notifyConnectionError();
        });

        this.ws.addEventListener('message', (remoteEvent: any) => {
            let jsonEvent = <NodeEventJson> JSON.parse(remoteEvent.data);
            if (this.debug) {
                console.debug('ServerEventsConnection: Server event [' + jsonEvent.type + ']', jsonEvent);
            }
            this.handleServerEvent(jsonEvent);
        });

        this.ws.addEventListener('open', () => {
            if (this.debug) {
                let m = 'ServerEventsConnection: connection opened to ' + wsUrl;
                if (this.stateChangeTime > 0) {
                    m += '\nDowntime: ' + (new Date().getTime() - this.stateChangeTime);
                    this.stateChangeTime = 0;
                }
                console.log(m);
            }
            clearTimeout(this.reconnectIntervalId);
            this.keepAliveIntervalId = setInterval(() => {
                if (this.isConnected()) {
                    this.ws.send('KeepAlive');
                    if (this.debug) {
                        console.log('ServerEventsConnection: Sending Keep Alive message');
                    }
                }
            }, ServerEventsConnection.KEEP_ALIVE_TIME);
            if (!this.isConnected()) {
                if (this.connectionState === CONNECTION_STATE.NOT_ESTABLISHED || this.connectionState === CONNECTION_STATE.LOST) {
                    this.notifyConnected();
                    this.stateChangeTime = new Date().getTime();
                }
                if (this.connectionState === CONNECTION_STATE.NOT_ESTABLISHED) {
                    this.connectionState = CONNECTION_STATE.ESTABLISHED;
                }
                else if (this.connectionState === CONNECTION_STATE.LOST) {
                    this.connectionState = CONNECTION_STATE.RESTORED;
                }
            }
            if (this.debug) {
                console.log('Connection state: ', CONNECTION_STATE[this.connectionState].toString());
            }
        });
    }

    private handleServerEvent(eventJson: NodeEventJson): void {
        const clientEvent: Event = this.serverEventsTranslator.translateServerEvent(eventJson);

        if (clientEvent) {
            this.notifyServerEvent(clientEvent);
        } else {
            this.notifyUnknownEvent(eventJson);
        }
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

    private isConnected(): boolean {
        return this.connectionState === CONNECTION_STATE.ESTABLISHED || this.connectionState === CONNECTION_STATE.RESTORED;
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

    private notifyDisconnected() {
        this.disconnectedListeners.forEach((listener: (event: any) => void) => {
            listener.call(this);
        });
    }

    private notifyConnected() {
        this.connectedListeners.forEach((listener: (event: any) => void) => {
            listener.call(this);
        });
    }

}
