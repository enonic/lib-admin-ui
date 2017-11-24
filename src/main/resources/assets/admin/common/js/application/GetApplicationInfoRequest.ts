module api.application {

    import ApplicationInfoJson = api.macro.resource.ApplicationInfoJson;

    export class GetApplicationInfoRequest
        extends ApplicationResourceRequest<ApplicationInfoJson, ApplicationInfo> {

        constructor() {
            super();
            super.setMethod('GET');
        }

        getRequestPath(): api.rest.Path {
            return api.rest.Path.fromParent(super.getResourcePath(), 'info');
        }

        fromJson(json: ApplicationInfoJson): ApplicationInfo {
            return ApplicationInfo.fromJson(json);
        }

        sendAndParse(): wemQ.Promise<ApplicationInfo> {

            return this.send().then((response: api.rest.JsonResponse<ApplicationInfoJson>) => {
                return this.fromJson(response.getResult());
            });
        }

    }
}
