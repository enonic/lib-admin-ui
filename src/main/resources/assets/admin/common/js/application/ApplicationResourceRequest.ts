import {ResourceRequest} from '../rest/ResourceRequest';
import {Application} from './Application';
import {ApplicationJson} from './json/ApplicationJson';

export abstract class ApplicationResourceRequest<PARSED_TYPE>
    extends ResourceRequest<PARSED_TYPE> {

    abstract getPostfixUri(): string;

    constructor() {
        super();
        this.addRequestPathElements('application');
    }

    fromJsonToApplication(json: ApplicationJson): Application {
        return Application.fromJson(json);
    }
}
