import * as Q from 'q';
import {JsonResponse} from '../rest/JsonResponse';
import {Path} from '../rest/Path';
import {ResourceRequest} from '../rest/ResourceRequest';
import {JSONObject, JSONValue} from '../types';

export class CONFIG {
    private static CACHE: JSONObject;

    static init(url: string): Q.Promise<JSONObject> {
        return CONFIG.loadAndCache(url);
    }

    static isTrue(property: string): boolean {
        if (!CONFIG.has(property)) {
            return false;
        }

        return CONFIG.get(property).toString() === 'true';
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

    static getNumber(property: string): number {
        const propertyValue: string = <string>CONFIG.get(property);
        if (isNaN(<any>propertyValue)) {
            throw `Property ${property} is not a number`;
        }
        return parseInt(propertyValue);
    }

    static get(property: string): JSONValue {
        return CONFIG.getPropertyValue(property);
    }

    private static getPropertyValue(property: string): JSONValue {
        if (property.indexOf('.') > 0) {
            return CONFIG.getNested(property);
        }
        if (!CONFIG.has(property)) throw `Config property ${property} not found`;
        return CONFIG.CACHE[property];
    }

    static setConfig(config: JSONObject): void {
        CONFIG.CACHE = Object.freeze(Object.assign({}, config));
    }

    // For getting nested value, like 'services.i18nUrl'
    private static getNested(property: string): JSONValue {
        const propertyPaths = property.split('.');
        if (!CONFIG.has(propertyPaths[0])) {
            throw `Config property ${propertyPaths[0]} not found`;
        }
        let result: JSONValue = CONFIG.getPropertyValue(propertyPaths[0]);
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

            return Q(configJson);
        });
    }
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
