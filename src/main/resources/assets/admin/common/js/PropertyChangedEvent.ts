import {ValueData} from './data/Value';

/**
 * An event representing that a property of an object have changed.
 */
export class PropertyChangedEvent {

    private readonly propertyName: string;

    private readonly oldValue: ValueData;

    private readonly newValue: ValueData;

    private readonly source: object;

    constructor(propertyName: string, oldValue: ValueData, newValue: ValueData, source?: object) {

        this.propertyName = propertyName;
        this.oldValue = oldValue;
        this.newValue = newValue;
        this.source = source;
    }

    getPropertyName(): string {
        return this.propertyName;
    }

    getOldValue(): any {
        return this.oldValue;
    }

    getNewValue(): any {
        return this.newValue;
    }

    getSource(): any {
        return this.source;
    }
}
