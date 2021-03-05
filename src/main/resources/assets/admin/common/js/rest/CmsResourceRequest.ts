import {ResourceRequest} from './ResourceRequest';
import {UriHelper} from '../util/UriHelper';

export abstract class CmsResourceRequest<PARSED_TYPE>
    extends ResourceRequest<PARSED_TYPE> {

    protected getPostfixUri() {
        return UriHelper.getCmsRestUri('');
    }
}
