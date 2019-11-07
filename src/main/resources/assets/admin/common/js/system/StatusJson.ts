export interface StatusJson {
    installation: string;
    version: string;
    readonly: string;
    context?: {
        authenticated: boolean;
        principals: string[];
    };
}
