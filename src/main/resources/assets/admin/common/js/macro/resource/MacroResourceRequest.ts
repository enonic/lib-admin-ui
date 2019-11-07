import {ResourceRequest} from '../../rest/ResourceRequest';
import {Path} from '../../rest/Path';

export class MacroResourceRequest<JSON_TYPE, PARSED_TYPE>
    extends ResourceRequest<JSON_TYPE, PARSED_TYPE> {

    private resourcePath: Path;

    constructor() {
        super();
        this.resourcePath = Path.fromParent(super.getRestPath(), 'macro');
    }

    getResourcePath(): Path {
        return this.resourcePath;
    }
}
