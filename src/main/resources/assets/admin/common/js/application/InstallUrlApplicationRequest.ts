import * as Q from 'q';
import {ApplicationInstallResultJson} from './json/ApplicationInstallResultJson';
import {Path} from '../rest/Path';
import {JsonResponse} from '../rest/JsonResponse';
import {ApplicationResourceRequest} from './ApplicationResourceRequest';
import {ApplicationInstallResult} from './ApplicationInstallResult';
import {HttpMethod} from '../rest/HttpMethod';

export class InstallUrlApplicationRequest
    extends ApplicationResourceRequest<ApplicationInstallResultJson, ApplicationInstallResult> {

    private applicationUrl: string;

    constructor(applicationUrl: string) {
        super();
        this.setMethod(HttpMethod.POST);
        this.applicationUrl = applicationUrl;
        this.setHeavyOperation(true);
    }

    getParams(): Object {
        return {
            URL: this.applicationUrl
        };
    }

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'installUrl');
    }

    sendAndParse(): Q.Promise<ApplicationInstallResult> {
        return this.send().then((response: JsonResponse<ApplicationInstallResultJson>) => {
            return ApplicationInstallResult.fromJson(response.getResult());
        });
    }
}
