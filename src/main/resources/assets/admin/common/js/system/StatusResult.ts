import {PrincipalKey} from '../security/PrincipalKey';
import {StatusJson} from './StatusJson';

export class StatusResult {

    private installation: string;

    private version: string;

    private authenticated: boolean;

    private principals: PrincipalKey[];

    private readonly: boolean;

    constructor(json: StatusJson) {
        this.version = json.version;
        this.installation = json.installation;
        this.readonly = json.readonly === 'true';
        if (json.context) {
            this.authenticated = json.context.authenticated;
            this.principals = json.context.principals ?
                              json.context.principals.map((principal) => PrincipalKey.fromString(principal)) : [];
        } else {
            this.authenticated = false;
            this.principals = [];
        }
    }

    isAuthenticated(): boolean {
        return this.authenticated;
    }

    getInstallation(): string {
        return this.installation;
    }

    getVersion(): string {
        return this.version;
    }

    getPrincipals(): PrincipalKey[] {
        return this.principals;
    }

    isReadonly(): boolean {
        return this.readonly;
    }
}
