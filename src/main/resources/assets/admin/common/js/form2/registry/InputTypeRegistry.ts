import {Store} from '../../store/Store';
import type {InputTypeConfig} from '../descriptor/InputTypeConfig';
import type {InputTypeDescriptor} from '../descriptor/InputTypeDescriptor';
import type {InputTypeDefinition} from '../types';

const STORE_KEY = 'inputTypeRegistry';

function getEntries(): Map<string, InputTypeDefinition> {
    let map: Map<string, InputTypeDefinition> | undefined = Store.instance().get(STORE_KEY);
    if (!map) {
        map = new Map<string, InputTypeDefinition>();
        Store.instance().set(STORE_KEY, map);
    }
    return map;
}

// biome-ignore lint/complexity/noStaticOnlyClass: Registry pattern — class provides namespace for Store-backed operations
export class InputTypeRegistry {
    static getDefinition<C extends InputTypeConfig = InputTypeConfig>(
        name: string,
    ): InputTypeDefinition<C> | undefined {
        return getEntries().get(name.toLowerCase()) as InputTypeDefinition<C> | undefined;
    }

    static getDescriptor<C extends InputTypeConfig = InputTypeConfig>(
        name: string,
    ): InputTypeDescriptor<C> | undefined {
        return this.getDefinition<C>(name)?.descriptor;
    }

    static has(name: string): boolean {
        return getEntries().has(name.toLowerCase());
    }

    static registerType<C extends InputTypeConfig>(definition: InputTypeDefinition<C>, force?: boolean): void {
        const key = definition.descriptor.name.toLowerCase();
        const existing = getEntries().get(key);

        if (existing && !force) {
            console.warn(
                `InputTypeRegistry: "${definition.descriptor.name}" is already registered. Use force to override.`,
            );
            return;
        }

        getEntries().set(key, definition as InputTypeDefinition);
    }

    static unregister(name: string): boolean {
        return getEntries().delete(name.toLowerCase());
    }

    static getAll(): Map<string, InputTypeDefinition> {
        return new Map(getEntries());
    }
}
