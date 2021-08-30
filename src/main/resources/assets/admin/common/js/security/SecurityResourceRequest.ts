import {ResourceRequest} from '../rest/ResourceRequest';
import {Path} from '../rest/Path';

export class SecurityResourceRequest<PARSED_TYPE>
    extends ResourceRequest<PARSED_TYPE> {

    private requestUri: string;

    constructor(requestUri?: string) {
        super();
        this.requestUri = requestUri;
        this.addRequestPathElements('security');
    }

    setRequestUri(requestUri: string): SecurityResourceRequest<PARSED_TYPE> {
        this.requestUri = requestUri;
        return this;
    }

    getRequestPath(): Path {
        return this.requestUri ? Path.fromString(this.requestUri) : super.getRequestPath();
    }

}
