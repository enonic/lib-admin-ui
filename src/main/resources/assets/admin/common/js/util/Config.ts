import * as Q from 'q';
import {JsonResponse} from '../rest/JsonResponse';
import {Path} from '../rest/Path';
import {ResourceRequest} from '../rest/ResourceRequest';

export class CONFIG {
    private static CACHE: Object;

    static init(url: string): Q.Promise<void> {
        return CONFIG.loadAndCache(url);
    }

    static isTrue(property: string): boolean {
        return CONFIG.get(property) === 'true';
    }

    static getConfig(): Object {
        return CONFIG.CACHE;
    }

    static has(property: string): boolean {
        return CONFIG.CACHE[property] !== undefined;
    }

    static get(property: string): string {
        if (property.indexOf('.') > 0) {
            return CONFIG.getNested(property);
        }
        if (!CONFIG.has(property)) throw `Config property ${property} not found`;
        return CONFIG.CACHE[property];
    }

    static setConfig(config: Object) {
        CONFIG.CACHE = Object.freeze(Object.assign({}, config));
    }

    private static getNested(property: string): string {
        const propertyPaths = property.split('.');
        if (!CONFIG.has(propertyPaths[0])) {
            throw `Config property ${propertyPaths[0]} not found`;
        }
        let result = CONFIG.get(propertyPaths[0]);
        for (let i=1; i<propertyPaths.length; i++) {
            result = result[propertyPaths[i]];
            if (result === undefined) {
                throw `Incorrect property path: ${property}`;
            }
        }
        return result;
    }

    private static load(url: string): Q.Promise<KeysJson> {
        const request: GetConfigRequest = new GetConfigRequest(url);

        return request.send().then((response: JsonResponse<KeysJson>) => response.getResult());
    }

    private static loadAndCache(url: string): Q.Promise<void> {
        return CONFIG.load(url).then((configJson: Object) => {
            CONFIG.setConfig(configJson);

            /* For compatibility with Launcher. To be removed in CS 5 */
            window['CONFIG'] = configJson;
            /* */

            return Q();
        });
    }
}

interface KeysJson {
    key: string;
}

class GetConfigRequest
    extends ResourceRequest<void> {

    private readonly url: string;

    constructor(url: string) {
        super();

        this.url = url;
    }

    getRequestPath(): Path {
        return Path.create().fromString(this.url).build();
    }
}
