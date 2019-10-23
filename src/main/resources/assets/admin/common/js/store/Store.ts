export interface GlobalLibAdmin {
    store?: Store;
}

export const GLOBAL: string = 'libAdmin';

export class Store {

    private map: Map<string, any>;

    private constructor() {
        this.map = new Map();
    }

    private static getGlobal(): GlobalLibAdmin {
        let libAdmin = window[GLOBAL];

        if (libAdmin == null) {
            libAdmin = Store.createGlobal();
            window[GLOBAL] = libAdmin;
            return libAdmin;
        }

        return libAdmin;
    }

    private static createGlobal(): GlobalLibAdmin {
        return {};
    }

    static instance(): Store {
        const libAdmin: GlobalLibAdmin = Store.getGlobal();

        if (libAdmin.store == null) {
            libAdmin.store = new Store();
        }

        return libAdmin.store;
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
