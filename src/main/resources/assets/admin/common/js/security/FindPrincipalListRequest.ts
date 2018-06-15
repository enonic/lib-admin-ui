module api.security {

    export class FindPrincipalListRequest extends api.security.SecurityResourceRequest<PrincipalListJson, Principal[]> {

        private request: FindPrincipalsRequest;

        private loaded: boolean;

        private results: Principal[] = [];

        constructor() {
            super();
            this.request = new api.security.FindPrincipalsRequest();
        }

        sendAndParse(): wemQ.Promise<Principal[]> {
            return this.request.sendAndParse().then((result: FindPrincipalsResult) => {

                if (this.getFrom() === 0) {
                    this.results = [];
                }
                this.setFrom(this.getFrom() + result.getHits());
                this.loaded = this.getFrom() >= result.getTotalHits();

                this.results = this.results.concat(result.getPrincipals());

                return this.results;
            });
        }

        isPartiallyLoaded(): boolean {
            return this.results.length > 0 && !this.loaded;
        }

        isLoaded(): boolean {
            return this.loaded;
        }

        setFrom(value: number): FindPrincipalListRequest {
            this.request.setFrom(value);
            return this;
        }

        setSize(value: number): FindPrincipalListRequest {
            this.request.setSize(value);
            return this;
        }

        resetParams() {
            this.request.setFrom(0);
            this.loaded = false;
        }

        getFrom() : number {
            return this.request.getFrom();
        }

        setUserStoreKey(key: UserStoreKey): FindPrincipalListRequest {
            this.request.setUserStoreKey(key);
            return this;
        }

        setAllowedTypes(types: PrincipalType[]): FindPrincipalListRequest {
            this.request.setAllowedTypes(types);
            return this;
        }

        getAllowedTypes(): PrincipalType[] {
            return this.request.getAllowedTypes();
        }

        setRequiredRoles(roles: PrincipalKey[]): FindPrincipalListRequest {
            this.request.setRequiredRoles(roles);
            return this;
        }

        getRequiredRoles(): PrincipalKey[] {
            return this.request.getRequiredRoles();
        }

        setSearchQuery(query: string): FindPrincipalListRequest {
            this.request.setSearchQuery(query);
            return this;
        }

        setResultFilter(filterPredicate: (principal: Principal) => boolean) {
            this.request.setResultFilter(filterPredicate);
        }

    }
}
