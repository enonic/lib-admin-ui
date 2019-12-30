import {Cache} from '../cache/Cache';
import {Application, ApplicationBuilder} from './Application';
import {ApplicationKey} from './ApplicationKey';
import {ApplicationEvent, ApplicationEventType} from './ApplicationEvent';
import {Store} from '../store/Store';

export const APPLICATION_CACHE_KEY: string = 'ApplicationCache';

export class ApplicationCache
    extends Cache<Application, ApplicationKey> {

    constructor() {
        super();

        ApplicationEvent.on((event: ApplicationEvent) => {
            if (event.getEventType() !== ApplicationEventType.PROGRESS) {
                console.log('ApplicationCache on ApplicationEvent, deleting: ' + event.getApplicationKey().toString());
                this.deleteByKey(event.getApplicationKey());
            }
        });
    }

    static get(): ApplicationCache {
        let instance: ApplicationCache = Store.instance().get(APPLICATION_CACHE_KEY);

        if (instance == null) {
            instance = new ApplicationCache();
            Store.instance().set(APPLICATION_CACHE_KEY, instance);
        }

        return instance;
    }

    copy(object: Application): Application {
        return new ApplicationBuilder(object).build();
    }

    getKeyFromObject(object: Application): ApplicationKey {
        return object.getApplicationKey();
    }

    getKeyAsString(key: ApplicationKey): string {
        return key.toString();
    }
}
