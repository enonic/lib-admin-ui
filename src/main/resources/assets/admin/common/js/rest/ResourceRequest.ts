import * as Q from 'q';
import {HttpRequest} from './HttpRequest';
import {UriHelper} from '../util/UriHelper';
import {Path} from './Path';
import {JsonResponse} from './JsonResponse';
import {JsonRequest} from './JsonRequest';
import {HttpMethod} from './HttpMethod';
import {GetRequest} from './GetRequest';
import {PostRequest} from './PostRequest';

export class ResourceRequest<RAW_JSON_TYPE, PARSED_TYPE>
    implements HttpRequest<PARSED_TYPE> {

    protected restPath: Path;

    protected method: HttpMethod = HttpMethod.GET;

    protected heavyOperation: boolean;

    protected timeoutMillis: number;

    protected isFormRequest: boolean = false;

    constructor() {
        this.restPath = Path.fromString(UriHelper.getRestUri(''));
    }

    setMethod(value: HttpMethod) {
        this.method = value;
    }

    getRestPath(): Path {
        return this.restPath;
    }

    getRequestPath(): Path {
        throw new Error('Must be implemented by inheritors');
    }

    getParams(): Object {
        return {};
    }

    setTimeout(timeoutMillis: number) {
        this.timeoutMillis = timeoutMillis;
    }

    setHeavyOperation(value: boolean) {
        this.heavyOperation = value;
    }

    setIsFormRequest(value: boolean) {
        this.isFormRequest = value;
    }

    validate() {
        // Override to ensure any validation of ResourceRequest before sending.
    }

    send(): Q.Promise<JsonResponse<RAW_JSON_TYPE>> {
        this.validate();

        const deferred: Q.Deferred<JsonResponse<RAW_JSON_TYPE>> = Q.defer<JsonResponse<RAW_JSON_TYPE>>();
        const request: JsonRequest = this.createJsonRequest()
            .setParams(this.getParams())
            .setPath(this.getRequestPath())
            .setTimeout(!this.heavyOperation ? this.timeoutMillis : 0)
            .handleReadyStateChanged(deferred);

        request.send();

        return deferred.promise;
    }

    private createJsonRequest(): JsonRequest {
        if (HttpMethod.GET === this.method) {
            return new GetRequest();
        }

        if (HttpMethod.POST === this.method) {
            const request: PostRequest = new PostRequest();
            request.setIsFormRequest(this.isFormRequest);
            return request;
        }

        throw new Error(`Request for "${this.method}" HTTP method Not Implemented`);
    }

    sendAndParse(): Q.Promise<PARSED_TYPE> {
        throw new Error('sendAndParse method was not implemented');
    }
}
