import {ValueTypes} from '../../../data/ValueTypes';
import {ValueType} from '../../../data/ValueType';
import {Value} from '../../../data/Value';
import {Property} from '../../../data/Property';
import {BaseInputTypeNotManagingAdd} from '../support/BaseInputTypeNotManagingAdd';
import {Element} from '../../../dom/Element';
import {ValueChangedEvent} from '../../../ValueChangedEvent';
import {GeoPoint as GeoPointUtil} from '../../../util/GeoPoint';
import {GeoPoint as GeoPointEl} from '../../../ui/geo/GeoPoint';
import {FormInputEl} from '../../../dom/FormInputEl';
import {InputTypeManager} from '../InputTypeManager';
import {Class} from '../../../Class';
import {ValueTypeConverter} from '../../../data/ValueTypeConverter';
import {AdditionalValidationRecord} from '../../AdditionalValidationRecord';
import {i18n} from '../../../util/Messages';

export class GeoPoint
    extends BaseInputTypeNotManagingAdd {

    getValueType(): ValueType {
        return ValueTypes.GEO_POINT;
    }

    createInputOccurrenceElement(_index: number, property: Property): Element {
        if (!this.getValueType().equals(property.getType())) {
            ValueTypeConverter.convertPropertyValueType(property, this.getValueType());
        }

        const inputEl: GeoPointEl = new GeoPointEl(property.getGeoPoint());

        inputEl.onValueChanged((event: ValueChangedEvent) => {
            this.handleOccurrenceInputValueChanged(inputEl, event);
        });

        return inputEl;
    }

    protected getValue(inputEl: GeoPointEl, event: ValueChangedEvent): Value {
        const isValid: boolean = this.isUserInputValid(inputEl);
        return  isValid ? this.getValueType().newValue(event.getNewValue()) : this.getValueType().newNullValue();
    }

    resetInputOccurrenceElement(occurrence: Element) {
        const input: GeoPointEl = <GeoPointEl> occurrence;

        input.resetBaseValues();
    }

    setEnabledInputOccurrenceElement(occurrence: Element, enable: boolean) {
        const input: GeoPointEl = <GeoPointEl> occurrence;

        input.setEnabled(enable);
    }

    doValidateUserInput(inputEl: GeoPointEl) {
        super.doValidateUserInput(inputEl);

        if (!inputEl.isValid()) {
            const record: AdditionalValidationRecord =
                AdditionalValidationRecord.create().setMessage(i18n('field.value.invalid')).build();

            this.occurrenceValidationState.get(inputEl.getId()).addAdditionalValidation(record);
        }
    }

    protected updateFormInputElValue(occurrence: FormInputEl, property: Property) {
        const geoPoint = <GeoPointEl> occurrence;
        geoPoint.setGeoPoint(property.getGeoPoint());
    }
}

InputTypeManager.register(new Class('GeoPoint', GeoPoint), true);
