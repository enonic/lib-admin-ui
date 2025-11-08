import {IframeEvent} from './IframeEvent';
import {AbstractEventBus} from './AbstractEventBus';

export class IframeEventBus
    extends AbstractEventBus<IframeEvent> {

    private isListening = false;

    private static instance: IframeEventBus;

    private constructor(contextWindow: Window) {
        super(contextWindow);

        if (!this.isListening) {
            this.contextWindow.addEventListener('message', this.handleMessageEvent);
            this.isListening = true;
        }
    }

    static init(contextWindow: Window): IframeEventBus {
        if (IframeEventBus.instance) {
            throw new Error(`IframeEventBus instance already initialized on ${IframeEventBus.instance.contextWindow.location.pathname}`);
        }
        console.info(`Initializing IframeEventBus instance by ${window.location.pathname} on ${contextWindow.location.pathname}`);
        IframeEventBus.instance = new IframeEventBus(contextWindow);
        return IframeEventBus.instance;
    }

    static get(): IframeEventBus {
        if (!IframeEventBus.instance) {
            throw new Error('IframeEventBus instance should be initialized with a contextWindow first');
        }
        return IframeEventBus.instance;
    }

    public fireEvent(event: IframeEvent) {
        this.contextWindow.parent.postMessage({
            eventName: event.getName(),
            detail: event.toMessage()
        }, '*');
    }

    private handleMessageEvent = (event: MessageEvent) => {
        const {eventName, detail} = event.data || {};
        if (!eventName) {
            return;
        }
        //TODO: create event object from detail!
        (this.handlersMap[eventName] || []).forEach(entry => entry.handler(detail));
    };

}
