import {JsonResponse} from '../rest/JsonResponse';
import {SecurityResourceRequest} from './SecurityResourceRequest';
import {PrincipalJson} from './PrincipalJson';
import {Principal} from './Principal';
import {PrincipalKey} from './PrincipalKey';
import {HttpMethod} from '../rest/HttpMethod';

export class GetPrincipalsByKeysRequest
    extends SecurityResourceRequest<Principal[]> {

    private principalKeys: PrincipalKey[];

    private includeMemberships: boolean;

    constructor(principalKeys: PrincipalKey[]) {
        super();
        this.setMethod(HttpMethod.POST);
        this.principalKeys = principalKeys;
        this.includeMemberships = false;
        this.addRequestPathElements('principals', 'resolveByKeys');
    }

    setIncludeMemberships(includeMemberships: boolean): GetPrincipalsByKeysRequest {
        this.includeMemberships = includeMemberships;
        return this;
    }

    getParams(): object {
        return {
            keys: this.principalKeys.map(key => key.toString()),
            memberships: this.includeMemberships
        };
    }

    protected parseResponse(response: JsonResponse<PrincipalJson[]>): Principal[] {
        return response.getResult().map(principal => Principal.fromJson(principal));
    }
}
