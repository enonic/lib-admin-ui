import * as Q from 'q';
import {Path} from '../rest/Path';
import {JsonResponse} from '../rest/JsonResponse';
import {SecurityResourceRequest} from './SecurityResourceRequest';
import {PrincipalJson} from './PrincipalJson';
import {Principal} from './Principal';
import {PrincipalKey} from './PrincipalKey';
import {HttpMethod} from '../rest/HttpMethod';

export class GetPrincipalsByKeysRequest
    extends SecurityResourceRequest<PrincipalJson[], Principal[]> {

    private principalKeys: PrincipalKey[];

    private includeMemberships: boolean;

    constructor(principalKeys: PrincipalKey[]) {
        super();
        this.setMethod(HttpMethod.POST);
        this.principalKeys = principalKeys;
        this.includeMemberships = false;
    }

    setIncludeMemberships(includeMemberships: boolean): GetPrincipalsByKeysRequest {
        this.includeMemberships = includeMemberships;
        return this;
    }

    getParams(): Object {
        return {
            keys: this.principalKeys.map(key => key.toString()),
            memberships: this.includeMemberships
        };
    }

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'principals/resolveByKeys');
    }

    sendAndParse(): Q.Promise<Principal[]> {

        return this.send().then((response: JsonResponse<PrincipalJson[]>) => {
            return response.getResult().map(principal => Principal.fromJson(principal));
        });
    }

}
