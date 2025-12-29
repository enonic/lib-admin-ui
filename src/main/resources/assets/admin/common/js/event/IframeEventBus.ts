import {IframeEvent, ClassConstructor} from './IframeEvent';
import {AbstractEventBus, HandlersMapEntry} from './AbstractEventBus';
import {ClassHelper} from '../ClassHelper';

export class IframeEventBus
    extends AbstractEventBus<IframeEvent> {

    private readonly id = new Date().getTime();

    private isListening = false;

    private static instance: IframeEventBus;

    private classRegistry: Record<string, ClassConstructor> = {};

    private constructor(contextWindow: Window) {
        super(contextWindow);

        if (!this.isListening) {
            // listeners are only allowed on our window so we always listen for events here
            window.addEventListener('message', this.handleMessageEvent);
            this.isListening = true;
        }
    }

    setReceiver(receiver: Window) {
        console.info(`[${this.id}] Setting receiver window to`, receiver);
        this.contextWindow = receiver;
    }

    static get(): IframeEventBus {
        if (!IframeEventBus.instance) {
            // initialize with null receiver
            IframeEventBus.instance = new IframeEventBus(null);
        }
        return IframeEventBus.instance;
    }

    public fireEvent(event: IframeEvent) {
        const detail = JSON.stringify(event, this.replacer.bind(this));
        console.info(`[${this.id}] Firing event: ${event.getName()}`, event);
        // post messages are allowed on other windows (parent, child) so we post messages there
        if (!this.contextWindow) {
            throw new Error(`[${this.id}] No receiver window set for IframeEventBus, use setReceiver(window) to set one.`);
        }
        this.contextWindow.postMessage({
            eventName: event.getName(),
            detail: detail
        }, '*');
    }

    public registerClass(fullName: string, instance: any) {
        const constructor = (typeof instance === 'function') ? instance : instance['constructor'];
        console.info(`[${this.id}] Registering class: ${fullName}`);
        this.classRegistry[fullName] = constructor as ClassConstructor;
    }

    onEvent(eventName: string, handler: (event: IframeEvent) => void): HandlersMapEntry<IframeEvent> {
        return super.onEvent(eventName, handler);
    }


    unEvent(eventName: string, handler?: (event: IframeEvent) => void): HandlersMapEntry<IframeEvent>[] {
        return super.unEvent(eventName, handler);
    }

    private handleMessageEvent = (event: MessageEvent) => {
        const {eventName, detail} = event.data || {};
        if (!eventName) {
            return;
        }

        const data = JSON.parse(detail, this.reviver.bind(this));
        console.info(`[${this.id}] Got event: ${eventName}`, data);

        (this.handlersMap[eventName] || []).forEach(entry => entry.handler(data));
    };

    // Function to add type info during serialization
    private replacer(key, value) {

        if (value === null || typeof value !== 'object') {
            return value; // Only process objects
        }

        let fullName = this.getFullName(value);
        if (fullName === 'Object' || fullName === 'Array') {
            return value; // Skip plain objects and arrays
        }

        this.registerClass(fullName, value);
        // Add a custom property to identify the class later
        return {
            __typename: fullName,
            ...value
        };
    }

    // Function to revive objects based on their type
    private reviver(key, value) {
        // Check if the object has our special type property
        if (value && typeof value === 'object' && value.__typename) {
            const typeName = value.__typename;
            delete value.__typename; // Clean up the special property

            const ClassConstructor = this.classRegistry[typeName];
            if (ClassConstructor) {
                // Create a new instance of the class.
                // This simple version assumes properties match constructor args,
                // but Object.assign is more robust.

                if (typeof ClassConstructor.fromObject === 'function') {
                    console.info(`[${this.id}] invoking ${typeName}.fromObject`, value);
                    return ClassConstructor.fromObject(value);
                } else {
                    const newInstance = new ClassConstructor();
                    console.info(`[${this.id}] using constructor for ${typeName}`, value);
                    Object.assign(newInstance, value);
                    return newInstance;
                }
            }
        }
        return value;
    }

    private getFullName(instance: object): string {
        let constructor = (typeof instance === 'function') ? instance : instance['constructor'] as any;
        //last one expression for IE
        return ClassHelper.findPath(this.contextWindow, constructor) || constructor['name'] ||
               constructor.toString().match(/^function\s*([^\s(]+)/)[1];
    }

}
