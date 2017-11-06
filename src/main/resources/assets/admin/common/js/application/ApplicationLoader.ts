module api.application {

    export class ApplicationLoader
        extends api.util.loader.BaseLoader<ApplicationListResult, Application> {

        protected request: ListApplicationsRequest;

        private filterObject: Object;

        constructor(filterObject: Object, request?: ListApplicationsRequest) {
            super(request);

            if (filterObject) {
                this.filterObject = filterObject;
            }
        }

        protected createRequest(): ListApplicationsRequest {
            return new ListApplicationsRequest();
        }

        protected getRequest(): ListApplicationsRequest {
            return this.request;
        }

        search(searchString: string): wemQ.Promise<Application[]> {
            this.getRequest().setSearchQuery(searchString);
            return this.load();
        }

        load(): wemQ.Promise<Application[]> {
            let me = this;
            me.notifyLoadingData();

            return me.sendRequest()
                .then((applications: Application[]) => {
                    if (me.filterObject) {
                        applications = applications.filter(me.filterResults, me);
                    }
                    me.notifyLoadedData(applications);

                    return applications;
                });
        }

        private filterResults(application: Application): boolean {
            if (!this.filterObject) {
                return true;
            }

            let result = true;
            for (let name in this.filterObject) {
                if (this.filterObject.hasOwnProperty(name)) {
                    if (!application.hasOwnProperty(name) || this.filterObject[name] !== application[name]) {
                        result = false;
                    }
                }
            }

            return result;
        }

    }
}
