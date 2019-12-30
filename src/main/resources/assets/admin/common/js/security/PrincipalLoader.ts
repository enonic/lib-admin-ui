import * as Q from 'q';
import {PostLoader} from '../util/loader/PostLoader';
import {PrincipalListJson} from './PrincipalListJson';
import {FindPrincipalListRequest} from './FindPrincipalListRequest';
import {PrincipalType} from './PrincipalType';
import {IdProviderKey} from './IdProviderKey';
import {Principal} from './Principal';
import {PrincipalKey} from './PrincipalKey';
import {GetPrincipalsByKeysRequest} from './GetPrincipalsByKeysRequest';

export class PrincipalLoader
    extends PostLoader<PrincipalListJson, Principal> {

    protected request: FindPrincipalListRequest;

    private skipPrincipalKeys: { [key: string]: PrincipalKey; };

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

    protected createRequest(): FindPrincipalListRequest {
        return new FindPrincipalListRequest().setSize(10);
    }

    protected getRequest(): FindPrincipalListRequest {
        return this.request;
    }

    protected sendPreLoadRequest(keys: string): Q.Promise<Principal[]> {
        let principalKeys = keys.split(';').map((key) => {
            return PrincipalKey.fromString(key);
        });
        return new GetPrincipalsByKeysRequest(principalKeys).sendAndParse().then((value => {
            return value;
        }));
    }
}
