import {Value} from '../../data/Value';

export class ValueChangedEvent {

    private newValue: Value;

    private arrayIndex: number;

    constructor(newValue: Value, arrayIndex: number) {
        this.newValue = newValue;
        this.arrayIndex = arrayIndex;
    }

    getNewValue(): Value {
        return this.newValue;
    }

    getArrayIndex(): number {
        return this.arrayIndex;
    }
}
