/**
 * An event representing that a property of an object have changed.
 */
export class PropertyChangedEvent {

    private readonly propertyName: string;

    private readonly oldValue: Object;

    private readonly newValue: Object;

    private readonly source: Object;

    constructor(propertyName: string, oldValue: Object, newValue: Object, source?: Object) {

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
