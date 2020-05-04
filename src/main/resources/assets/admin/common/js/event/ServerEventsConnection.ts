import {EventJson} from './EventJson';
import {Event} from './Event';
import {UriHelper} from '../util/UriHelper';
import {NodeEventJson} from './NodeServerEvent';
import {Store} from '../store/Store';
import {ServerEventsTranslator} from './ServerEventsTranslator';

export const SERVER_EVENTS_CONNECTION_KEY: string = 'ServerEventsConnection';

enum CONNECTION_STATE {
    NOT_ESTABLISHED,
    ESTABLISHED,
    LOST,
    RESTORED
}

export class ServerEventsConnection {

    private static KEEP_ALIVE_TIME: number = 30 * 1000;

    private ws: WebSocket;

    private wsUrl: string;

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

        this.wsUrl = UriHelper.joinPath(this.getWebSocketUriPrefix(), UriHelper.getAdminUriPrefix(), 'event');
        this.keepConnected = true;

        this.doConnect();
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
            this.unknownServerEventReceivedListeners.filter(
                (currentListener: (eventJson: EventJson) => void) => currentListener !== listener
            );
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

    private doConnect() {
        this.ws = new WebSocket(this.wsUrl, 'text');

        this.ws.addEventListener('close', this.handleWSClose.bind(this));
        this.ws.addEventListener('error', this.handleWSError.bind(this));
        this.ws.addEventListener('message', this.handleWSMessage.bind(this));
        this.ws.addEventListener('open', this.handleWSOpen.bind(this));
    }

    private handleWSClose() {
        clearInterval(this.keepAliveIntervalId);

        if (this.debug) {
            let m: string = 'ServerEventsConnection: connection closed to ' + this.wsUrl;

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

                this.connectionState = CONNECTION_STATE.LOST;
                this.stateChangeTime = new Date().getTime();
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
                    this.doConnect();
                }
            }, this.reconnectInterval);
        }
    }

    private handleWSError(ev: ErrorEvent) {
        if (this.debug) {
            console.error('ServerEventsConnection: Unable to connect to server web socket on ' + this.wsUrl, ev);
        }

        this.notifyConnectionError();
    }

    private handleWSMessage(remoteEvent: any) {
        const jsonEvent: NodeEventJson = <NodeEventJson>JSON.parse(remoteEvent.data);

        if (this.debug) {
            console.debug('ServerEventsConnection: Server event [' + jsonEvent.type + ']', jsonEvent);
        }

        this.handleServerEvent(jsonEvent);
    }

    private handleWSOpen() {
        if (this.debug) {
            let m: string = 'ServerEventsConnection: connection opened to ' + this.wsUrl;

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
            this.notifyConnected();
            this.stateChangeTime = new Date().getTime();

            if (this.connectionState === CONNECTION_STATE.NOT_ESTABLISHED) {
                this.connectionState = CONNECTION_STATE.ESTABLISHED;
            } else if (this.connectionState === CONNECTION_STATE.LOST) {
                this.connectionState = CONNECTION_STATE.RESTORED;
            }
        }

        if (this.debug) {
            console.log('Connection state: ', CONNECTION_STATE[this.connectionState].toString());
        }
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
        const loc: Location = window.location;
        const prefix: string = loc.protocol === 'https:' ? 'wss:' : 'ws:';

        return `${prefix}//${loc.host}`;
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

    private notifyConnectionError() {
        this.connectionErrorListeners.forEach((listener: (event: any) => void) => {
            listener.call(this);
        });
    }
}
