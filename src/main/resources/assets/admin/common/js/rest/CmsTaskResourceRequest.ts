import {TaskResourceRequest} from './TaskResourceRequest';
import {UriHelper} from '../util/UriHelper';

export class CmsTaskResourceRequest<PARSED_TYPE>
    extends TaskResourceRequest<PARSED_TYPE> {

    getPostfixUri() {
        return UriHelper.getAdminUri(UriHelper.joinPath('v2', 'rest'));
    }

}
