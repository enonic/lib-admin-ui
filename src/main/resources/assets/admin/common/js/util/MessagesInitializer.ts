import * as Q from 'q';
import {JsonRequest} from '../rest/JsonRequest';
import {JsonResponse} from '../rest/JsonResponse';
import {Path} from '../rest/Path';
import {Messages} from './Messages';

export function i18nInit(url: string): Q.Promise<void> {

    if (!Messages.empty()) {
        return Q(null);
    }

    const request = new JsonRequest<KeysJson>();
    request.setPath(Path.fromString(url));

    return request.send().then((response: JsonResponse<KeysJson>) => {
        const messages = response.getResult();
        Messages.setMessages(messages);
    });
}

export interface KeysJson {
    key: string;
}
