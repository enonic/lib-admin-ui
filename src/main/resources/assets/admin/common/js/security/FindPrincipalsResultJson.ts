module api.security {

    export interface FindPrincipalsResultJson {

        principals: api.security.PrincipalJson[];

        hits: number;

        totalSize: number;
    }
}
