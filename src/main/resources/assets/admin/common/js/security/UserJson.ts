module api.security {

    export interface UserJson extends PrincipalJson {

        name: string;

        email: string;

        login: string;

        loginDisabled: boolean;

        memberships?: PrincipalJson[];

    }
}
