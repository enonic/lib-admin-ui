import {Equitable} from '../Equitable';
import {ObjectHelper} from '../ObjectHelper';

export class BinaryReference
    implements Equitable {

    private value: string;

    constructor(value: string) {
        this.value = value;
    }

    getValue(): string {
        return this.value;
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, BinaryReference)) {
            return false;
        }

        let other = o as BinaryReference;

        if (!ObjectHelper.stringEquals(this.value, other.value)) {
            return false;
        }

        return true;
    }

    toString(): string {
        return this.value;
    }
}
