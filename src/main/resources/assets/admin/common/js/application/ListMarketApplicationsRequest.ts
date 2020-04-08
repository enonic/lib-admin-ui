import {ApplicationResourceRequest} from './ApplicationResourceRequest';
import {MarketApplicationsListJson} from './json/MarketApplicationsListJson';
import {JsonResponse} from '../rest/JsonResponse';
import {MarketApplicationResponse} from './MarketApplicationResponse';
import {MarketApplication} from './MarketApplication';
import {MarketApplicationMetadata} from './MarketApplicationMetadata';
import {HttpMethod} from '../rest/HttpMethod';

export class ListMarketApplicationsRequest
    extends ApplicationResourceRequest<MarketApplicationResponse> {

    private version: string;
    private start: number = 0;
    private count: number = 10;
    private ids: string[] = [];

    constructor() {
        super();
        this.setMethod(HttpMethod.POST);
        this.addRequestPathElements('getMarketApplications');
    }

    setIds(ids: string[]): ListMarketApplicationsRequest {
        this.ids = ids;
        return this;
    }

    setVersion(version: string, preprocess: boolean = true): ListMarketApplicationsRequest {
        this.version = preprocess ? version.replace(/-.*$/, '') : version;
        return this;
    }

    setStart(start: number): ListMarketApplicationsRequest {
        this.start = start;
        return this;
    }

    setCount(count: number): ListMarketApplicationsRequest {
        this.count = count;
        return this;
    }

    getParams(): Object {
        return {
            ids: this.ids,
            version: this.version,
            start: this.start,
            count: this.count,
        };
    }

    protected parseResponse(response: JsonResponse<MarketApplicationsListJson>): MarketApplicationResponse {
        const applications: MarketApplication[] = MarketApplication.fromJsonArray(response.getResult().hits);
        const hits: number = applications.length;
        const totalHits: number = response.getResult().total;
        return new MarketApplicationResponse(applications, new MarketApplicationMetadata(hits, totalHits));
    }
}
