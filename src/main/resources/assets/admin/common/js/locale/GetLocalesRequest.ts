import {LocaleListJson} from './json/LocaleListJson';
import {LocaleJson} from './json/LocaleJson';
import {ResourceRequest} from '../rest/ResourceRequest';
import {JsonResponse} from '../rest/JsonResponse';
import {Locale} from './Locale';

export class GetLocalesRequest
    extends ResourceRequest<Locale[]> {

    private searchQuery: string;

    constructor() {
        super();

        this.addRequestPathElements('content', 'locales');
    }

    getParams(): Object {
        return {
            query: this.searchQuery
        };
    }

    setSearchQuery(query: string): GetLocalesRequest {
        this.searchQuery = query;
        return this;
    }

    private sortFunction(a: Locale, b: Locale) {
        return a.getDisplayName().localeCompare(b.getDisplayName());
    }

    protected parseResponse(response: JsonResponse<LocaleListJson>): Locale[] {
        return response.getResult().locales.map((localeJson: LocaleJson) => {
            return Locale.fromJson(localeJson);
        }).sort(this.sortFunction);
    }
}
