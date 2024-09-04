import {Store} from '../store/Store';

export class Messages {

    private static getMessages(): Map<string, string> {
        let messages: Map<string, string> = Store.instance().get('messages');

        if (messages == null) {
            messages = new Map();
            Store.instance().set('messages', messages);
        }

        return messages;
    }

    static setMessages(messages: object) {
        if (!messages) {
            return;
        }

        Messages.getMessages().clear();
        Messages.addMessages(messages);
    }

    static addMessages(messages: object) {
        if (!messages) {
            return;
        }

        for (let key in messages) {
            if (messages.hasOwnProperty(key)) {
                Messages.getMessages().set(key, messages[key]);
            }
        }
    }

    static isEmpty() {
        return Messages.getMessages().size === 0;
    }

    static getMessage(key: string) {
        return Messages.getMessages().get(key);
    }

    static hasMessage(key: string) {
        return Messages.getMessages().has(key);
    }
}

export function i18n(key: string, ...args: any[]): string {
    const message = Messages.hasMessage(key) ? Messages.getMessage(key) : `#${key}#`;

    return message.replace(/{(\d+)}/g, function (_substring: string, ...replaceArgs: any[]) {
        return args[replaceArgs[0]];
    }).trim();
}
