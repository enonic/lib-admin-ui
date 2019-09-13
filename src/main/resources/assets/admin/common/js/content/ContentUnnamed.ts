import {StringHelper} from '../util/StringHelper';
import {i18n} from '../util/Messages';
import {Equitable} from '../Equitable';
import {ObjectHelper} from '../ObjectHelper';
import {ContentName} from './ContentName';
import {assert} from '../util/Assert';

export class ContentUnnamed
    extends ContentName
    implements Equitable {

    public static UNNAMED_PREFIX: string = '__unnamed__';

    constructor(name: string) {
        super(name);
        assert(name.indexOf(ContentUnnamed.UNNAMED_PREFIX) === 0,
            'An UnnamedContent must start with [' + ContentUnnamed.UNNAMED_PREFIX + ']: ' + name);
    }

    public static newUnnamed() {
        return new ContentUnnamed(ContentUnnamed.UNNAMED_PREFIX);
    }

    public static prettifyUnnamed(name?: string) {
        if (!name) {
            return `<${ContentUnnamed.getPrettyUnnamed()}>`;
        }

        let prettifiedName = name.replace(/-/g, ' ').trim();
        prettifiedName = StringHelper.capitalizeAll(`${ContentUnnamed.getPrettyUnnamed()} ${prettifiedName}`);

        return `<${prettifiedName}>`;
    }

    public static getPrettyUnnamed(): string {
        return i18n('field.unnamed');
    }

    isUnnamed(): boolean {
        return true;
    }

    toString(): string {
        return '';
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, ContentUnnamed)) {
            return false;
        }

        if (!super.equals(o)) {
            return false;
        }

        return true;
    }
}
