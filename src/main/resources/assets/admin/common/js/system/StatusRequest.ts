import {ResourceRequest} from '../rest/ResourceRequest';
import {JsonResponse} from '../rest/JsonResponse';
import {StatusJson} from './StatusJson';
import {StatusResult} from './StatusResult';

export class StatusRequest
    extends ResourceRequest<StatusResult> {

    private url: string;

    constructor(url: string) {
        super();
        this.url = url;
    }

    protected getPostfixUri(): string {
        return this.url;
    }

    protected parseResponse(response: JsonResponse<StatusJson>): StatusResult {
        return new StatusResult(response.getResult());
    }
}
