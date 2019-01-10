module api.security {

    export interface CheckEmailAvailabilityResponse {
        available: boolean;
    }

    export class CheckEmailAvailabilityRequest extends SecurityResourceRequest<CheckEmailAvailabilityResponse, boolean> {

        private idProviderKey: IdProviderKey;

        private email: string;

        constructor(email: string) {
            super();
            super.setMethod('GET');
            this.email = email;
        }

        setIdProviderKey(key: IdProviderKey): CheckEmailAvailabilityRequest {
            this.idProviderKey = key;
            return this;
        }

        getParams(): Object {
            return {
                email: this.email,
                idProviderKey: this.idProviderKey ? this.idProviderKey.toString() : undefined
            };
        }

        getRequestPath(): api.rest.Path {
            return api.rest.Path.fromParent(super.getResourcePath(), 'principals', 'emailAvailable');
        }

        sendAndParse(): wemQ.Promise<boolean> {

            return this.send().then((response: api.rest.JsonResponse<CheckEmailAvailabilityResponse>) => {
                return response.getResult().available;
            });
        }

    }
}
