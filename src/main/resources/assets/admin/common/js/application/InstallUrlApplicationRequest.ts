import {ApplicationInstallResultJson} from './json/ApplicationInstallResultJson';
import {JsonResponse} from '../rest/JsonResponse';
import {ApplicationResourceRequest} from './ApplicationResourceRequest';
import {ApplicationInstallResult} from './ApplicationInstallResult';
import {HttpMethod} from '../rest/HttpMethod';

export class InstallUrlApplicationRequest
    extends ApplicationResourceRequest<ApplicationInstallResult> {

    private applicationUrl: string;

    constructor(applicationUrl: string) {
        super();
        this.setMethod(HttpMethod.POST);
        this.applicationUrl = applicationUrl;
        this.setHeavyOperation(true);
        this.addRequestPathElements('installUrl');
    }

    getParams(): Object {
        return {
            URL: this.applicationUrl
        };
    }

    protected parseResponse(response: JsonResponse<ApplicationInstallResultJson>): ApplicationInstallResult {
        return ApplicationInstallResult.fromJson(response.getResult());
    }
}
