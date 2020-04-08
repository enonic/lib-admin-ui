import {JsonResponse} from '../../rest/JsonResponse';
import {AuthResourceRequest} from './AuthResourceRequest';
import {LoginResult} from './LoginResult';
import {LoginResultJson} from './LoginResultJson';

export class IsAuthenticatedRequest
    extends AuthResourceRequest<LoginResult> {

    constructor() {
        super();
        this.addRequestPathElements('authenticated');
    }

    protected parseResponse(response: JsonResponse<LoginResultJson>): LoginResult {
        return new LoginResult(response.getResult());
    }

}
