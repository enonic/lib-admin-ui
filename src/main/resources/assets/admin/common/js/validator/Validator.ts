export class Validator {

    static validUrl(url: string): boolean {
        if (url == null) {
            return false;
        }

        return Validator.safeText(url);
    }

    static safeText(text: string) {
        if (!text) {
            return true;
        }

        return !(/<script>/i.exec(text)) && !(/%3cscript%3e/i.exec(text));
    }
}
