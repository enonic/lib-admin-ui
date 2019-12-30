import {PropertyEvent} from './PropertyEvent';
import {Value} from './Value';
import {Property} from './Property';
import {PropertyEventType} from './PropertyEventType';

export class PropertyValueChangedEvent
    extends PropertyEvent {

    private previousValue: Value;

    private newValue: Value;

    constructor(property: Property, previousValue: Value, newValue: Value) {
        super(PropertyEventType.VALUE_CHANGED, property);
        this.previousValue = previousValue;
        this.newValue = newValue;
    }

    getPreviousValue(): Value {
        return this.previousValue;
    }

    getNewValue(): Value {
        return this.newValue;
    }

    toString(): string {
        return '[' + (this.previousValue ? this.previousValue.getObject() : null) + '] -> [' +
               (this.newValue ? this.newValue.getObject() : null) + ']';
    }
}
