import * as semver from 'semver';

export class Validator {

    static validVersion(version: string): boolean {
        return semver.valid(version) != null;
    }

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

        return !text.match(/<script>/i) && !text.match(/%3cscript%3e/i);
    }
}
