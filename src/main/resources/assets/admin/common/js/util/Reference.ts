import {Equitable} from '../Equitable';
import {ContentId} from '../content/ContentId';
import {ObjectHelper} from '../ObjectHelper';

export class Reference
    implements Equitable {

    private referenceId: string;

    constructor(value: string) {
        this.referenceId = value;
    }

    static from(value: ContentId): Reference {
        return new Reference(value.toString());
    }

    getNodeId(): string {
        return this.referenceId;
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, Reference)) {
            return false;
        }

        let other = <Reference>o;

        if (!ObjectHelper.stringEquals(this.referenceId, other.referenceId)) {
            return false;
        }

        return true;
    }

    toString(): string {
        return this.referenceId;
    }
}
