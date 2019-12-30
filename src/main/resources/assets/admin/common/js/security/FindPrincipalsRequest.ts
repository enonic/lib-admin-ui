import * as Q from 'q';
import {SecurityResourceRequest} from './SecurityResourceRequest';
import {Path} from '../rest/Path';
import {JsonResponse} from '../rest/JsonResponse';
import {FindPrincipalsResultJson} from './FindPrincipalsResultJson';
import {FindPrincipalsResult} from './FindPrincipalsResult';
import {PrincipalType} from './PrincipalType';
import {IdProviderKey} from './IdProviderKey';
import {PrincipalJson} from './PrincipalJson';
import {Principal} from './Principal';

export class FindPrincipalsRequest
    extends SecurityResourceRequest<FindPrincipalsResultJson, FindPrincipalsResult> {

    private allowedTypes: PrincipalType[];
    private searchQuery: string;
    private idProviderKey: IdProviderKey;
    private filterPredicate: (principal: Principal) => boolean;
    private from: number;
    private size: number;

    constructor() {
        super();
        super.setMethod('GET');
    }

    getParams(): Object {
        return {
            types: this.enumToStrings(this.allowedTypes).join(','),
            query: this.searchQuery || null,
            idProviderKey: this.idProviderKey ? this.idProviderKey.toString() : null,
            from: this.from || null,
            size: this.size || null
        };
    }

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'principals');
    }

    sendAndParse(): Q.Promise<FindPrincipalsResult> {
        return this.send().then((response: JsonResponse<FindPrincipalsResultJson>) => {
            let principals: Principal[] = response.getResult().principals.map((principalJson: PrincipalJson) => {
                return Principal.fromJson(principalJson);
            });
            if (this.filterPredicate) {
                principals = principals.filter(this.filterPredicate);
            }
            return new FindPrincipalsResult(principals, response.getResult().principals.length, response.getResult().totalSize);
        });
    }

    setIdProviderKey(key: IdProviderKey): FindPrincipalsRequest {
        this.idProviderKey = key;
        return this;
    }

    setAllowedTypes(types: PrincipalType[]): FindPrincipalsRequest {
        this.allowedTypes = types;
        return this;
    }

    getAllowedTypes(): PrincipalType[] {
        return this.allowedTypes;
    }

    setFrom(from: number): FindPrincipalsRequest {
        this.from = from;
        return this;
    }

    getFrom(): number {
        return this.from;
    }

    setSize(size: number): FindPrincipalsRequest {
        this.size = size;
        return this;
    }

    setSearchQuery(query: string): FindPrincipalsRequest {
        this.searchQuery = query;
        return this;
    }

    setResultFilter(filterPredicate: (principal: Principal) => boolean) {
        this.filterPredicate = filterPredicate;
    }

    private enumToStrings(types: PrincipalType[]): string[] {
        return types.map((type: PrincipalType) => {
            return PrincipalType[type].toUpperCase();
        });
    }
}
