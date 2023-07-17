import {Equitable} from '../Equitable';
import {ObjectHelper} from '../ObjectHelper';

export class Reference
    implements Equitable {

    private referenceId: string;

    constructor(value: string) {
        this.referenceId = value;
    }

    getNodeId(): string {
        return this.referenceId;
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, Reference)) {
            return false;
        }

        let other = o as Reference;

        if (!ObjectHelper.stringEquals(this.referenceId, other.referenceId)) {
            return false;
        }

        return true;
    }

    toString(): string {
        return this.referenceId;
    }
}
