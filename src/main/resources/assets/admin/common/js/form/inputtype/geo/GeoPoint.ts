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

export class GeoPoint
    extends BaseInputTypeNotManagingAdd {

    getValueType(): ValueType {
        return ValueTypes.GEO_POINT;
    }

    newInitialValue(): Value {
        return super.newInitialValue() || ValueTypes.GEO_POINT.newNullValue();
    }

    createInputOccurrenceElement(_index: number, property: Property): Element {
        if (!ValueTypes.GEO_POINT.equals(property.getType())) {
            ValueTypeConverter.convertPropertyValueType(property, ValueTypes.GEO_POINT);
        }

        let geoPoint = new GeoPointEl(property.getGeoPoint());

        geoPoint.onValueChanged((event: ValueChangedEvent) => {
            let value = GeoPointUtil.isValidString(event.getNewValue()) ?
                        ValueTypes.GEO_POINT.newValue(event.getNewValue()) :
                        ValueTypes.GEO_POINT.newNullValue();
            this.notifyOccurrenceValueChanged(geoPoint, value);
        });

        return geoPoint;
    }

    resetInputOccurrenceElement(occurrence: Element) {
        let input = <GeoPointEl> occurrence;

        input.resetBaseValues();
    }

    valueBreaksRequiredContract(value: Value): boolean {
        return value.isNull() || !value.getType().equals(ValueTypes.GEO_POINT);
    }

    hasInputElementValidUserInput(inputElement: Element) {
        let geoPoint = <GeoPointEl>inputElement;
        return geoPoint.isValid();
    }

    protected updateFormInputElValue(occurrence: FormInputEl, property: Property) {
        const geoPoint = <GeoPointEl> occurrence;
        geoPoint.setGeoPoint(property.getGeoPoint());
    }
}

InputTypeManager.register(new Class('GeoPoint', GeoPoint), true);
