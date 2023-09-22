import {Property} from './Property';
import {PropertyEventType} from './PropertyEventType';
import {PropertyPath} from './PropertyPath';

export class PropertyEvent {

    private readonly type: PropertyEventType;

    private readonly property: Property;

    constructor(type: PropertyEventType, property: Property) {
        this.type = type;
        this.property = property;
    }

    getType(): PropertyEventType {
        return this.type;
    }

    getProperty(): Property {
        return this.property;
    }

    getPath(): PropertyPath {
        return this.property.getPath();
    }

    toString(): string {
        return this.getPath().toString();
    }
}
