import {LoginResultJson} from './LoginResultJson';
import {RoleKeys} from '../RoleKeys';
import {Principal} from '../Principal';
import {PrincipalKey} from '../PrincipalKey';

export class LoginResult {

    private authenticated: boolean;

    private user: Principal;

    private principals: PrincipalKey[];

    private message: string;

    constructor(json: LoginResultJson) {
        this.authenticated = json.authenticated;
        if (json.user) {
            this.user = Principal.fromJson(json.user);
        }
        this.principals = json.principals ?
                          json.principals.map((principal) => PrincipalKey.fromString(principal)) : [];
        this.message = json.message;
    }

    isAuthenticated(): boolean {
        return this.authenticated;
    }

    isContentAdmin(): boolean {
        return this.principals.some(principalKey => RoleKeys.isContentAdmin(principalKey));
    }

    isUserAdmin(): boolean {
        return this.principals.some(principalKey => RoleKeys.isUserAdmin(principalKey));
    }

    isContentExpert(): boolean {
        return this.principals.some(principalKey => RoleKeys.isContentExpert(principalKey));
    }

    getUser(): Principal {
        return this.user;
    }

    getPrincipals(): PrincipalKey[] {
        return this.principals;
    }

    getMessage(): string {
        return this.message;
    }
}
