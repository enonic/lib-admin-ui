import {ResourceRequest} from '../rest/ResourceRequest';

export abstract class TaskResourceRequest<PARSED_TYPE>
    extends ResourceRequest<PARSED_TYPE> {

    constructor() {
        super();
        this.addRequestPathElements('tasks');
    }

}
