import {Store} from '../../../store/Store';
import {InputTypeDescriptor} from './InputTypeDescriptor';
import {InputTypeConfig} from './InputTypeConfig';

import {TextLineDescriptor} from './TextLineDescriptor';
import {TextAreaDescriptor} from './TextAreaDescriptor';
import {DoubleDescriptor} from './DoubleDescriptor';
import {LongDescriptor} from './LongDescriptor';
import {CheckboxDescriptor} from './CheckboxDescriptor';
import {ComboBoxDescriptor} from './ComboBoxDescriptor';
import {RadioButtonDescriptor} from './RadioButtonDescriptor';
import {PrincipalSelectorDescriptor} from './PrincipalSelectorDescriptor';
import {GeoPointDescriptor} from './GeoPointDescriptor';
import {DateDescriptor} from './DateDescriptor';
import {DateTimeDescriptor} from './DateTimeDescriptor';
import {TimeDescriptor} from './TimeDescriptor';
import {InstantDescriptor} from './InstantDescriptor';
import {DateTimeRangeDescriptor} from './DateTimeRangeDescriptor';

const STORE_KEY = 'descriptorRegistry';

function getDescriptors(): Map<string, InputTypeDescriptor> {
    let map: Map<string, InputTypeDescriptor> | undefined = Store.instance().get(STORE_KEY);
    if (!map) {
        map = new Map<string, InputTypeDescriptor>();
        Store.instance().set(STORE_KEY, map);
    }
    return map;
}

function register(descriptor: InputTypeDescriptor, force?: boolean): void {
    const key = descriptor.name.toLowerCase();
    if (!force && getDescriptors().has(key)) {
        console.warn(`DescriptorRegistry: "${descriptor.name}" is already registered. Use force to override.`);
        return;
    }
    getDescriptors().set(key, descriptor);
}

function registerBuiltIn(): void {
    register(TextLineDescriptor, true);
    register(TextAreaDescriptor, true);
    register(DoubleDescriptor, true);
    register(LongDescriptor, true);
    register(CheckboxDescriptor, true);
    register(ComboBoxDescriptor, true);
    register(RadioButtonDescriptor, true);
    register(PrincipalSelectorDescriptor, true);
    register(GeoPointDescriptor, true);
    register(DateDescriptor, true);
    register(DateTimeDescriptor, true);
    register(TimeDescriptor, true);
    register(InstantDescriptor, true);
    register(DateTimeRangeDescriptor, true);
}

// Register all built-in descriptors
registerBuiltIn();

export class DescriptorRegistry {

    static get<C extends InputTypeConfig = InputTypeConfig>(name: string): InputTypeDescriptor<C> | undefined {
        return getDescriptors().get(name.toLowerCase()) as InputTypeDescriptor<C> | undefined;
    }

    static has(name: string): boolean {
        return getDescriptors().has(name.toLowerCase());
    }

    static register(descriptor: InputTypeDescriptor, force?: boolean): void {
        register(descriptor, force);
    }

    static getAll(): Map<string, InputTypeDescriptor> {
        return new Map(getDescriptors());
    }

    /** @internal Test-only. Clears all entries and re-registers built-ins. */
    static _reset(): void {
        getDescriptors().clear();
        registerBuiltIn();
    }
}
