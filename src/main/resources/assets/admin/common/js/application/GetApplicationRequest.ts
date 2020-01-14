import * as Q from 'q';
import {ApplicationJson} from './json/ApplicationJson';
import {Path} from '../rest/Path';
import {JsonResponse} from '../rest/JsonResponse';
import {ApplicationResourceRequest} from './ApplicationResourceRequest';
import {ApplicationKey} from './ApplicationKey';
import {Application} from './Application';
import {ApplicationCache} from './ApplicationCache';

export class GetApplicationRequest
    extends ApplicationResourceRequest<ApplicationJson, Application> {

    private applicationKey: ApplicationKey;

    private skipCache: boolean;

    constructor(applicationKey: ApplicationKey, skipCache: boolean = false) {
        super();
        this.applicationKey = applicationKey;
        this.skipCache = skipCache;
        this.setHeavyOperation(true);
    }

    getParams(): Object {
        return {
            applicationKey: this.applicationKey.toString()
        };
    }

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath());
    }

    sendAndParse(): Q.Promise<Application> {

        let cache = ApplicationCache.get();
        let appObj = this.skipCache ? null : cache.getByKey(this.applicationKey);
        if (appObj) {
            return Q(appObj);
        } else {
            return this.send().then((response: JsonResponse<ApplicationJson>) => {
                appObj = this.fromJsonToApplication(response.getResult());
                cache.put(appObj);
                return appObj;
            });
        }
    }
}
