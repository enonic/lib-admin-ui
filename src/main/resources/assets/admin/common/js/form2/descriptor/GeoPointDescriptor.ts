import type {Value} from '../../data/Value';
import type {ValueType} from '../../data/ValueType';
import {ValueTypes} from '../../data/ValueTypes';
import type {RawInputConfig} from '../../form/Input';
import {i18n} from '../../util/Messages';
import type {GeoPointConfig} from './InputTypeConfig';
import type {InputTypeDescriptor} from './InputTypeDescriptor';
import type {ValidationResult} from './ValidationResult';

export const GeoPointDescriptor: InputTypeDescriptor<GeoPointConfig> = {
    name: 'GeoPoint',

    getValueType(): ValueType {
        return ValueTypes.GEO_POINT;
    },

    readConfig(_raw: RawInputConfig): GeoPointConfig {
        return {};
    },

    createDefaultValue(raw: unknown): Value {
        if (typeof raw !== 'string') {
            return ValueTypes.GEO_POINT.newNullValue();
        }
        return ValueTypes.GEO_POINT.newValue(raw);
    },

    validate(value: Value, _config: GeoPointConfig, rawValue?: string): ValidationResult[] {
        const results: ValidationResult[] = [];
        if (value.isNull()) {
            // Distinguish "no input" from "rejected input" (e.g. "90," for a GeoPoint field)
            if (rawValue != null && rawValue !== '') {
                results.push({message: i18n('field.value.invalid')});
            }
            return results;
        }

        if (!ValueTypes.GEO_POINT.isValid(value.getObject())) {
            results.push({message: i18n('field.value.invalid')});
        }

        return results;
    },

    valueBreaksRequired(value: Value): boolean {
        return value.isNull() || !value.getType().equals(ValueTypes.GEO_POINT);
    },
};
