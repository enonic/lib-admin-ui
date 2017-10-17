module api.security {

    export class FindPrincipalsResult {

        private principals: Principal[];

        private hits: number;

        private totalHits: number;

        constructor(principals: Principal[], hits: number, totalHits: number) {
            this.principals = principals;
            this.hits = hits;
            this.totalHits = totalHits;
        }

        getPrincipals(): Principal[] {
            return this.principals;
        }

        getTotalHits(): number {
            return this.totalHits;
        }

        getHits(): number {
            return this.hits;
        }

        static fromJson(json: FindPrincipalsResultJson): FindPrincipalsResult {
            let principals = json.principals.map(principalJson => Principal.fromJson(principalJson));
            return new FindPrincipalsResult(principals, principals.length, json.totalSize);
        }
    }

}
