import * as Q from 'q';
import {JsonResponse} from '../rest/JsonResponse';
import {Path} from '../rest/Path';
import {Messages} from './Messages';
import {ResourceRequest} from '../rest/ResourceRequest';

export function i18nInit(url: string): Q.Promise<void> {

    if (!Messages.isEmpty()) {
        return Q(null);
    }

    const request: GetMessagesRequest = new GetMessagesRequest(url);

    return request.send().then((response: JsonResponse<KeysJson>) => {
        const messages: KeysJson = response.getResult();
        Messages.setMessages(messages);
    });
}

export interface KeysJson {
    key: string;
}

class GetMessagesRequest
    extends ResourceRequest<void> {

    private url: string;

    constructor(url: string) {
        super();

        this.url = url;
    }

    getRequestPath(): Path {
        return Path.fromString(this.url);
    }

}
