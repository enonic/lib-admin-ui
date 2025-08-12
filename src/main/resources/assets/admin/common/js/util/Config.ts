import Q from 'q';
import {JsonResponse} from '../rest/JsonResponse';
import {Path} from '../rest/Path';
import {ResourceRequest} from '../rest/ResourceRequest';
import {UriHelper} from './UriHelper';

export type ConfigValue = string | number | boolean | object;
export type ConfigObject = Record<string, ConfigValue>;

export class CONFIG {
    private static CACHE: ConfigObject;

    static init(url: string): Q.Promise<ConfigObject> {
        return CONFIG.loadAndCache(url);
    }

    static isTrue(property: string): boolean {
        if (!CONFIG.has(property)) {
            return false;
        }

        return CONFIG.getString(property) === 'true';
    }

    static getConfig(): ConfigObject {
        return CONFIG.CACHE;
    }

    static has(property: string): boolean {
        return CONFIG.CACHE?.[property] !== undefined;
    }

    static getString(property: string): string {
        return String(CONFIG.get(property));
    }

    static getNumber(property: string): number {
        const propertyValue = CONFIG.get(property);
        if (isNaN(propertyValue as unknown as number)) {
            throw Error(`Property ${property} is not a number`);
        }
        return parseInt(String(propertyValue));
    }

    static getLocale(): string {
        if (!CONFIG.has('locale')) {
            return 'en';
        }

        return CONFIG.getString('locale');
    }

    static get(property: string): ConfigValue {
        return CONFIG.getPropertyValue(property);
    }

    private static getPropertyValue(property: string): ConfigValue {
        if (property.indexOf('.') > 0) {
            return CONFIG.getNested(property);
        }
        if (!CONFIG.has(property)) {
            throw Error(`Config property ${property} not found`);
        }
        return CONFIG.CACHE[property];
    }

    static setConfig(config: ConfigObject): void {
        CONFIG.CACHE = Object.freeze(Object.assign({}, config));
        try {
            const adminUrl = CONFIG.getString('adminUrl');
            UriHelper.setAdminUri(adminUrl);
        } catch {
            //
        }
    }

    // For getting nested value, like 'services.i18nUrl'
    private static getNested(property: string): ConfigValue {
        const propertyPaths = property.split('.');
        if (!CONFIG.has(propertyPaths[0])) {
            throw Error(`Config property ${propertyPaths[0]} not found`);
        }
        let result: ConfigValue = CONFIG.getPropertyValue(propertyPaths[0]);
        for (let i=1; i<propertyPaths.length; i++) {
            result = result[propertyPaths[i]];
            if (result === undefined) {
                throw Error(`Incorrect property path: ${property}`);
            }
        }
        return result;
    }

    private static load(url: string): Q.Promise<ConfigObject> {
        const request: GetConfigRequest = new GetConfigRequest(url);

        return request.send().then((response: JsonResponse<ConfigObject>) => response.getResult());
    }

    private static loadAndCache(url: string): Q.Promise<ConfigObject> {
        return CONFIG.load(url).then((configJson: ConfigObject) => {
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
