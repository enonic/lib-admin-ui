import Q from 'q';
import {UriHelper} from '../util/UriHelper';
import {GetRequest} from './GetRequest';
import {HeadRequest} from './HeadRequest';
import {HttpMethod} from './HttpMethod';
import {HttpRequest} from './HttpRequest';
import {JsonResponse} from './JsonResponse';
import {Path} from './Path';
import {PostRequest} from './PostRequest';
import {Request} from './Request';
import {Response} from './Response';

export abstract class ResourceRequest<PARSED_TYPE>
    implements HttpRequest<PARSED_TYPE> {

    protected restPath: Path;

    protected method: HttpMethod = HttpMethod.GET;

    protected heavyOperation: boolean;

    protected timeoutMillis: number;

    protected isFormRequest: boolean = false;

    protected isJsonResponse: boolean = true;

    protected postfixUri: string;

    private pathElements: string[] = [];

    constructor() {
        //
    }

    protected getPostfixUri(): string {
        return this.postfixUri ?? UriHelper.getRestUri('');
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

    setPostfixUri(value: string): this {
        this.postfixUri = value;
        return this;
    }

    getRestPath(): Path {
        if (!this.restPath) {
            this.restPath = Path.create().fromString(this.getPostfixUri()).build();
        }

        return this.restPath;
    }

    getRequestPath(): Path {
        return Path.create().fromParent(this.getRestPath(), ...this.pathElements).build();
    }

    getParams(): object {
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
            return this.isJsonResponse ? new JsonResponse(rawResponse, request.getStatus()) : new Response(rawResponse, request.getStatus());
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

        if (HttpMethod.HEAD === this.method) {
            return new HeadRequest();
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
