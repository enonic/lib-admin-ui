import {ResourceRequest} from '../../rest/ResourceRequest';

export class AuthResourceRequest<PARSED_TYPE>
    extends ResourceRequest<PARSED_TYPE> {

    constructor() {
        super();
        this.addRequestPathElements('auth');
    }

}
