import {ResourceRequest} from '../rest/ResourceRequest';
import {JsonResponse} from '../rest/JsonResponse';
import {StatusJson} from './StatusJson';
import {StatusResult} from './StatusResult';
import {UriHelper} from '../util/UriHelper';

export class StatusRequest
    extends ResourceRequest<StatusResult> {

    constructor() {
        super();
    }

    protected getPostfixUri(): string {
        return UriHelper.getAdminUri(UriHelper.joinPath('_', 'admin:status'));
    }

    protected parseResponse(response: JsonResponse<StatusJson>): StatusResult {
        return new StatusResult(response.getResult());
    }
}
