import {Store} from '../../../store/Store';
import {InputTypeDescriptor} from './InputTypeDescriptor';
import {InputTypeConfig} from './InputTypeConfig';

const STORE_KEY = 'descriptorRegistry';

function getDescriptors(): Map<string, InputTypeDescriptor> {
    let map: Map<string, InputTypeDescriptor> | undefined = Store.instance().get(STORE_KEY);
    if (!map) {
        map = new Map<string, InputTypeDescriptor>();
        Store.instance().set(STORE_KEY, map);
    }
    return map;
}

export class DescriptorRegistry {

    static get<C extends InputTypeConfig = InputTypeConfig>(name: string): InputTypeDescriptor<C> | undefined {
        return getDescriptors().get(name.toLowerCase()) as InputTypeDescriptor<C> | undefined;
    }

    static has(name: string): boolean {
        return getDescriptors().has(name.toLowerCase());
    }

    static register(descriptor: InputTypeDescriptor, force?: boolean): void {
        const key = descriptor.name.toLowerCase();
        if (!force && getDescriptors().has(key)) {
            console.warn(`DescriptorRegistry: "${descriptor.name}" is already registered. Use force to override.`);
            return;
        }
        getDescriptors().set(key, descriptor);
    }

    static unregister(name: string): boolean {
        return getDescriptors().delete(name.toLowerCase());
    }

    static getAll(): Map<string, InputTypeDescriptor> {
        return new Map(getDescriptors());
    }
}
