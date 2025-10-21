import {IframeEvent} from './IframeEvent';
import {AbstractEventBus} from './AbstractEventBus';

export class IframeEventBus
    extends AbstractEventBus<IframeEvent> {

    private isListening = false;

    private static instance: IframeEventBus;

    private constructor(contextWindow: Window) {
        super(contextWindow);
        this.ensureListener();
    }

    static get(contextWindow: Window = window): IframeEventBus {
        if (!IframeEventBus.instance) {
            IframeEventBus.instance = new IframeEventBus(contextWindow);
        } else if (IframeEventBus.instance.contextWindow !== contextWindow) {
            throw new Error('IframeEventBus instance already created with a different contextWindow');
        }
        return IframeEventBus.instance;
    }

    public fireEvent(event: IframeEvent) {
        this.contextWindow.parent.postMessage({
            eventName: event.getName(),
            detail: event
        }, '*');
    }

    private ensureListener() {
        if (!this.isListening) {
            this.contextWindow.addEventListener('message', this.handleMessageEvent);
            this.isListening = true;
        }
    }

    private handleMessageEvent = (event: MessageEvent) => {
        const {eventName, detail} = event.data || {};
        if (!eventName) {
            return;
        }
        (this.handlersMap[eventName] || []).forEach(entry => entry.handler(detail));
    };

}
