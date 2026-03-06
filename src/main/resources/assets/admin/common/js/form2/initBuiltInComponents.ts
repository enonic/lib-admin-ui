import {CheckboxInput} from './components/checkbox-input';
import {DateInput} from './components/date-input';
import {DoubleInput} from './components/double-input';
import {GeoPointInput} from './components/geo-point-input';
import {LongInput} from './components/long-input';
import {RadioButtonInput} from './components/radio-button-input';
import {TextAreaInput} from './components/text-area-input';
import {TextLineInput} from './components/text-line-input';
import {TimeInput} from './components/time-input';
import {ComponentRegistry} from './registry/ComponentRegistry';
import type {InputTypeComponent} from './types';

export function initBuiltInComponents(): void {
    // Type assertion needed: concrete components use narrower InputTypeComponentProps<XConfig>,
    // but the registry stores the generic InputTypeComponent. Props contract is tested separately.
    ComponentRegistry.register('Checkbox', CheckboxInput as InputTypeComponent, true);
    ComponentRegistry.register('Double', DoubleInput as InputTypeComponent, true);
    ComponentRegistry.register('Date', DateInput as InputTypeComponent, true);
    ComponentRegistry.register('GeoPoint', GeoPointInput as InputTypeComponent, true);
    ComponentRegistry.register('Long', LongInput as InputTypeComponent, true);
    ComponentRegistry.register('RadioButton', RadioButtonInput as InputTypeComponent, true);
    ComponentRegistry.register('TextArea', TextAreaInput as InputTypeComponent, true); // Duplicate registration?
    ComponentRegistry.register('TextLine', TextLineInput as InputTypeComponent, true); // Duplicate registration?
    ComponentRegistry.register('Time', TimeInput as InputTypeComponent, true);
}
