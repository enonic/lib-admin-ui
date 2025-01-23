import {AuthContext} from './AuthContext';
import {RoleKeys} from '../security/RoleKeys';
import {PrincipalKey} from '../security/PrincipalKey';


export class AuthHelper {

    static isContentAdmin(): boolean {
        return AuthContext.get().getPrincipals().some(principal => RoleKeys.isContentAdmin(principal.getKey()));
    }

    static isUserAdmin(): boolean {
        return AuthContext.get().getPrincipals().some(principal => RoleKeys.isUserAdmin(principal.getKey()));
    }

    static isContentExpert(): boolean {
        return AuthContext.get().getPrincipals().some(principal => RoleKeys.isContentExpert(principal.getKey()));
    }

    static isAdmin(): boolean {
        return AuthContext.get().getPrincipals().some(principal => RoleKeys.isAdmin(principal.getKey()));
    }

    static getPrincipalsKeys(): PrincipalKey[] {
        return AuthContext.get().getPrincipals().map(principal => principal.getKey());
    }
}
