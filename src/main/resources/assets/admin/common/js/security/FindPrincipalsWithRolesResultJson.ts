module api.security {

    export interface FindPrincipalsWithRolesResultJson {

        principals: api.security.PrincipalJson[];

        unfilteredSize: number;

        hasMore: boolean;
    }
}
