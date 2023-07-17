import {Cache} from '../cache/Cache';
import {ApplicationKey} from './ApplicationKey';

export class ApplicationCaches<CACHE extends Cache<any, any>> {

    private cacheByApplicationKey: Record<string, CACHE> = {};

    put(key: ApplicationKey, cache: CACHE) {
        this.cacheByApplicationKey[key.toString()] = cache;
    }

    getByKey(key: ApplicationKey): CACHE {
        return this.cacheByApplicationKey[key.toString()];
    }

    removeByKey(key: ApplicationKey) {
        delete this.cacheByApplicationKey[key.toString()];
    }
}
