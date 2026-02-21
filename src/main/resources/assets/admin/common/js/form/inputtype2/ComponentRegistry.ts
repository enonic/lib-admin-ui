import {Store} from '../../store/Store';
import type {InputTypeComponent} from './types';
import {TextLineInput} from './TextLineInput';

const STORE_KEY = 'componentRegistry';

function getComponents(): Map<string, InputTypeComponent> {
    let map: Map<string, InputTypeComponent> | undefined = Store.instance().get(STORE_KEY);
    if (!map) {
        map = new Map<string, InputTypeComponent>();
        Store.instance().set(STORE_KEY, map);
    }
    return map;
}

function register(name: string, component: InputTypeComponent, force?: boolean): void {
    const key = name.toLowerCase();
    if (!force && getComponents().has(key)) {
        console.warn(`ComponentRegistry: "${name}" is already registered. Use force to override.`);
        return;
    }
    getComponents().set(key, component);
}

function registerBuiltIn(): void {
    // Type assertion needed: TextLineInput uses narrower InputTypeComponentProps<TextLineConfig>,
    // but the registry stores the generic InputTypeComponent. Props contract is tested separately.
    register('TextLine', TextLineInput as InputTypeComponent, true);
}

// Register built-in components
registerBuiltIn();

export class ComponentRegistry {

    static get(name: string): InputTypeComponent | undefined {
        return getComponents().get(name.toLowerCase());
    }

    static has(name: string): boolean {
        return getComponents().has(name.toLowerCase());
    }

    static register(name: string, component: InputTypeComponent, force?: boolean): void {
        register(name, component, force);
    }

    static getAll(): Map<string, InputTypeComponent> {
        return new Map(getComponents());
    }

    /** @internal Test-only. Clears all entries and re-registers built-ins. */
    static _reset(): void {
        getComponents().clear();
        registerBuiltIn();
    }
}
