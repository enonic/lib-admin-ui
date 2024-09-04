import * as Q from 'q';

export class Cache<T, KEY> {

    private objectsByKey: Record<string, T> = {};

    private loading: string[] = [];

    private loadedListeners: ((keyStr: string, value: T) => void)[] = [];

    getAll(): T[] {
        let all: T[] = [];
        for (let key in this.objectsByKey) {
            if (this.objectsByKey.hasOwnProperty(key)) {
                all.push(this.objectsByKey[key]);
            }
        }
        return all;
    }

    copy(_object: T): T {
        throw new Error('Must be implemented by inheritor');
    }

    getKeyFromObject(_object: T): KEY {
        throw new Error('Must be implemented by inheritor');
    }

    getKeyAsString(_object: KEY): string {
        throw new Error('Must be implemented by inheritor');
    }

    isOnLoading(key: KEY): boolean {
        return this.loading.indexOf(this.getKeyAsString(key)) >= 0;
    }

    addToLoading(key: KEY) {
        if (!this.isOnLoading(key)) {
            this.loading.push(this.getKeyAsString(key));
        }
    }

    getOnLoaded(key: KEY): Q.Promise<T> {
        let deferred = Q.defer<T>();

        let handler = (keyStr: string, value: T) => {
            if (this.getKeyAsString(key) === keyStr) {

                this.unLoaded(handler);
                return deferred.resolve(value);
            }
        };

        this.onLoaded(handler);
        return deferred.promise;
    }

    put(object: T) {
        let copy = this.copy(object);
        let keyAsString = this.getKeyAsString(this.getKeyFromObject(object));
        this.objectsByKey[keyAsString] = copy;

        if (this.loading.indexOf(keyAsString) >= 0) {
            this.loading.splice(this.loading.indexOf(keyAsString), 1);
        }

        this.notifyLoaded(keyAsString, copy);
    }

    deleteByKey(key: KEY) {
        let keyAsString = this.getKeyAsString(key);
        delete this.objectsByKey[keyAsString];
    }

    getByKey(key: KEY): T {
        let keyAsString = this.getKeyAsString(key);
        let object = this.objectsByKey[keyAsString];
        if (!object) {
            return null;
        }
        return this.copy(object);
    }

    private notifyLoaded(keyStr: string, value: T): void {
        this.loadedListeners.forEach((listener) => {
            listener(keyStr, value);
        });
    }

    private onLoaded(listener: (keyStr: string, value: T) => void) {
        this.loadedListeners.push(listener);
        return this;
    }

    private unLoaded(listener: (keyStr: string, value: T) => void) {
        this.loadedListeners = this.loadedListeners.filter((curr) => {
            return curr !== listener;
        });
        return this;
    }
}
