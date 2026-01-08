export interface GlobalLibAdmin {
    store?: Store;
}

export const GLOBAL: string = 'libAdmin';

export class Store {

    private map: Map<string, any>;

    private constructor() {
        this.map = new Map();
    }

    private static getGlobal(windowObject: Window = window): GlobalLibAdmin {
        let libAdmin = windowObject[GLOBAL];

        if (libAdmin == null) {
            libAdmin = Store.createGlobal();
            windowObject[GLOBAL] = libAdmin;
            return libAdmin;
        }

        return libAdmin;
    }

    private static createGlobal(): GlobalLibAdmin {
        return {};
    }

    private static instanceInWindow(windowObject?: Window): Store {
        const libAdmin: GlobalLibAdmin = Store.getGlobal(windowObject);

        if (!libAdmin.store) {
            libAdmin.store = new Store();
        }

        return libAdmin.store;
    }

    static instance(): Store {
        return Store.instanceInWindow();
    }

    static parentInstance(): Store {
        //TODO: can't do that in cross-origin iframes!
        // if (window !== window.parent) {
        //     return Store.instanceInWindow(window.parent);
        // }
        return Store.instance();
    }

    set(key: string, value: any): Store {
        this.map.set(key, value);
        return this;
    }

    get(key: string): any {
        return this.map.get(key);
    }

    delete(key: string): boolean {
        return this.map.delete(key);
    }

    has(key: string): boolean {
        return this.map.has(key);
    }

}
