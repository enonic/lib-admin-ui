module api.security {

    export class GetPrincipalsByKeysRequest extends SecurityResourceRequest<PrincipalJson[], Principal[]> {

        private principalKeys: PrincipalKey[];

        private includeMemberships: boolean;

        constructor(principalKeys: PrincipalKey[]) {
            super();
            super.setMethod('POST');
            this.principalKeys = principalKeys;
            this.includeMemberships = false;
        }

        setIncludeMemberships(includeMemberships: boolean): GetPrincipalsByKeysRequest {
            this.includeMemberships = includeMemberships;
            return this;
        }

        getParams(): Object {
            return {
                keys: this.principalKeys.map(key => key.toString()),
                memberships: this.includeMemberships
            };
        }

        getRequestPath(): api.rest.Path {
            return api.rest.Path.fromParent(super.getResourcePath(), 'principals/resolveByKeys');
        }

        sendAndParse(): wemQ.Promise<Principal[]> {

            return this.send().then((response: api.rest.JsonResponse<PrincipalJson[]>) => {
                return response.getResult().map(principal => this.fromJsonToPrincipal(principal));
            });
        }

    }
}
