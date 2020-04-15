import {ResourceRequest} from '../rest/ResourceRequest';

export class SecurityResourceRequest<PARSED_TYPE>
    extends ResourceRequest<PARSED_TYPE> {

    constructor() {
        super();
        this.addRequestPathElements('security');
    }

}
