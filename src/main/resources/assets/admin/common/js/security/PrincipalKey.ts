module api.security {

    export class PrincipalKey extends UserItemKey {

        private static SEPARATOR: string = ':';

        private static ANONYMOUS_PRINCIPAL: PrincipalKey = PrincipalKey.ofUser(IdProviderKey.SYSTEM, 'anonymous');

        private static SU_PRINCIPAL: PrincipalKey = PrincipalKey.ofUser(IdProviderKey.SYSTEM, 'su');

        private idProvider: IdProviderKey;

        private type: PrincipalType;

        private refString: string;

        constructor(idProvider: IdProviderKey, type: PrincipalType, principalId: string) {
            super(principalId);

            api.util.assert((type === PrincipalType.ROLE) || (!!idProvider), 'Principal id provider cannot be null');
            api.util.assertNotNull(type, 'Principal type cannot be null');
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

        public static ofGroup(idProvider: IdProviderKey, groupId: string): PrincipalKey {
            return new PrincipalKey(idProvider, PrincipalType.GROUP, groupId);
        }

        equals(o: api.Equitable): boolean {
            if (!api.ObjectHelper.iFrameSafeInstanceOf(o, PrincipalKey)) {
                return false;
            }

            let other = <PrincipalKey>o;
            if (!api.ObjectHelper.stringEquals(this.refString, other.refString)) {
                return false;
            }
            return true;
        }

        isSystem() {
            return this.equals(PrincipalKey.ofAnonymous()) || this.equals(PrincipalKey.ofSU());
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

        getIdProvider(): IdProviderKey {
            return this.idProvider;
        }

        toPath(toParent: boolean = false): string {
            let path = this.isRole() ? '/roles/' :
                       api.util.StringHelper.format('/{0}/{1}/', this.getIdProvider().toString(),
                           PrincipalType[this.getType()].toLowerCase().replace(/(group|user)/g, '$&s'));

            if (!toParent) {
                path += this.getId();
            }

            return path;
        }
    }
}
