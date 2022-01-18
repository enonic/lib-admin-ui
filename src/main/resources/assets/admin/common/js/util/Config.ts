import * as Q from 'q';
import {JsonResponse} from '../rest/JsonResponse';
import {Path} from '../rest/Path';
import {ResourceRequest} from '../rest/ResourceRequest';

export class CONFIG {
    private static CACHE: JSONObject;

    static init(url: string): Q.Promise<JSONObject> {
        return CONFIG.loadAndCache(url);
    }

    static isTrue(property: string): boolean {
        return CONFIG.get(property) === 'true';
    }

    static getConfig(): JSONObject {
        return CONFIG.CACHE;
    }

    static has(property: string): boolean {
        return CONFIG.CACHE[property] !== undefined;
    }

    static getString(property: string): string {
        return <string>CONFIG.get(property);
    }

    static get(property: string): JSONValue {
        if (property.indexOf('.') > 0) {
            return CONFIG.getNested(property);
        }
        if (!CONFIG.has(property)) throw `Config property ${property} not found`;
        return CONFIG.CACHE[property];
    }

    static setConfig(config: JSONObject): void {
        CONFIG.CACHE = Object.freeze(Object.assign({}, config));
    }

    private static getNested(property: string): JSONValue {
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

    private static load(url: string): Q.Promise<JSONObject> {
        const request: GetConfigRequest = new GetConfigRequest(url);

        return request.send().then((response: JsonResponse<JSONObject>) => response.getResult());
    }

    private static loadAndCache(url: string): Q.Promise<JSONObject> {
        return CONFIG.load(url).then((configJson: JSONObject) => {
            CONFIG.setConfig(configJson);

            /* For compatibility with Launcher. To be removed in CS 5 */
            window['CONFIG'] = configJson;
            /* */

            return Q(configJson);
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
