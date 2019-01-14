module api.security.auth {

    import BaseLoader = api.util.loader.BaseLoader;
    import ApplicationListResult = api.application.ApplicationListResult;
    import Application = api.application.Application;

    //TODO: rename
    export class AuthApplicationLoader extends BaseLoader<ApplicationListResult, Application> {

        constructor() {
            super(new api.application.ListIdProviderApplicationsRequest());
        }

        filterFn(application: api.application.Application) {
            return application.getDisplayName().toString().toLowerCase().indexOf(this.getSearchString().toLowerCase()) !== -1;
        }

        search(searchString: string): wemQ.Promise<Application[]> {
            if (this.getResults()) {
                return super.search(searchString);
            }
            return this.load().then(() => super.search(searchString));
        }
    }
}
