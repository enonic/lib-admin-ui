import type {InputTypeComponent} from './types';
import {TextLineInput} from './TextLineInput';

const components = new Map<string, InputTypeComponent>();

function register(name: string, component: InputTypeComponent): void {
    components.set(name.toLowerCase(), component);
}

function registerBuiltIn(): void {
    register('TextLine', TextLineInput as InputTypeComponent);
}

// Register built-in components
registerBuiltIn();

export class ComponentRegistry {

    static get(name: string): InputTypeComponent | undefined {
        return components.get(name.toLowerCase());
    }

    static has(name: string): boolean {
        return components.has(name.toLowerCase());
    }

    static register(name: string, component: InputTypeComponent): void {
        register(name, component);
    }

    static getAll(): Map<string, InputTypeComponent> {
        return new Map(components);
    }

    static _reset(): void {
        components.clear();
        registerBuiltIn();
    }
}
