module api.security.auth {

    import PrincipalJson = api.security.PrincipalJson;

    export interface LoginResultJson {

        authenticated: boolean;

        user: PrincipalJson;

        principals: string[];

        message?: string;
    }
}
