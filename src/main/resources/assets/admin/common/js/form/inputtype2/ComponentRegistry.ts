import type {InputTypeComponent, InputTypeComponentProps} from './types';
import {TextLineInput} from './TextLineInput';

const components = new Map<string, InputTypeComponent>();

function register(name: string, component: InputTypeComponent): void {
    components.set(name.toLowerCase(), component);
}

// Register built-in components
register('TextLine', TextLineInput as InputTypeComponent);

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
}
