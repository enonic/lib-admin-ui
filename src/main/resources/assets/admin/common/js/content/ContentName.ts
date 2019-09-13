import {Name} from '../Name';
import {Equitable} from '../Equitable';
import {ObjectHelper} from '../ObjectHelper';

export class ContentName
    extends Name
    implements Equitable {

    constructor(name: string) {
        super(name);
    }

    isUnnamed(): boolean {
        return false;
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, ContentName)) {
            return false;
        }

        if (!super.equals(o)) {
            return false;
        }

        return true;
    }
}
