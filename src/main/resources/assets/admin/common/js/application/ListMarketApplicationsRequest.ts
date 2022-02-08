import {MarketApplicationsListJson} from './json/MarketApplicationsListJson';
import {JsonResponse} from '../rest/JsonResponse';
import {MarketApplicationResponse} from './MarketApplicationResponse';
import {MarketApplication} from './MarketApplication';
import {MarketApplicationMetadata} from './MarketApplicationMetadata';
import {PostRequest} from '../rest/PostRequest';
import * as Q from 'q';
import {UriHelper} from '../util/UriHelper';

export class ListMarketApplicationsRequest
    extends PostRequest {

    private version: string;
    private start: number = 0;
    private count: number = 10;
    private ids: string[] = [];
    private url: string = 'https://market.enonic.com/applications';

    setUrl(url: string): ListMarketApplicationsRequest {
        this.url = url;
        return this;
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

    protected createRequestURI(): string {
        return UriHelper.appendUrlParams(this.url, this.params);
    }

    protected createRequestData(): any {

        if (this.ids && this.ids.length > 0) {
            this.params = {
                ids: this.ids
            };
        }

        return super.createRequestData();
    }

    sendAndParse(): Q.Promise<MarketApplicationResponse> {
        this.params = {
            xpVersion: this.version,
            start: this.start,
            count: this.count
        };

        return this.send().then((rawResponse: any) => {
            const response = new JsonResponse<MarketApplicationsListJson>(rawResponse);
            return ListMarketApplicationsRequest.parseResponse(response);
        });
    }

    private static parseResponse(response: JsonResponse<MarketApplicationsListJson>): MarketApplicationResponse {
        const applications: MarketApplication[] = MarketApplication.fromJsonArray(response.getResult().hits);
        const hits: number = applications.length;
        const totalHits: number = response.getResult().total;
        return new MarketApplicationResponse(applications, new MarketApplicationMetadata(hits, totalHits));
    }
}
