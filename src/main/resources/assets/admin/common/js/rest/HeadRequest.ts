import {Request} from './Request';
import {BrowserHelper} from '../BrowserHelper';
import {HttpMethod} from './HttpMethod';
import {UriHelper} from '../util/UriHelper';

export class HeadRequest
    extends Request {

    constructor() {
        super(HttpMethod.HEAD);
    }

    protected prepareRequest(): void {
        super.prepareRequest();

        if (BrowserHelper.isIE()) {
            this.request.setRequestHeader('Pragma', 'no-cache');
            this.request.setRequestHeader('Cache-Control', 'no-cache');
        }
    }

    protected createRequestURI(): string {
        const uriString: string = UriHelper.appendUrlParams(this.path.toString(), this.params);
        return UriHelper.getUri(uriString, true);
    }

}
