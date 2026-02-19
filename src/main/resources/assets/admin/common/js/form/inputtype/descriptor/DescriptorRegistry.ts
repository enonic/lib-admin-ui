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

const descriptorsByName = new Map<string, InputTypeDescriptor>();

function register(descriptor: InputTypeDescriptor): void {
    descriptorsByName.set(descriptor.name.toLowerCase(), descriptor);
}

// Register all built-in descriptors
register(TextLineDescriptor);
register(TextAreaDescriptor);
register(DoubleDescriptor);
register(LongDescriptor);
register(CheckboxDescriptor);
register(ComboBoxDescriptor);
register(RadioButtonDescriptor);
register(PrincipalSelectorDescriptor);
register(GeoPointDescriptor);
register(DateDescriptor);
register(DateTimeDescriptor);
register(TimeDescriptor);
register(InstantDescriptor);
register(DateTimeRangeDescriptor);

export class DescriptorRegistry {

    static get<C extends InputTypeConfig = InputTypeConfig>(name: string): InputTypeDescriptor<C> | undefined {
        return descriptorsByName.get(name.toLowerCase()) as InputTypeDescriptor<C> | undefined;
    }

    static has(name: string): boolean {
        return descriptorsByName.has(name.toLowerCase());
    }

    static register(descriptor: InputTypeDescriptor): void {
        register(descriptor);
    }

    static getAll(): InputTypeDescriptor[] {
        return Array.from(descriptorsByName.values());
    }
}
