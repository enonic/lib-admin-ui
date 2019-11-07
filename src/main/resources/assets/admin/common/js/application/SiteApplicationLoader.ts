import {ListSiteApplicationsRequest} from './ListSiteApplicationsRequest';
import {ApplicationLoader} from './ApplicationLoader';

export class SiteApplicationLoader
    extends ApplicationLoader {

    constructor(filterObject: Object) {
        super(filterObject, new ListSiteApplicationsRequest());
    }
}
