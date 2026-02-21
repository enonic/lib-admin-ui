import {DescriptorRegistry} from './DescriptorRegistry';
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

export function initBuiltInDescriptors(): void {
    DescriptorRegistry.register(TextLineDescriptor, true);
    DescriptorRegistry.register(TextAreaDescriptor, true);
    DescriptorRegistry.register(DoubleDescriptor, true);
    DescriptorRegistry.register(LongDescriptor, true);
    DescriptorRegistry.register(CheckboxDescriptor, true);
    DescriptorRegistry.register(ComboBoxDescriptor, true);
    DescriptorRegistry.register(RadioButtonDescriptor, true);
    DescriptorRegistry.register(PrincipalSelectorDescriptor, true);
    DescriptorRegistry.register(GeoPointDescriptor, true);
    DescriptorRegistry.register(DateDescriptor, true);
    DescriptorRegistry.register(DateTimeDescriptor, true);
    DescriptorRegistry.register(TimeDescriptor, true);
    DescriptorRegistry.register(InstantDescriptor, true);
    DescriptorRegistry.register(DateTimeRangeDescriptor, true);
}
