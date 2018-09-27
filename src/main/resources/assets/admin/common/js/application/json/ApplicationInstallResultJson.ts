module api.application.json {

    import ApplicationJson = api.application.json.ApplicationJson;

    export interface ApplicationInstallResultJson {

        applicationInstalledJson: ApplicationJson;

        failure: string;
    }
}
