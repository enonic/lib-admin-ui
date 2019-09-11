import {ListApplicationsRequest} from './ListApplicationsRequest';

export class ListSiteApplicationsRequest
    extends ListApplicationsRequest {

    constructor() {
        super('getSiteApplications');
    }

}
