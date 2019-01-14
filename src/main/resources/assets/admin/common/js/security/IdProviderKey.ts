module api.security {

    import UserItemKey = api.security.UserItemKey;

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

        equals(o: api.Equitable): boolean {
            if (!api.ObjectHelper.iFrameSafeInstanceOf(o, IdProviderKey)) {
                return false;
            }

            return super.equals(o);
        }
    }
}
