import * as Q from 'q';
import {BaseLoader} from '../../util/loader/BaseLoader';
import {Application} from '../../application/Application';
import {ListIdProviderApplicationsRequest} from '../../application/ListIdProviderApplicationsRequest';

export class AuthApplicationLoader
    extends BaseLoader<Application> {

    constructor() {
        super(new ListIdProviderApplicationsRequest());
    }

    filterFn(application: Application) {
        return application.getDisplayName().toString().toLowerCase().indexOf(this.getSearchString().toLowerCase()) !== -1;
    }

    search(searchString: string): Q.Promise<Application[]> {
        if (this.getResults()) {
            return super.search(searchString);
        }
        return this.load().then(() => super.search(searchString));
    }
}
