import {JsonResponse} from '../rest/JsonResponse';
import {SecurityResourceRequest} from './SecurityResourceRequest';
import {IdProviderKey} from './IdProviderKey';
import {Path} from '../rest/Path';

export interface CheckEmailAvailabilityResponse {
    available: boolean;
}

export class CheckEmailAvailabilityRequest
    extends SecurityResourceRequest<boolean> {

    private readonly idProviderKey: IdProviderKey;

    private email: string;

    constructor(key: IdProviderKey, postfixUri: string) {
        super();
        this.restPath = Path.create().fromString(postfixUri).build();
        this.idProviderKey = key;
        this.addRequestPathElements('principals', 'emailAvailable');
    }

    setEmail(email: string) {
        this.email = email;
    }

    getParams(): object {
        return {
            email: this.email,
            idProviderKey: this.idProviderKey ? this.idProviderKey.toString() : undefined
        };
    }

    protected parseResponse(response: JsonResponse<CheckEmailAvailabilityResponse>): boolean {
        return response.getResult().available;
    }

}
