import * as Q from 'q';
import {HttpRequest} from './HttpRequest';
import {UriHelper} from '../util/UriHelper';
import {Path} from './Path';
import {JsonResponse} from './JsonResponse';
import {Request} from './Request';
import {HttpMethod} from './HttpMethod';
import {GetRequest} from './GetRequest';
import {PostRequest} from './PostRequest';
import {Response} from './Response';

export abstract class ResourceRequest<PARSED_TYPE>
    implements HttpRequest<PARSED_TYPE> {

    protected restPath: Path;

    protected method: HttpMethod = HttpMethod.GET;

    protected heavyOperation: boolean;

    protected timeoutMillis: number;

    protected isFormRequest: boolean = false;

    protected isJsonResponse: boolean = true;

    private pathElements: string[] = [];

    constructor() {
        this.restPath = Path.fromString(this.getPostfixUri());
    }

    protected getPostfixUri() {
        return UriHelper.getRestUri('');
    }

    protected addRequestPathElements(...items: string[]) {
        this.pathElements.push(...items);
    }

    setMethod(value: string | HttpMethod) {
        if (typeof value === 'string') {
            this.method = HttpMethod[value.toUpperCase()];
            return;
        }
        this.method = value as HttpMethod;
    }

    protected getRestPath(): Path {
        return this.restPath;
    }

    getRequestPath(): Path {
        return Path.fromParent(this.getRestPath(), ...this.pathElements);
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

    setIsJsonResponse(value: boolean) {
        this.isJsonResponse = value;
    }

    validate() {
        // Override to ensure any validation of ResourceRequest before sending.
    }

    send(): Q.Promise<Response> {
        this.validate();

        const request: Request = this.createRequest()
            .setParams(this.getParams())
            .setPath(this.getRequestPath())
            .setTimeout(!this.heavyOperation ? this.timeoutMillis : 0);

        return request.send().then((rawResponse: any) => {
            return this.isJsonResponse ? new JsonResponse(rawResponse) : new Response(rawResponse);
        });
    }

    private createRequest(): Request {
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
        return this.send().then((response: Response) => {
            return this.parseResponse(response);
        });
    }

    protected parseResponse(response: Response): PARSED_TYPE {
        return response.getResult();
    }
}
