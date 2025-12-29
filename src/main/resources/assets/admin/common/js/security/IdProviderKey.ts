import {UserItemKey} from './UserItemKey';
import {Equitable} from '../Equitable';
import {ObjectHelper} from '../ObjectHelper';

export class IdProviderKey
    extends UserItemKey {

    public static SYSTEM: IdProviderKey = new IdProviderKey('system');

    constructor(id: string) {
        super(id);
    }

    static fromString(value: string): IdProviderKey {
        return new IdProviderKey(value);
    }

    isSystem(): boolean {
        return this.getId() === IdProviderKey.SYSTEM.getId();
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, IdProviderKey)) {
            return false;
        }

        return super.equals(o);
    }

    public static fromObject(o: object): IdProviderKey {
        if (o instanceof IdProviderKey) {
            return o;
        } else {
            return new IdProviderKey(o['id']);
        }
    }
}
