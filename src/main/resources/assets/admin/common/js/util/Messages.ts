import * as Q from 'q';
import {JsonRequest} from '../rest/JsonRequest';
import {JsonResponse} from '../rest/JsonResponse';
import {Path} from '../rest/Path';

let messages: Object;

export function i18nInit(url: string): Q.Promise<Object> {

    if (!!messages) {
        return Q.resolve(messages);
    }

    const request = new JsonRequest<KeysJson>();
    request.setPath(Path.fromString(url));

    return request.send().then((response: JsonResponse<KeysJson>) => {
        messages = response.getResult();

        return messages;
    });
}

export function i18n(key: string, ...args: any[]): string {
    let message = '#' + key + '#';

    if (!!messages && (messages[key] != null)) {
        message = messages[key];
    }

    return message.replace(/{(\d+)}/g, function (_substring: string, ...replaceArgs: any[]) {
        return args[replaceArgs[0]];
    }).trim();
}

export interface KeysJson {
    key: string;
}
