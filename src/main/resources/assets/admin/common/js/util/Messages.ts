module api.util {

    import JsonRequest = api.rest.JsonRequest;
    import JsonResponse = api.rest.JsonResponse;

    let messages: Object;

    export function i18nInit(url: string): wemQ.Promise<Object> {

        if (!!messages) {
            return wemQ.resolve(messages);
        }

        const request = new JsonRequest<KeysJson>();
        request.setPath(api.rest.Path.fromString(url));

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

}
