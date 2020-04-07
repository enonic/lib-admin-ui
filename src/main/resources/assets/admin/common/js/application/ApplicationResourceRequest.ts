import {ResourceRequest} from '../rest/ResourceRequest';
import {Application} from './Application';
import {ApplicationJson} from './json/ApplicationJson';

export class ApplicationResourceRequest<PARSED_TYPE>
    extends ResourceRequest<PARSED_TYPE> {

    constructor() {
        super();
        this.addRequestPathElements('application');
    }

    fromJsonToApplication(json: ApplicationJson): Application {
        return Application.fromJson(json);
    }
}
