import {Principal} from '../../security/Principal';
import {PrincipalKey} from '../../security/PrincipalKey';

export class PrincipalContainer {

    protected principal: Principal;

    constructor(principal: Principal) {
        this.principal = principal;
    }

    getPrincipal(): Principal {
        return this.principal;
    }

    getPrincipalKey(): PrincipalKey {
        return this.principal.getKey();
    }

    getPrincipalDisplayName(): string {
        return this.principal.getDisplayName();
    }

    getPrincipalTypeName(): string {
        return this.principal.getTypeName();
    }
}
