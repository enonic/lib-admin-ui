import {Path} from '../rest/Path';
import {JsonResponse} from '../rest/JsonResponse';
import {SecurityResourceRequest} from './SecurityResourceRequest';
import {IdProviderKey} from './IdProviderKey';

export interface CheckEmailAvailabilityResponse {
    available: boolean;
}

export class CheckEmailAvailabilityRequest
    extends SecurityResourceRequest<CheckEmailAvailabilityResponse, boolean> {

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

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'principals', 'emailAvailable');
    }

    sendAndParse(): Q.Promise<boolean> {

        return this.send().then((response: JsonResponse<CheckEmailAvailabilityResponse>) => {
            return response.getResult().available;
        });
    }

}
