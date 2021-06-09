import * as Q from 'q';
import {JsonResponse} from '../../rest/JsonResponse';
import {AuthResourceRequest} from './AuthResourceRequest';
import {LoginResult} from './LoginResult';
import {LoginResultJson} from './LoginResultJson';

export class IsAuthenticatedRequest
    extends AuthResourceRequest<LoginResult> {

    private static CACHE: LoginResult;

    constructor() {
        super();
        this.addRequestPathElements('authenticated');
    }

    protected parseResponse(response: JsonResponse<LoginResultJson>): LoginResult {
        IsAuthenticatedRequest.CACHE = new LoginResult(response.getResult());

        return IsAuthenticatedRequest.CACHE;
    }

    sendAndParse(): Q.Promise<LoginResult> {
        return !!IsAuthenticatedRequest.CACHE ? Q(IsAuthenticatedRequest.CACHE) : super.sendAndParse();
    }

}
