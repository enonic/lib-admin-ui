import * as Q from 'q';
import {Path} from '../rest/Path';
import {JsonResponse} from '../rest/JsonResponse';
import {ApplicationResourceRequest} from './ApplicationResourceRequest';
import {ApplicationListResult} from './ApplicationListResult';
import {Application} from './Application';

export class ListIdProviderApplicationsRequest
    extends ApplicationResourceRequest<ApplicationListResult, Application[]> {

    constructor() {
        super();
        super.setMethod('GET');
    }

    getParams(): Object {
        return {};
    }

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'getIdProviderApplications');
    }

    sendAndParse(): Q.Promise<Application[]> {
        return this.send().then((response: JsonResponse<ApplicationListResult>) => {
            return Application.fromJsonArray(response.getResult().applications);
        });
    }
}
