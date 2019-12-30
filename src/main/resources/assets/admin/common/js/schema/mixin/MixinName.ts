import {ApplicationKey} from '../../application/ApplicationKey';
import {ApplicationBasedName} from '../../application/ApplicationBasedName';
import {Equitable} from '../../Equitable';
import {ObjectHelper} from '../../ObjectHelper';
import {assertNotNull} from '../../util/Assert';

export class MixinName
    extends ApplicationBasedName {

    constructor(name: string) {
        assertNotNull(name, `Mixin name can't be null`);
        let parts = name.split(ApplicationBasedName.SEPARATOR);
        super(ApplicationKey.fromString(parts[0]), parts[1]);
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, MixinName)) {
            return false;
        }

        return super.equals(o);
    }
}
