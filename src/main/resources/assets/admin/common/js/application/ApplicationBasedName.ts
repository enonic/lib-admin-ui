import {Equitable} from '../Equitable';
import {ObjectHelper} from '../ObjectHelper';
import {ClassHelper} from '../ClassHelper';
import {ApplicationKey} from './ApplicationKey';

export class ApplicationBasedName
    implements Equitable {
    static SEPARATOR: string = ':';

    private refString: string;

    private applicationKey: ApplicationKey;

    private localName: string;

    constructor(applicationKey: ApplicationKey, localName: string) {
        this.applicationKey = applicationKey;
        this.localName = localName;
        this.refString = applicationKey.toString() ? applicationKey.toString() + ApplicationBasedName.SEPARATOR + localName : localName;
    }

    getLocalName(): string {
        return this.localName;
    }

    getApplicationKey(): ApplicationKey {
        return this.applicationKey;
    }

    toString(): string {
        return this.refString;
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, ClassHelper.getClass(this))) {
            return false;
        }

        let other = o as ApplicationBasedName;

        if (!ObjectHelper.stringEquals(this.refString, other.refString)) {
            return false;
        }

        return true;
    }

}
