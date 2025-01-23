import {Principal} from "../security/Principal";

export class AuthContext {

    private static INSTANCE: AuthContext;

    private readonly user: Principal;

    private readonly principals: Principal[];

    private constructor(user: Principal, principals: Principal[]) {
        this.user = user;
        this.principals = principals;
    }

    static get(): AuthContext {
        if (!AuthContext.INSTANCE) {
            throw new Error('AuthContext not initialized');
        }

        return AuthContext.INSTANCE;
    }

    static init(user: Principal, principals: Principal[]): void {
        AuthContext.INSTANCE = new AuthContext(user, principals);
    }

    getPrincipals(): Principal[] {
        return this.principals.slice();
    }

    getUser(): Principal {
        return this.user;
    }

}
