import * as Q from 'q';
import {BaseLoader} from '../util/loader/BaseLoader';
import {Application} from './Application';
import {ListApplicationsRequest} from './ListApplicationsRequest';

export class ApplicationLoader
    extends BaseLoader<Application> {

    protected request: ListApplicationsRequest;

    private filterObject: Object;

    constructor(filterObject: Object, request?: ListApplicationsRequest) {
        super(request);

        if (filterObject) {
            this.filterObject = filterObject;
        }
    }

    search(searchString: string): Q.Promise<Application[]> {
        this.getRequest().setSearchQuery(searchString);
        return this.load();
    }

    setSearchString(value: string) {
        super.setSearchString(value);
        this.getRequest().setSearchQuery(value);
    }

    load(): Q.Promise<Application[]> {
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

    protected createRequest(): ListApplicationsRequest {
        return new ListApplicationsRequest();
    }

    protected getRequest(): ListApplicationsRequest {
        return this.request;
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
