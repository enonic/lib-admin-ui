import {LocaleListJson} from './json/LocaleListJson';
import {LocaleJson} from './json/LocaleJson';
import {ResourceRequest} from '../rest/ResourceRequest';
import {Path} from '../rest/Path';
import {JsonResponse} from '../rest/JsonResponse';
import {Locale} from './Locale';

export class GetLocalesRequest
    extends ResourceRequest<LocaleListJson, Locale[]> {

    private searchQuery: string;

    constructor() {
        super();
    }

    getParams(): Object {
        return {
            query: this.searchQuery
        };
    }

    getRequestPath(): Path {
        return Path.fromParent(super.getRestPath(), 'content', 'locales');
    }

    setSearchQuery(query: string): GetLocalesRequest {
        this.searchQuery = query;
        return this;
    }

    sendAndParse(): Q.Promise<Locale[]> {
        return this.send().then((response: JsonResponse<LocaleListJson>) => {
            return response.getResult().locales.map((localeJson: LocaleJson) => {
                return Locale.fromJson(localeJson);
            }).sort(this.sortFunction);
        });
    }

    private sortFunction(a: Locale, b: Locale) {
        return a.getDisplayName().localeCompare(b.getDisplayName());
    }
}
