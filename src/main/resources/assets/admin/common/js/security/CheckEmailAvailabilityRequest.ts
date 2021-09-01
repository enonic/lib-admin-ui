import {JsonResponse} from '../rest/JsonResponse';
import {SecurityResourceRequest} from './SecurityResourceRequest';
import {IdProviderKey} from './IdProviderKey';

export interface CheckEmailAvailabilityResponse {
    available: boolean;
}

export class CheckEmailAvailabilityRequest
    extends SecurityResourceRequest<boolean> {

    private idProviderKey: IdProviderKey;

    private email: string;

    constructor() {
        super();
        this.addRequestPathElements('principals', 'emailAvailable');
    }

    setEmail(email: string) {
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

    protected parseResponse(response: JsonResponse<CheckEmailAvailabilityResponse>): boolean {
        return response.getResult().available;
    }

}
