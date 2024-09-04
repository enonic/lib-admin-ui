import {JsonResponse} from '../rest/JsonResponse';
import {ApplicationResourceRequest} from './ApplicationResourceRequest';
import {ApplicationListResult} from './ApplicationListResult';
import {Application} from './Application';

export abstract class ListApplicationsRequest
    extends ApplicationResourceRequest<Application[]> {

    private searchQuery: string;

    constructor(apiName: string = 'list') {
        super();

        this.addRequestPathElements(apiName);
    }

    getParams(): object {
        return {
            query: this.searchQuery
        };
    }

    setSearchQuery(query: string): ListApplicationsRequest {
        this.searchQuery = query;
        return this;
    }

    protected parseResponse(response: JsonResponse<ApplicationListResult>): Application[] {
        return Application.fromJsonArray(response.getResult().applications);
    }
}
