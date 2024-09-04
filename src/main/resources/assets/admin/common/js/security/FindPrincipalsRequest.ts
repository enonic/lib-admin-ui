import {SecurityResourceRequest} from './SecurityResourceRequest';
import {JsonResponse} from '../rest/JsonResponse';
import {FindPrincipalsResultJson} from './FindPrincipalsResultJson';
import {FindPrincipalsResult} from './FindPrincipalsResult';
import {PrincipalType} from './PrincipalType';
import {IdProviderKey} from './IdProviderKey';
import {PrincipalJson} from './PrincipalJson';
import {Principal} from './Principal';

export class FindPrincipalsRequest
    extends SecurityResourceRequest<Principal[]> {

    private allowedTypes: PrincipalType[];
    private searchQuery: string;
    private idProviderKey: IdProviderKey;
    private filterPredicate: (principal: Principal) => boolean;
    private from: number;
    private size: number;
    private results: Principal[] = [];
    private loaded: boolean;

    constructor() {
        super();
        this.addRequestPathElements('principals');
    }

    isPartiallyLoaded(): boolean {
        return this.results.length > 0 && !this.loaded;
    }

    isLoaded(): boolean {
        return this.loaded;
    }

    resetParams() {
        this.setFrom(0);
        this.loaded = false;
    }

    protected parseResponse(response: JsonResponse<FindPrincipalsResultJson>): Principal[] {
        let principals: Principal[] = response.getResult().principals
            .map((principalJson: PrincipalJson) => Principal.fromJson(principalJson));

        if (this.filterPredicate) {
            principals = principals.filter(this.filterPredicate);
        }

        const result = new FindPrincipalsResult(principals, response.getResult().principals.length, response.getResult().totalSize);
        return this.resultToPrincipalArray(result);
    }

    private resultToPrincipalArray(result: FindPrincipalsResult): Principal[] {
        if (this.getFrom() === 0) {
            this.results = [];
        }
        this.setFrom(this.getFrom() + result.getHits());
        this.loaded = this.getFrom() >= result.getTotalHits();

        this.results = this.results.concat(result.getPrincipals());

        return this.results;
    }

    getParams(): object {
        return {
            types: this.enumToStrings(this.allowedTypes).join(','),
            query: this.searchQuery || null,
            idProviderKey: this.idProviderKey ? this.idProviderKey.toString() : null,
            from: this.from || null,
            size: this.size || null
        };
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
