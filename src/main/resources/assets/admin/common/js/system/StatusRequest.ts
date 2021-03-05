import {CmsResourceRequest} from '../rest/CmsResourceRequest';
import {JsonResponse} from '../rest/JsonResponse';
import {StatusJson} from './StatusJson';
import {StatusResult} from './StatusResult';

export class StatusRequest
    extends CmsResourceRequest<StatusResult> {

    constructor() {
        super();
        this.addRequestPathElements('status');
    }

    protected parseResponse(response: JsonResponse<StatusJson>): StatusResult {
        return new StatusResult(response.getResult());
    }
}
