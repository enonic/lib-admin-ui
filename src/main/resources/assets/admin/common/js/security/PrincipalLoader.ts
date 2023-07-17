import * as Q from 'q';
import {PostLoader} from '../util/loader/PostLoader';
import {FindPrincipalsRequest} from './FindPrincipalsRequest';
import {PrincipalType} from './PrincipalType';
import {IdProviderKey} from './IdProviderKey';
import {Principal} from './Principal';
import {PrincipalKey} from './PrincipalKey';
import {GetPrincipalsByKeysRequest} from './GetPrincipalsByKeysRequest';

export class PrincipalLoader
    extends PostLoader<Principal> {

    protected request: FindPrincipalsRequest;

    private skipPrincipalKeys: Record<string, PrincipalKey>;

    constructor() {
        super();

        this.skipPrincipalKeys = {};
        // allow all by default
        this.setAllowedTypes([PrincipalType.GROUP, PrincipalType.USER, PrincipalType.ROLE]);
    }

    setIdProviderKey(key: IdProviderKey): PrincipalLoader {
        this.getRequest().setIdProviderKey(key);
        return this;
    }

    setAllowedTypes(principalTypes: PrincipalType[]): PrincipalLoader {
        this.getRequest().setAllowedTypes(principalTypes);
        return this;
    }

    search(searchString: string): Q.Promise<Principal[]> {
        this.getRequest().setSearchQuery(searchString);
        return this.load();
    }

    setSearchString(value: string) {
        super.setSearchString(value);
        this.getRequest().setSearchQuery(value);
    }

    skipPrincipals(principalKeys: PrincipalKey[]): PrincipalLoader {
        this.skipPrincipalKeys = {};
        principalKeys.forEach((principalKey: PrincipalKey) => {
            this.skipPrincipalKeys[principalKey.toString()] = principalKey;
        });
        this.getRequest().setResultFilter((principal) => !this.skipPrincipalKeys[principal.getKey().toString()]);
        return this;
    }

    skipPrincipal(principalKey: PrincipalKey): PrincipalLoader {
        this.skipPrincipalKeys[principalKey.toString()] = principalKey;
        this.getRequest().setResultFilter((principal) => !this.skipPrincipalKeys[principal.getKey().toString()]);
        return this;
    }

    resetParams() {
        this.getRequest().resetParams();
    }

    isPartiallyLoaded(): boolean {
        return this.getRequest().isPartiallyLoaded();
    }

    setUseDataPreLoad(bool: boolean): PrincipalLoader {
        super.setUseDataPreLoad(bool);
        return this;
    }

    protected createRequest(): FindPrincipalsRequest {
        return new FindPrincipalsRequest().setSize(10);
    }

    protected getRequest(): FindPrincipalsRequest {
        return this.request;
    }

    protected createPreLoadRequest(principalKeys: PrincipalKey[]): GetPrincipalsByKeysRequest {
        return new GetPrincipalsByKeysRequest(principalKeys);
    }

    protected sendPreLoadRequest(keys: string): Q.Promise<Principal[]> {
        const principalKeys = keys.split(';').map((key) => PrincipalKey.fromString(key));
        return this.createPreLoadRequest(principalKeys).sendAndParse();
    }
}
