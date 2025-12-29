import {Equitable} from '../Equitable';
import {ObjectHelper} from '../ObjectHelper';
import {StringHelper} from '../util/StringHelper';
import {UserItemKey} from './UserItemKey';
import {IdProviderKey} from './IdProviderKey';
import {PrincipalType} from './PrincipalType';
import {assert, assertNotNull} from '../util/Assert';

export class PrincipalKey
    extends UserItemKey {

    private static SEPARATOR: string = ':';

    private static ANONYMOUS_PRINCIPAL: PrincipalKey = PrincipalKey.ofUser(IdProviderKey.SYSTEM, 'anonymous');

    private static SU_PRINCIPAL: PrincipalKey = PrincipalKey.ofUser(IdProviderKey.SYSTEM, 'su');

    private static SYSTEM_ROLE_PREFIX: string = 'system.';

    private static PROJECT_ROLE_PREFIX: string = 'cms.project.';

    private idProvider: IdProviderKey;

    private type: PrincipalType;

    private refString: string;

    constructor(idProvider: IdProviderKey, type: PrincipalType, principalId: string) {
        super(principalId);

        assert((type === PrincipalType.ROLE) || (!!idProvider), 'Principal id provider cannot be null');
        assertNotNull(type, 'Principal type cannot be null');
        this.idProvider = idProvider;
        this.type = type;

        if (type === PrincipalType.ROLE) {
            this.refString =
                PrincipalType[type].toLowerCase() + PrincipalKey.SEPARATOR + principalId;
        } else {
            this.refString =
                PrincipalType[type].toLowerCase() + PrincipalKey.SEPARATOR + idProvider.toString() + PrincipalKey.SEPARATOR +
                principalId;
        }
    }

    static fromString(str: string): PrincipalKey {
        if (str === PrincipalKey.ANONYMOUS_PRINCIPAL.refString) {
            return PrincipalKey.ANONYMOUS_PRINCIPAL;
        }

        const sepIndex: number = str.indexOf(PrincipalKey.SEPARATOR);
        if (sepIndex === -1) {
            throw new Error('Not a valid principal key [' + str + ']');
        }
        const sepIndex2: number = str.indexOf(PrincipalKey.SEPARATOR, sepIndex + 1);

        const typeStr = str.substring(0, sepIndex);
        const type: PrincipalType = PrincipalType[typeStr.toUpperCase()];

        if (type === PrincipalType.ROLE) {
            const principalId = str.substring(sepIndex + 1, str.length) || '';
            return new PrincipalKey(null, type, principalId);

        } else {
            if (sepIndex2 === -1) {
                throw new Error('Not a valid principal key [' + str + ']');
            }

            const idProvider = str.substring(sepIndex + 1, sepIndex2) || '';
            const principalId = str.substring(sepIndex2 + 1, str.length);

            return new PrincipalKey(new IdProviderKey(idProvider), type, principalId);
        }
    }

    public static ofUser(idProvider: IdProviderKey, userId: string): PrincipalKey {
        return new PrincipalKey(idProvider, PrincipalType.USER, userId);
    }

    public static ofGroup(idProvider: IdProviderKey, groupId: string): PrincipalKey {
        return new PrincipalKey(idProvider, PrincipalType.GROUP, groupId);
    }

    public static ofAnonymous(): PrincipalKey {
        return PrincipalKey.ANONYMOUS_PRINCIPAL;
    }

    public static ofSU(): PrincipalKey {
        return PrincipalKey.SU_PRINCIPAL;
    }

    public static ofRole(roleId: string): PrincipalKey {
        return new PrincipalKey(IdProviderKey.SYSTEM, PrincipalType.ROLE, roleId);
    }

    getType(): PrincipalType {
        return this.type;
    }

    isUser(): boolean {
        return this.type === PrincipalType.USER;
    }

    isGroup(): boolean {
        return this.type === PrincipalType.GROUP;
    }

    isRole(): boolean {
        return this.type === PrincipalType.ROLE;
    }

    isAnonymous(): boolean {
        return this.refString === PrincipalKey.ANONYMOUS_PRINCIPAL.refString;
    }

    toString(): string {
        return this.refString;
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, PrincipalKey)) {
            return false;
        }

        let other = o as PrincipalKey;
        if (!ObjectHelper.stringEquals(this.refString, other.refString)) {
            return false;
        }
        return true;
    }

    isSystem(): boolean {
        return this.isSystemUser() || this.isSystemRole() || this.isProjectRole();
    }

    private isSystemUser(): boolean {
        return this.equals(PrincipalKey.ofAnonymous()) || this.equals(PrincipalKey.ofSU());
    }

    private isSystemRole(): boolean {
        return this.isRole() && this.getId().indexOf(PrincipalKey.SYSTEM_ROLE_PREFIX) === 0;
    }

    private isProjectRole(): boolean {
        return this.isRole() && this.getId().indexOf(PrincipalKey.PROJECT_ROLE_PREFIX) === 0;
    }

    getIdProvider(): IdProviderKey {
        return this.idProvider;
    }

    toPath(toParent: boolean = false): string {
        let path = this.isRole() ? '/roles/' :
                   StringHelper.format('/{0}/{1}/', this.getIdProvider().toString(),
                       PrincipalType[this.getType()].toLowerCase().replace(/(group|user)/g, '$&s'));

        if (!toParent) {
            path += this.getId();
        }

        return path;
    }

    public static fromObject(o: object): PrincipalKey {
        if (o instanceof PrincipalKey) {
            return o;
        } else {
            return PrincipalKey.fromString(o['refString']);
        }
    }
}
