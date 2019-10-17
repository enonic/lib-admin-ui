import {WindowDOM} from '../dom/WindowDOM';

export interface GlobalLibAdmin {
    store?: Store;
}

export class Store {

    private map: Map<string, any>;

    private constructor() {
        this.map = new Map();
    }

    private static getGlobal(): GlobalLibAdmin {
        let libAdmin = WindowDOM.get().asWindow()['libAdmin'];

        if (libAdmin == null) {
            libAdmin = Store.createGlobal();
            WindowDOM.get().asWindow()['libAdmin'] = libAdmin;
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
