import {PropertyEvent} from './PropertyEvent';
import {Property} from './Property';
import {PropertyEventType} from './PropertyEventType';

export class PropertyRemovedEvent
    extends PropertyEvent {

    constructor(property: Property) {
        super(PropertyEventType.REMOVED, property);
    }

    toString(): string {
        let value = this.getProperty().getValue();
        return `${this.getPath().toString()} = ${String(value?.getObject() || '')}`;
    }
}
