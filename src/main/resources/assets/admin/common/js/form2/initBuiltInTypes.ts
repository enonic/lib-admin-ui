import {CheckboxInput} from './components/checkbox-input';
import {ComboBoxInput} from './components/combo-box-input';
import {DateInput} from './components/date-input';
import {DateTimeInput} from './components/date-time-input';
import {DoubleInput} from './components/double-input';
import {GeoPointInput} from './components/geo-point-input';
import {InstantInput} from './components/instant-input';
import {LongInput} from './components/long-input';
import {RadioButtonInput} from './components/radio-button-input';
import {TagInput} from './components/tag-input';
import {TextAreaInput} from './components/text-area-input';
import {TextLineInput} from './components/text-line-input';
import {TimeInput} from './components/time-input';
import {CheckboxDescriptor} from './descriptor/CheckboxDescriptor';
import {ComboBoxDescriptor} from './descriptor/ComboBoxDescriptor';
import {DateDescriptor} from './descriptor/DateDescriptor';
import {DateTimeDescriptor} from './descriptor/DateTimeDescriptor';
import {DateTimeRangeDescriptor} from './descriptor/DateTimeRangeDescriptor';
import {DoubleDescriptor} from './descriptor/DoubleDescriptor';
import {GeoPointDescriptor} from './descriptor/GeoPointDescriptor';
import {InstantDescriptor} from './descriptor/InstantDescriptor';
import {LongDescriptor} from './descriptor/LongDescriptor';
import {PrincipalSelectorDescriptor} from './descriptor/PrincipalSelectorDescriptor';
import {RadioButtonDescriptor} from './descriptor/RadioButtonDescriptor';
import {TagDescriptor} from './descriptor/TagDescriptor';
import {TextAreaDescriptor} from './descriptor/TextAreaDescriptor';
import {TextLineDescriptor} from './descriptor/TextLineDescriptor';
import {TimeDescriptor} from './descriptor/TimeDescriptor';
import {InputTypeRegistry} from './registry/InputTypeRegistry';

export function initBuiltInTypes(): void {
    InputTypeRegistry.registerType({mode: 'single', descriptor: CheckboxDescriptor, component: CheckboxInput}, true);
    InputTypeRegistry.registerType({mode: 'list', descriptor: DateDescriptor, component: DateInput}, true);
    InputTypeRegistry.registerType({mode: 'list', descriptor: DateTimeDescriptor, component: DateTimeInput}, true);
    InputTypeRegistry.registerType({mode: 'list', descriptor: DoubleDescriptor, component: DoubleInput}, true);
    InputTypeRegistry.registerType({mode: 'list', descriptor: GeoPointDescriptor, component: GeoPointInput}, true);
    InputTypeRegistry.registerType({mode: 'list', descriptor: InstantDescriptor, component: InstantInput}, true);
    InputTypeRegistry.registerType({mode: 'list', descriptor: LongDescriptor, component: LongInput}, true);
    InputTypeRegistry.registerType({mode: 'list', descriptor: TimeDescriptor, component: TimeInput}, true);
    InputTypeRegistry.registerType(
        {mode: 'single', descriptor: RadioButtonDescriptor, component: RadioButtonInput},
        true,
    );
    InputTypeRegistry.registerType({mode: 'list', descriptor: TextAreaDescriptor, component: TextAreaInput}, true);
    InputTypeRegistry.registerType({mode: 'list', descriptor: TextLineDescriptor, component: TextLineInput}, true);
    InputTypeRegistry.registerType({mode: 'internal', descriptor: TagDescriptor, component: TagInput}, true);
    InputTypeRegistry.registerType({mode: 'internal', descriptor: ComboBoxDescriptor, component: ComboBoxInput}, true);
    InputTypeRegistry.registerType({mode: 'internal', descriptor: PrincipalSelectorDescriptor}, true);
    InputTypeRegistry.registerType({mode: 'list', descriptor: DateTimeRangeDescriptor}, true);
}
