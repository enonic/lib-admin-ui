import * as Q from 'q';
import {Path} from '../rest/Path';
import {JsonResponse} from '../rest/JsonResponse';
import {ApplicationResourceRequest} from './ApplicationResourceRequest';
import {ApplicationListResult} from './ApplicationListResult';
import {Application} from './Application';

export class ListApplicationsRequest
    extends ApplicationResourceRequest<ApplicationListResult, Application[]> {

    private searchQuery: string;
    private apiName: string;

    constructor(apiName: string = 'list') {
        super();

        this.apiName = apiName;
    }

    getParams(): Object {
        return {
            query: this.searchQuery
        };
    }

    setSearchQuery(query: string): ListApplicationsRequest {
        this.searchQuery = query;
        return this;
    }

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), this.apiName);
    }

    sendAndParse(): Q.Promise<Application[]> {

        return this.send().then((response: JsonResponse<ApplicationListResult>) => {
            return Application.fromJsonArray(response.getResult().applications);
        });
    }
}
