import {ResourceRequest} from '../rest/ResourceRequest';
import {JsonResponse} from '../rest/JsonResponse';
import {StatusJson} from './StatusJson';
import {StatusResult} from './StatusResult';

export class StatusRequest
    extends ResourceRequest<StatusResult> {

    constructor() {
        super();
        this.addRequestPathElements('status');
    }

    protected parseResponse(response: JsonResponse<StatusJson>): StatusResult {
        return new StatusResult(response.getResult());
    }
}
