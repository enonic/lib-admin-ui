module api.security {

    export class FindPrincipalWithRolesListRequest
        extends api.security.SecurityResourceRequest<PrincipalListJson, Principal[]> {

        private request: FindPrincipalsWithRolesRequest;

        private loaded: boolean;

        private results: Principal[] = [];

        constructor() {
            super();
            this.request = new api.security.FindPrincipalsWithRolesRequest();
        }

        sendAndParse(): wemQ.Promise<Principal[]> {
            return this.request.sendAndParse().then((result: FindPrincipalsWithRolesResult) => {

                if (this.getFrom() === 0) {
                    this.results = [];
                }
                this.setFrom(this.getFrom() + result.getUnfilteredSize());
                this.loaded = !result.getHasMore();

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

        setFrom(value: number): FindPrincipalWithRolesListRequest {
            this.request.setFrom(value);
            return this;
        }

        setSize(value: number): FindPrincipalWithRolesListRequest {
            this.request.setSize(value);
            return this;
        }

        resetParams() {
            this.request.setFrom(0);
            this.loaded = false;
        }

        getFrom(): number {
            return this.request.getFrom();
        }

        setUserStoreKey(key: UserStoreKey): FindPrincipalWithRolesListRequest {
            this.request.setUserStoreKey(key);
            return this;
        }

        setAllowedTypes(types: PrincipalType[]): FindPrincipalWithRolesListRequest {
            this.request.setAllowedTypes(types);
            return this;
        }

        getAllowedTypes(): PrincipalType[] {
            return this.request.getAllowedTypes();
        }

        setRequiredRoles(roles: PrincipalKey[]): FindPrincipalWithRolesListRequest {
            this.request.setRequiredRoles(roles);
            return this;
        }

        getRequiredRoles(): PrincipalKey[] {
            return this.request.getRequiredRoles();
        }

        setSearchQuery(query: string): FindPrincipalWithRolesListRequest {
            this.request.setSearchQuery(query);
            return this;
        }

        setResultFilter(filterPredicate: (principal: Principal) => boolean) {
            this.request.setResultFilter(filterPredicate);
        }

    }
}
