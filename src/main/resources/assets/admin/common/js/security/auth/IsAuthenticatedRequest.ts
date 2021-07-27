import * as Q from 'q';
import {JsonResponse} from '../../rest/JsonResponse';
import {AuthResourceRequest} from './AuthResourceRequest';
import {LoginResult} from './LoginResult';
import {LoginResultJson} from './LoginResultJson';

export class IsAuthenticatedRequest
    extends AuthResourceRequest<LoginResult> {

    private static cachedRequestPromise: Q.Promise<LoginResult>;

    constructor() {
        super();
        this.addRequestPathElements('authenticated');
    }

    protected parseResponse(response: JsonResponse<LoginResultJson>): LoginResult {
        return new LoginResult(response.getResult());
    }

    sendAndParse(): Q.Promise<LoginResult> {
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        IsAuthenticatedRequest.cachedRequestPromise = IsAuthenticatedRequest.cachedRequestPromise || super.sendAndParse();
        return IsAuthenticatedRequest.cachedRequestPromise;
    }

}
