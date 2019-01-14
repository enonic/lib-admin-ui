module api.security {

    export interface IdProviderConfigJson {
        applicationKey: string;
        config: api.data.PropertyArrayJson[];
    }
}
