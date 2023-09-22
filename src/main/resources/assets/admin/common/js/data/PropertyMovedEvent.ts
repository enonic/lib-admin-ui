import {PropertyEvent} from './PropertyEvent';
import {Property} from './Property';
import {PropertyEventType} from './PropertyEventType';

export class PropertyMovedEvent
    extends PropertyEvent {

    private readonly from: number;

    private readonly to: number;

    constructor(property: Property, from: number, to: number) {
        super(PropertyEventType.MOVED, property);
        this.from = from;
        this.to = to;
    }

    getFrom(): number {
        return this.from;
    }

    getTo(): number {
        return this.to;
    }

    toString(): string {
        return '[' + this.from + '] -> [' + this.to + ']';
    }
}
