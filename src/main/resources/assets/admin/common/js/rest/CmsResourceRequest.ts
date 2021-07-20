import {ResourceRequest} from './ResourceRequest';
import {UriHelper} from '../util/UriHelper';

export abstract class CmsResourceRequest<PARSED_TYPE>
    extends ResourceRequest<PARSED_TYPE> {

    getPostfixUri() {
        return UriHelper.getAdminUri(UriHelper.joinPath('v2', 'rest'));
    }
}
