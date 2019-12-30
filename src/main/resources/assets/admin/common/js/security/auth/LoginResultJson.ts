import {PrincipalJson} from '../PrincipalJson';

export interface LoginResultJson {

    authenticated: boolean;

    user: PrincipalJson;

    principals: string[];

    message?: string;
}
