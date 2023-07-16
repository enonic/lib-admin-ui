import {Property} from './Property';
import {PropertyEventType} from './PropertyEventType';
import {PropertyEvent} from './PropertyEvent';

export class PropertyAddedEvent
    extends PropertyEvent {

    constructor(property: Property) {
        super(PropertyEventType.ADDED, property);
    }

    toString(): string {
        let value = this.getProperty().getValue();
        return `${this.getPath().toString()} = ${JSON.stringify(value?.getObject()) || ''}`;
    }
}
