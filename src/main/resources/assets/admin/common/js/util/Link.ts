import {Equitable} from '../Equitable';
import {ObjectHelper} from '../ObjectHelper';

export class Link
    implements Equitable {

    private path: string;

    constructor(value: string) {
        this.path = value;
    }

    getPath(): string {
        return this.path;
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, Link)) {
            return false;
        }

        let other = o as Link;

        if (ObjectHelper.stringEquals(this.path, other.path)) {
            return true;
        }

        return false;
    }

    toString(): string {
        return this.path;
    }
}
