module api.security {

    export class FindPrincipalsWithRolesResult {

        private principals: Principal[];

        private unfilteredSize: number;

        private hasMore: boolean;

        constructor(principals: Principal[], unfilteredSize: number, hasMore?: boolean) {
            this.principals = principals;
            this.unfilteredSize = unfilteredSize;
            this.hasMore = hasMore;
        }

        getPrincipals(): Principal[] {
            return this.principals;
        }

        getHasMore(): boolean {
            return this.hasMore;
        }

        getUnfilteredSize(): number {
            return this.unfilteredSize;
        }

        static fromJson(json: FindPrincipalsWithRolesResultJson): FindPrincipalsWithRolesResult {
            let principals = json.principals.map(principalJson => Principal.fromJson(principalJson));
            return new FindPrincipalsWithRolesResult(principals, json.unfilteredSize, json.hasMore);
        }
    }

}
