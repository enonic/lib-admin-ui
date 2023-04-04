import {assertNotNull} from '../util/Assert';
import {i18n} from '../util/Messages';

enum CONNECTION_STATE {
    NOT_ESTABLISHED,
    ESTABLISHED,
    LOST,
    RESTORED
}

export class WebSocketConnection {

    private ws: WebSocket;

    private readonly wsUrl: string;

    private readonly protocols: string[];

    private readonly reconnectInterval: number;

    private readonly keepAliveTime: number;

    private reconnectIntervalId: number;

    private keepAliveIntervalId: number;

    private disconnectedListeners: { (): void }[] = [];

    private connectedListeners: { (): void }[] = [];

    private connectionErrorListeners: { (): void }[] = [];

    private keepConnected: boolean = false;

    private stateChangeTime: number;

    private connectionState: CONNECTION_STATE = CONNECTION_STATE.NOT_ESTABLISHED;

    public debug: boolean = false;

    constructor(builder: WebSocketConnectionBuilder) {
        assertNotNull(builder.url, i18n('connection.websocket.url.missing'));

        this.wsUrl = builder.url;
        this.protocols = builder.protocols || [];
        this.reconnectInterval = builder.reconnectInterval || 5 * 1000;
        this.keepAliveTime = builder.keepAliveTime || 30 * 1000;
    }

    public connect(): void {
        if (!WebSocket) {
            console.warn('WebSocketConnection: WebSockets not supported. Server events disabled.');
            return;
        }

        this.keepConnected = true;

        this.doConnect();
    }

    public disconnect(): void {
        this.keepConnected = false;

        if (this.ws) {
            this.ws.close();
        }
    }

    onDisconnected(listener: () => void): void {
        this.disconnectedListeners.push(listener);
    }

    unDisconnected(listener: () => void): void {
        this.disconnectedListeners =
            this.disconnectedListeners.filter((currentListener: () => void) => currentListener !== listener);
    }

    onConnected(listener: () => void): void {
        this.connectedListeners.push(listener);
    }

    unConnected(listener: () => void): void {
        this.connectedListeners =
            this.connectedListeners.filter((currentListener: () => void) => currentListener !== listener);
    }

    onConnectionError(listener: () => void): void {
        this.connectionErrorListeners.push(listener);
    }

    unConnectionError(listener: () => void): void {
        this.connectionErrorListeners =
            this.connectionErrorListeners.filter((currentListener: () => void) => currentListener !== listener);
    }

    private doConnect(): void {
        this.ws = new WebSocket(this.wsUrl, this.protocols);

        this.ws.addEventListener('close', this.handleWSClose.bind(this));
        this.ws.addEventListener('error', this.handleWSError.bind(this));
        this.ws.addEventListener('message', this.handleWSMessage.bind(this));
        this.ws.addEventListener('open', this.handleWSOpen.bind(this));
    }

    protected handleWSClose(): void {
        clearInterval(this.keepAliveIntervalId);

        if (this.debug) {
            let m: string = 'WebSocketConnection: connection closed to ' + this.wsUrl;

            if (this.isConnected() && this.stateChangeTime > 0) {
                m += '\nUptime: ' + (new Date().getTime() - this.stateChangeTime);
            }

            console.warn(m);

            if (this.connectionState === CONNECTION_STATE.NOT_ESTABLISHED) {
                console.warn('Error establishing WS connection');
            }
        }

        this.reconnectIntervalId = window.setTimeout(() => {
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

    protected handleWSError(ev: ErrorEvent): void {
        if (this.debug) {
            console.error('WebSocketConnection: Unable to connect to server web socket on ' + this.wsUrl, ev);
        }

        this.notifyConnectionError();
    }

    protected handleWSMessage(wsMessage: MessageEvent): void {
        if (this.debug) {
            console.debug('WebSocketConnection: WebSocket message ', wsMessage);
        }
    }

    protected handleWSOpen(): void {
        if (this.debug) {
            let m: string = 'WebSocketConnection: connection opened to ' + this.wsUrl;

            if (this.stateChangeTime > 0) {
                m += '\nDowntime: ' + (new Date().getTime() - this.stateChangeTime);
                this.stateChangeTime = 0;
            }

            console.log(m);
        }

        clearTimeout(this.reconnectIntervalId);

        this.keepAliveIntervalId = window.setInterval(() => {
            if (this.isConnected()) {
                this.ws.send('KeepAlive');

                if (this.debug) {
                    console.log('WebSocketConnection: Sending Keep Alive message');
                }
            }
        }, this.keepAliveTime);

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

    static getWebSocketUriPrefix(): string {
        const loc: Location = window.location;
        const prefix: string = loc.protocol === 'https:' ? 'wss:' : 'ws:';

        return `${prefix}//${loc.host}`;
    }

    isConnected(): boolean {
        return this.connectionState === CONNECTION_STATE.ESTABLISHED || this.connectionState === CONNECTION_STATE.RESTORED;
    }

    private notifyDisconnected(): void {
        this.disconnectedListeners.forEach((listener: (event: any) => void) => {
            listener.call(this);
        });
    }

    private notifyConnected(): void {
        this.connectedListeners.forEach((listener: (event: any) => void) => {
            listener.call(this);
        });
    }

    private notifyConnectionError(): void {
        this.connectionErrorListeners.forEach((listener: (event: any) => void) => {
            listener.call(this);
        });
    }

    public static create(): WebSocketConnectionBuilder {
        return new WebSocketConnectionBuilder();
    }
}

export class WebSocketConnectionBuilder {

    url: string;

    reconnectInterval: number;

    keepAliveTime: number;

    protocols: string[] = [];

    setUrl(value: string): WebSocketConnectionBuilder {
        this.url = value;
        return this;
    }

    setReconnectIntervalMilliSeconds(value: number): WebSocketConnectionBuilder {
        this.reconnectInterval = value;
        return this;
    }

    setReconnectIntervalSeconds(value: number): WebSocketConnectionBuilder {
        this.reconnectInterval = value * 1000;
        return this;
    }

    setKeepAliveTimeMilliSeconds(value: number): WebSocketConnectionBuilder {
        this.keepAliveTime = value;
        return this;
    }

    setKeepAliveTimeSeconds(value: number): WebSocketConnectionBuilder {
        this.keepAliveTime = value * 1000;
        return this;
    }

    addProtocol(value: string): WebSocketConnectionBuilder {
        this.protocols.push(value);
        return this;
    }

    setProtocols(value: string[]): WebSocketConnectionBuilder {
        this.protocols = value;
        return this;
    }

    build(): WebSocketConnection {
        return new WebSocketConnection(this);
    }
}
