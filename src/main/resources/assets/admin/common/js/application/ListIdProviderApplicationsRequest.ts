import {JsonResponse} from '../rest/JsonResponse';
import {ApplicationResourceRequest} from './ApplicationResourceRequest';
import {ApplicationListResult} from './ApplicationListResult';
import {Application} from './Application';

export class ListIdProviderApplicationsRequest
    extends ApplicationResourceRequest<Application[]> {

    constructor() {
        super();

        this.addRequestPathElements('getIdProviderApplications');
    }

    protected parseResponse(response: JsonResponse<ApplicationListResult>): Application[] {
        return Application.fromJsonArray(response.getResult().applications);
    }
}
