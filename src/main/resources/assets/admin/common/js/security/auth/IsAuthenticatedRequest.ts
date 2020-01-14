import * as Q from 'q';
import {Path} from '../../rest/Path';
import {JsonResponse} from '../../rest/JsonResponse';
import {AuthResourceRequest} from './AuthResourceRequest';
import {LoginResult} from './LoginResult';
import {LoginResultJson} from './LoginResultJson';

export class IsAuthenticatedRequest
    extends AuthResourceRequest<LoginResultJson, LoginResult> {

    getParams(): Object {
        return {};
    }

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'authenticated');
    }

    sendAndParse(): Q.Promise<LoginResult> {

        return this.send().then((response: JsonResponse<LoginResultJson>) => {
            return new LoginResult(response.getResult());
        });
    }

}
