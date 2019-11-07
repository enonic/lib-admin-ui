import {ResourceRequest} from '../../rest/ResourceRequest';
import {Path} from '../../rest/Path';

export class AuthResourceRequest<JSON_TYPE, PARSED_TYPE>
    extends ResourceRequest<JSON_TYPE, PARSED_TYPE> {

    private resourcePath: Path;

    constructor() {
        super();
        this.resourcePath = Path.fromParent(super.getRestPath(), 'auth');
    }

    getResourcePath(): Path {
        return this.resourcePath;
    }

}
