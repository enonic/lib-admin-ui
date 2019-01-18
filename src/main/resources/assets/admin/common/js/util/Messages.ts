module api.util {

    let messages: Object = {};

    export function i18nInit(bundle: Object): wemQ.Promise<void> {
        messages = bundle;

        return wemQ(null);
    }

    export function i18n(key: string, ...args: any[]): string {
        let message = '#' + key + '#';

        if ((messages != null) && (messages[key] != null)) {
            message = messages[key];
        }

        return message.replace(/{(\d+)}/g, function (_substring: string, ...replaceArgs: any[]) {
            return args[replaceArgs[0]];
        }).trim();
    }
}
