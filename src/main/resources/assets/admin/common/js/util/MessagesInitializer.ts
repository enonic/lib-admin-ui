import * as Q from 'q';
import {JsonResponse} from '../rest/JsonResponse';
import {Path} from '../rest/Path';
import {Messages} from './Messages';
import {ResourceRequest} from '../rest/ResourceRequest';
import {HttpMethod} from '../rest/HttpMethod';

function getMessages(url: string, bundles?: string[]): Q.Promise<KeysJson> {
    const request: GetMessagesRequest = new GetMessagesRequest(url, bundles);

    if (!!bundles && bundles.length) {
        request.setMethod(HttpMethod.POST);
        request.setIsFormRequest(true);
    }

    return request.send().then((response: JsonResponse<KeysJson>) => {
        return response.getResult();
    });
}

export function i18nInit(url: string, bundles?: string[]): Q.Promise<void> {
    if (!Messages.isEmpty()) {
        return Q(null);
    }

    return getMessages(url, bundles).then((messages: KeysJson) => {
        Messages.setMessages(messages);
        return Q(null);
    });
}

export function i18nFetch(url: string, bundles?: string[]): Q.Promise<Map<string, string>> {
    return getMessages(url, bundles).then((messages: KeysJson) => {
        let map = new Map<string, string>();
        for (let key in messages) {
            if (messages.hasOwnProperty(key)) {
                map.set(key, messages[key]);
            }
        }
        return Q(map);
    });
}

export function i18nAdd(url: string, bundles?: string[]): Q.Promise<void> {
    return getMessages(url, bundles).then((messages: KeysJson) => {
        Messages.addMessages(messages);
        return Q(null);
    });
}

export interface KeysJson {
    key: string;
}

class GetMessagesRequest
    extends ResourceRequest<void> {

    private readonly url: string;

    private readonly bundles: string[];

    constructor(url: string, bundles?: string[]) {
        super();

        this.url = url;
        this.bundles = bundles;
    }

    getRequestPath(): Path {
        return Path.create().fromString(this.url).build();
    }

    getParams(): Object {
        if (!this.bundles) {
            return {};
        }
        return {
            bundles: this.bundles
        };
    }
}
