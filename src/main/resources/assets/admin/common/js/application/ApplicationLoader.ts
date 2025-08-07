import Q from 'q';
import {BaseLoader} from '../util/loader/BaseLoader';
import {Application} from './Application';
import {ListApplicationsRequest} from './ListApplicationsRequest';

export abstract class ApplicationLoader
    extends BaseLoader<Application> {

    declare protected request: ListApplicationsRequest;

    private filterObject: object;

    constructor(filterObject: object) {
        super();

        if (filterObject) {
            this.filterObject = filterObject;
        }
    }

    protected abstract createRequest(): ListApplicationsRequest;

    search(searchString: string): Q.Promise<Application[]> {
        this.getRequest().setSearchQuery(searchString);
        return this.load();
    }

    setSearchString(value: string) {
        super.setSearchString(value);
        this.getRequest().setSearchQuery(value);
    }

    load(): Q.Promise<Application[]> {
        this.notifyLoadingData();

        return this.sendRequest()
            .then((applications: Application[]) => {
                if (this.filterObject) {
                    applications = applications.filter(this.filterResults, this);
                }
                this.notifyLoadedData(applications);

                return applications;
            });
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
