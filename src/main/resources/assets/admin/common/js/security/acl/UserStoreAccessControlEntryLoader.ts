module api.security.acl {

    import PrincipalListJson = api.security.PrincipalListJson;
    import PrincipalJson = api.security.PrincipalJson;
    import SecurityResourceRequest = api.security.SecurityResourceRequest;

    export class FindUserStoreAccessControlEntriesRequest
    extends SecurityResourceRequest<PrincipalListJson, UserStoreAccessControlEntry[]> {

        private searchQuery: string;

        getParams(): Object {
            return {
                /*types: this.enumToStrings(this.allowedTypes),*/
                query: this.searchQuery
            };
        }

        getRequestPath(): api.rest.Path {
            return api.rest.Path.fromParent(super.getResourcePath(), 'principals');
        }

        sendAndParse(): wemQ.Promise<UserStoreAccessControlEntry[]> {
            return this.send().
                then((response: api.rest.JsonResponse<PrincipalListJson>) => {
                    return response.getResult().principals.map((principalJson: PrincipalJson) => {
                        return new UserStoreAccessControlEntry(this.fromJsonToPrincipal(principalJson));
                    });
                });
        }

        setSearchQuery(query: string): FindUserStoreAccessControlEntriesRequest {
            this.searchQuery = query;
            return this;
        }
    }

    export class UserStoreAccessControlEntryLoader extends api.util.loader.BaseLoader<PrincipalListJson, UserStoreAccessControlEntry> {

        protected request: FindUserStoreAccessControlEntriesRequest;

        protected createRequest(): FindUserStoreAccessControlEntriesRequest {
            return new FindUserStoreAccessControlEntriesRequest();
        }

        protected getRequest(): FindUserStoreAccessControlEntriesRequest {
            return this.request;
        }

        search(searchString: string): wemQ.Promise<UserStoreAccessControlEntry[]> {
            this.getRequest().setSearchQuery(searchString);
            return this.load();
        }

        setSearchString(value: string) {
            super.setSearchString(value);
            this.getRequest().setSearchQuery(value);
        }

    }

}
