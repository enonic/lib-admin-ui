import {Store} from '../../store/Store';
import type {InputTypeComponent} from './types';

const STORE_KEY = 'componentRegistry';

function getComponents(): Map<string, InputTypeComponent> {
    let map: Map<string, InputTypeComponent> | undefined = Store.instance().get(STORE_KEY);
    if (!map) {
        map = new Map<string, InputTypeComponent>();
        Store.instance().set(STORE_KEY, map);
    }
    return map;
}

export class ComponentRegistry {

    static get(name: string): InputTypeComponent | undefined {
        return getComponents().get(name.toLowerCase());
    }

    static has(name: string): boolean {
        return getComponents().has(name.toLowerCase());
    }

    static register(name: string, component: InputTypeComponent, force?: boolean): void {
        const key = name.toLowerCase();
        if (!force && getComponents().has(key)) {
            console.warn(`ComponentRegistry: "${name}" is already registered. Use force to override.`);
            return;
        }
        getComponents().set(key, component);
    }

    static unregister(name: string): boolean {
        return getComponents().delete(name.toLowerCase());
    }

    static getAll(): Map<string, InputTypeComponent> {
        return new Map(getComponents());
    }
}
