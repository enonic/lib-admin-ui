import {PropertyEvent} from './PropertyEvent';
import {Value} from './Value';
import {Property} from './Property';
import {PropertyEventType} from './PropertyEventType';

export class PropertyValueChangedEvent
    extends PropertyEvent {

    private readonly previousValue: Value;

    private readonly newValue: Value;

    private readonly force: boolean;

    constructor(property: Property, previousValue: Value, newValue: Value, force: boolean = false) {
        super(PropertyEventType.VALUE_CHANGED, property);
        this.previousValue = previousValue;
        this.newValue = newValue;
        this.force = force;
    }

    getPreviousValue(): Value {
        return this.previousValue;
    }

    getNewValue(): Value {
        return this.newValue;
    }

    isForce(): boolean {
        return this.force;
    }

    toString(): string {
        return `[${String(this.previousValue?.getObject() || '')}] ->
                [${String(this.newValue?.getString() || '')}]`;
    }
}
