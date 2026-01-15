import {IframeEvent, ClassConstructor} from './IframeEvent';
import {AbstractEventBus, HandlersMapEntry} from './AbstractEventBus';
import {ClassHelper} from '../ClassHelper';

export class IframeEventBus
    extends AbstractEventBus<IframeEvent> {

    private isListening = false;

    private static instance: IframeEventBus;

    private classRegistry: Record<string, ClassConstructor> = {};

    private constructor(contextWindow: Window = window) {
        super(contextWindow);

        if (!this.isListening) {
            // listeners are only allowed on our window so we always listen for events here
            window.addEventListener('message', this.handleMessageEvent);
            this.isListening = true;
        }
    }

    static get(receiver?: Window): IframeEventBus {
        if (!IframeEventBus.instance) {
            // initialize with null receiver
            IframeEventBus.instance = new IframeEventBus(receiver);
        } else if (receiver && !IframeEventBus.instance.hasReceiver(receiver)) {
            console.warn('IframeEventBus instance already exists with different receiver, use addReceiver(window) to add a new one.');
        }
        return IframeEventBus.instance;
    }

    public fireEvent(event: IframeEvent) {
        console.log(`[${this.id}] Fire event: ${event.getName()}`, event);
        // post messages are allowed on other windows (parent, child) so we post messages there
        if (!this.receivers.length) {
            throw new Error(`[${this.id}] No receivers set for IframeEventBus, use addReceiver(window) to set one.`);
        }
        this.receivers.forEach(receiver => {
            const detail = JSON.stringify(event, this.replacer.bind(this, receiver));
            receiver.postMessage({
                eventName: event.getName(),
                detail: detail
            }, '*');
        });
    }

    public registerClass(fullName: string, instance: any) {
        const constructor = (typeof instance === 'function') ? instance : instance['constructor'];
        console.debug(`[${this.id}] Registering class: ${fullName}`);
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
        console.log(`[${this.id}] Got event: ${eventName}`, data);

        (this.handlersMap[eventName] || []).forEach(entry => entry.handler(data));
    };

    // Function to add type info during serialization
    private replacer(receiver: Window, key, value) {

        if (value === null || typeof value !== 'object') {
            return value; // Only process objects
        }

        let fullName = this.getFullName(value, receiver);
        if (fullName === 'Object' || fullName === 'Array') {
            return value; // Skip plain objects and arrays
        }

        if (!this.classRegistry[fullName]) {
            // Register the class if not already registered for revival
            this.registerClass(fullName, value);
        }

        let str: string | undefined;
        if (typeof value.toString === 'function') {
            str = value.toString();
            // make sure it's not the default toString output
            if (str === '[object Object]' || str === '[object Array]') {
                str = undefined;
            }
        }

        // Add a custom property to identify the class later
        return {
            __typename: fullName,
            __stringvalue: str,
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

                if (typeof ClassConstructor.fromString === 'function') {
                    const stringValue = value.__stringvalue;
                    if (stringValue !== undefined) {
                        delete value.__stringvalue;
                        console.debug(`[${this.id}] invoking ${typeName}.fromString`, stringValue);
                        return ClassConstructor.fromString(stringValue);
                    }
                } else if (typeof ClassConstructor.fromObject === 'function') {
                    console.debug(`[${this.id}] invoking ${typeName}.fromObject`, value);
                    return ClassConstructor.fromObject(value);
                } else {
                    const newInstance = new ClassConstructor();
                    console.debug(`[${this.id}] using constructor for ${typeName}`, value);
                    Object.assign(newInstance, value);
                    return newInstance;
                }
            } else {
                console.warn(`[${this.id}] Constructor for [${typeName}] not found`);
            }
        }
        return value;
    }

    private getFullName(instance: object, receiver: Window): string {
        let constructor = (typeof instance === 'function') ? instance : instance['constructor'] as any;
        //last one expression for IE
        return ClassHelper.findPath(receiver, constructor) || constructor['name'] ||
               constructor.toString().match(/^function\s*([^\s(]+)/)[1];
    }

}
