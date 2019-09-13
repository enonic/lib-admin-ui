export class Messages {

    private static storage: Map<string, string> = new Map<string, string>();

    static setMessages(messages: Object) {
        if (messages) {
            Messages.storage.clear();
            for (let key in messages) {
                if (messages.hasOwnProperty(key)) {
                    Messages.storage.set(key, messages[key]);
                }
            }
        }
    }

    static empty() {
        return Messages.storage == null || Messages.storage.size === 0;
    }

    static getMessage(key: string) {
        return Messages.storage.get(key);
    }

    static hasMessage(key: string) {
        return !Messages.empty() && Messages.storage.has(key);
    }
}

export function i18n(key: string, ...args: any[]): string {
    const message = Messages.hasMessage(key) ? Messages.getMessage(key) : `#${key}#`;

    return message.replace(/{(\d+)}/g, function (_substring: string, ...replaceArgs: any[]) {
        return args[replaceArgs[0]];
    }).trim();
}
