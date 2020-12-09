import * as Q from 'q';
import {JsonResponse} from '../rest/JsonResponse';
import {Path} from '../rest/Path';
import {Messages} from './Messages';
import {ResourceRequest} from '../rest/ResourceRequest';
import {HttpMethod} from '../rest/HttpMethod';

export function i18nInit(url: string, bundles?: string[]): Q.Promise<void> {
    Messages.clear();
    return doI18n(url, bundles);
}

export function i18nAdd(url: string, bundles?: string[]): Q.Promise<void> {
    return doI18n(url, bundles);
}

function doI18n(url: string, bundles?: string[]) {
    const request: GetMessagesRequest = new GetMessagesRequest(url, bundles);
    if (!!bundles && bundles.length) {
        request.setMethod(HttpMethod.POST);
        request.setIsFormRequest(true);
    }

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

    private readonly url: string;

    private readonly bundles: string[];

    constructor(url: string, bundles?: string[]) {
        super();

        this.url = url;
        this.bundles = bundles;
    }

    getRequestPath(): Path {
        return Path.fromString(this.url);
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
