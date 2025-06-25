import {CheckboxDescriptor} from './CheckboxDescriptor';
import {ComboBoxDescriptor} from './ComboBoxDescriptor';
import {DateDescriptor} from './DateDescriptor';
import {DateTimeDescriptor} from './DateTimeDescriptor';
import {DateTimeRangeDescriptor} from './DateTimeRangeDescriptor';
import {DescriptorRegistry} from './DescriptorRegistry';
import {DoubleDescriptor} from './DoubleDescriptor';
import {GeoPointDescriptor} from './GeoPointDescriptor';
import {LongDescriptor} from './LongDescriptor';
import {PrincipalSelectorDescriptor} from './PrincipalSelectorDescriptor';
import {RadioButtonDescriptor} from './RadioButtonDescriptor';
import {TextAreaDescriptor} from './TextAreaDescriptor';
import {TextLineDescriptor} from './TextLineDescriptor';
import {TimeDescriptor} from './TimeDescriptor';

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
    DescriptorRegistry.register(DateTimeRangeDescriptor, true);
}
