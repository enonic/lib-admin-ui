import {Name} from '../Name';
import {Equitable} from '../Equitable';
import {ObjectHelper} from '../ObjectHelper';
import {assert} from '../util/Assert';
import {ContentUnnamed} from './ContentUnnamed';

export class ContentName
    extends Name
    implements Equitable {

    public static UNNAMED_PREFIX: string = '__unnamed__';

    constructor(name: string) {
        super(name);
    }

    public static fromString(str: string): ContentName {

        assert(str != null, 'name cannot be null');
        if (str.indexOf(ContentName.UNNAMED_PREFIX) === 0) {
            return new ContentUnnamed(str);
        } else {
            return new ContentName(str);
        }
    }

    isUnnamed(): boolean {
        return false;
    }

    toUnnamed(): ContentUnnamed {
        assert(ObjectHelper.iFrameSafeInstanceOf(this, ContentUnnamed), 'this is not a ContentUnnamed');
        return <ContentUnnamed>this;
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

    toStringIncludingHidden() {
        return this.toString();
    }

}
