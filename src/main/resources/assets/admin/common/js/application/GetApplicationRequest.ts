import * as Q from 'q';
import {ApplicationJson} from './json/ApplicationJson';
import {JsonResponse} from '../rest/JsonResponse';
import {ApplicationResourceRequest} from './ApplicationResourceRequest';
import {ApplicationKey} from './ApplicationKey';
import {Application} from './Application';
import {ApplicationCache} from './ApplicationCache';

export abstract class GetApplicationRequest
    extends ApplicationResourceRequest<Application> {

    private applicationKey: ApplicationKey;

    private skipCache: boolean;

    constructor(applicationKey: ApplicationKey, skipCache: boolean = false) {
        super();
        this.applicationKey = applicationKey;
        this.skipCache = skipCache;
        this.setHeavyOperation(true);
    }

    getParams(): object {
        return {
            applicationKey: this.applicationKey.toString()
        };
    }

    sendAndParse(): Q.Promise<Application> {
        const cache: ApplicationCache = ApplicationCache.get();
        const appObj: Application = this.skipCache ? null : cache.getByKey(this.applicationKey);

        if (appObj) {
            return Q(appObj);
        }

        return super.sendAndParse();

    }

    protected parseResponse(response: JsonResponse<ApplicationJson>): Application {
        const app: Application = this.fromJsonToApplication(response.getResult());
        ApplicationCache.get().put(app);
        return app;
    }
}
