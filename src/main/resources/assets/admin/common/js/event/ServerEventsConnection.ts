import {EventJson} from './EventJson';
import {Event} from './Event';
import {UriHelper} from '../util/UriHelper';
import {NodeEventJson} from './NodeServerEvent';
import {Store} from '../store/Store';
import {ServerEventsTranslator} from './ServerEventsTranslator';
import {WebSocketConnection, WebSocketConnectionBuilder} from '../connection/WebSocketConnection';

export const SERVER_EVENTS_CONNECTION_KEY: string = 'ServerEventsConnection';

export class ServerEventsConnection extends WebSocketConnection {

    private serverEventReceivedListeners: { (event: Event): void }[] = [];

    private unknownServerEventReceivedListeners: { (eventJson: EventJson): void }[] = [];

    private serverEventsTranslator: ServerEventsTranslator;

    private constructor(builder: WebSocketConnectionBuilder) {
        super(builder);

        this.serverEventsTranslator = new ServerEventsTranslator();
    }

    static get(): ServerEventsConnection {
        let instance: ServerEventsConnection = Store.parentInstance().get(SERVER_EVENTS_CONNECTION_KEY);

        if (instance == null) {
            const builder: WebSocketConnectionBuilder = WebSocketConnection.create()
                .setUrl(UriHelper.joinPath(this.getWebSocketUriPrefix(), UriHelper.getAdminUriPrefix(), 'event'))
                .addProtocol('text')
                .setReconnectIntervalSeconds(5)
                .setKeepAliveTimeSeconds(30);

            instance = new ServerEventsConnection(builder);
            Store.parentInstance().set(SERVER_EVENTS_CONNECTION_KEY, instance);
        }

        return instance;
    }

    setServerEventsTranslator(serverEventsTranslator: ServerEventsTranslator): void {
        this.serverEventsTranslator = serverEventsTranslator;
    }

    onServerEvent(listener: (event: Event) => void): void {
        this.serverEventReceivedListeners.push(listener);
    }

    unServerEvent(listener: (event: Event) => void): void{
        this.serverEventReceivedListeners =
            this.serverEventReceivedListeners.filter((currentListener: (event: Event) => void) => {
                return currentListener !== listener;
            });
    }

    onUnknownServerEvent(listener: (eventJson: EventJson) => void): void {
        this.unknownServerEventReceivedListeners.push(listener);
    }

    unUnknownServerEvent(listener: (eventJson: EventJson) => void): void {
        this.unknownServerEventReceivedListeners =
            this.unknownServerEventReceivedListeners.filter(
                (currentListener: (eventJson: EventJson) => void) => currentListener !== listener
            );
    }

    protected handleWSMessage(remoteEvent: MessageEvent): void {
        const jsonEvent: NodeEventJson = <NodeEventJson>JSON.parse(remoteEvent.data);

        if (this.debug) {
            console.debug('ServerEventsConnection: Server event [' + jsonEvent.type + ']', jsonEvent);
        }

        this.handleServerEvent(jsonEvent);
    }

    private handleServerEvent(eventJson: NodeEventJson): void {
        const clientEvent: Event = this.serverEventsTranslator.translateServerEvent(eventJson);

        if (clientEvent) {
            this.notifyServerEvent(clientEvent);
        } else {
            this.notifyUnknownEvent(eventJson);
        }
    }

    private notifyServerEvent(serverEvent: Event): void {
        this.serverEventReceivedListeners.forEach((listener: (event: Event) => void) => {
            listener.call(this, serverEvent);
        });
    }

    private notifyUnknownEvent(eventJson: EventJson): void {
        this.unknownServerEventReceivedListeners.forEach((listener: (eventJson: EventJson) => void) => {
            listener.call(this, eventJson);
        });
    }
}
