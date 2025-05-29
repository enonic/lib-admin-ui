import {StringHelper} from './StringHelper';

export class UriHelper {

    private static DEFAULT_URI: string = '/';
    private static DEFAULT_ADMIN_URI: string = '/admin';
    private static ADMIN_URI: string;

    /**
     * Creates an URI from supplied path.
     *
     * @param path path to append to base URI.
     * @returns {string} the URI (base + path).
     */
    static getUri(path: string): string {
        return UriHelper.joinPath(UriHelper.DEFAULT_URI, UriHelper.relativePath(path));
    }

    /**
     * Creates an URI to an admin path.
     *
     * @param path path to append to base admin URI.
     * @returns {string} the URI to a admin path.
     */
    static getAdminUri(path: string): string {
        const adminUri = UriHelper.getAdminUriPrefix();
        return UriHelper.getUri(UriHelper.joinPath(adminUri, UriHelper.relativePath(path)));
    }

    /**
     * Gets the URI prefix of an admin path.
     *
     * @param path path to append to base admin URI.
     * @returns {string} the URI to a admin path.
     */
    static getAdminUriPrefix(): string {
        return UriHelper.ADMIN_URI ?? UriHelper.DEFAULT_ADMIN_URI;
    }

    static setAdminUri(value: string): void {
        UriHelper.ADMIN_URI = value;
    }

    /**
     * Creates an URI to a rest service.
     *
     * @param path path to append to base rest URI.
     * @returns {string} the URI to a rest service.
     */
    static getRestUri(path: string): string {
        return UriHelper.getAdminUri(UriHelper.joinPath('rest', UriHelper.relativePath(path)));
    }

    /**
     * Adds a prefix to a site path.
     *
     * @param path path to append to base site URI.
     * @returns {string} the URI to a site path.
     */
    static addSitePrefix(path: string): string {
        return UriHelper.getAdminUri(UriHelper.joinPath('site', UriHelper.relativePath(path)));
    }

    static relativePath(path: string): string {
        if (StringHelper.isBlank(path)) {
            return StringHelper.EMPTY_STRING;
        }
        return path.charAt(0) === '/' ? path.substring(1) : path;
    }

    static isNavigatingOutsideOfXP(href: string, contentWindow: Window): boolean {
        // href should start with '/' or after replacing window's protocol and host not be equal to basic href value
        return href.charAt(0) === '/' ? false : UriHelper.trimWindowProtocolAndPortFromHref(href, contentWindow) === href;
    }

    static trimWindowProtocolAndPortFromHref(href: string, contentWindow: Window) {
        let location: Location = contentWindow.location;
        return UriHelper.relativePath(href.replace(location.protocol + '//' + location.host, ''));
    }

    static trimAnchor(trimMe: string): string {
        let index = trimMe.lastIndexOf('#');
        return index >= 0 ? UriHelper.relativePath(trimMe.substring(0, index)) : UriHelper.relativePath(trimMe);
    }

    static trimUrlParams(trimMe: string): string {
        let index = trimMe.lastIndexOf('?');
        return index >= 0 ? trimMe.substring(0, index) : trimMe;
    }

    static joinPath(...paths: string[]): string {
        // using grouping here in order to not replace :// because js doesn't support lookbehinds
        return StringHelper.removeEmptyStrings(paths).join('/').replace(/(^|[^:])\/{2,}/g, '$1/');
    }

    static getUrlLocation(url: string): string {
        return StringHelper.isBlank(url) ? StringHelper.EMPTY_STRING : url.split(/\?|&/i)[0];
    }

    static decodeUrlParams(url: string): Record<string, string> {
        if (StringHelper.isBlank(url)) {
            return {};
        }
        let array = url.split(/\?|&/i);
        let params: Record<string, string> = {};
        let param;
        if (array.length > 1) {
            for (let i = 1; i < array.length; i++) {
                param = array[i].split('=');
                params[param[0]] = param.length > 1 ? decodeURIComponent(param[1]) : undefined;
            }
        }
        return params;
    }

    /**
     * Serializes an object to query string params.
     * Supports nested objects and arrays.
     *
     * @param params
     * @param prefix
     * @returns {string}
     */
    static encodeUrlParams(params: Record<string, any>, prefix?: string, encode: boolean = true): string {
        if (!params) {
            return StringHelper.EMPTY_STRING;
        }
        let urlArray = [];
        for (let key in params) {
            if (params.hasOwnProperty(key) && params[key] != null) {
                let value = params[key];
                let prefixedKey = prefix ? prefix + '[' + key + ']' : key;
                if (typeof value === 'object') {
                    urlArray.push(this.encodeUrlParams(value, prefixedKey));
                } else if (encode) {
                    urlArray.push(encodeURIComponent(prefixedKey) + '=' + encodeURIComponent(value));
                } else {
                    urlArray.push(prefixedKey + '=' + value);
                }
            }
        }
        return urlArray.join('&');
    }

    static appendUrlParams(url: string, params: Record<string, any>, encode: boolean = true): string {
        if (!params || Object.keys(params).length === 0) {
            return url;
        }

        let urlParams = UriHelper.decodeUrlParams(url);
        let hasParams = Object.keys(urlParams).length > 0;

        return url + (hasParams ? '&' : '?') + UriHelper.encodeUrlParams(params, '', encode);
    }

    static isNavigatingWithinSamePage(url: string, frameWindow: Window): boolean {
        const href = frameWindow.location.href;
        return url === UriHelper.trimAnchor(UriHelper.trimWindowProtocolAndPortFromHref(href, frameWindow));
    }

    static isDownloadLink(url: string): boolean {
        return url.indexOf('attachment/download') > 0;
    }
}
