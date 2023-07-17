import * as Q from 'q';

export class CookieHelper {

    static setCookie(name: string, value: string, days: number = 1): void {
        let expires;
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = '; expires=' + date.toUTCString();
        } else {
            expires = '';
        }
        document.cookie = CookieHelper.escape(name) + '=' + CookieHelper.escape(value) + expires + '; path=/';
    }

    static getCookie(name: string): string {
        const nameEQ = CookieHelper.escape(name) + '=';
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            while (cookie.charAt(0) === ' ') {
                cookie = cookie.substring(1, cookie.length);
            }
            if (cookie.indexOf(nameEQ) === 0) {
                return CookieHelper.unescape(cookie.substring(nameEQ.length, cookie.length));
            }
        }
        return null;
    }

    static removeCookie(name: string): void {
        CookieHelper.setCookie(name, '', -1);
    }

    private static escape(value: string): string {
        return encodeURIComponent(value);
    }

    private static unescape(value: string): string {
        return decodeURIComponent(value);
    }
}
