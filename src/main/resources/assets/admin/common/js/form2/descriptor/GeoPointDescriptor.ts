import type {Value} from '../../data/Value';
import type {ValueType} from '../../data/ValueType';
import {ValueTypes} from '../../data/ValueTypes';
import type {GeoPointConfig} from './InputTypeConfig';
import type {InputTypeDescriptor} from './InputTypeDescriptor';
import type {ValidationResult} from './ValidationResult';

export const GeoPointDescriptor: InputTypeDescriptor<GeoPointConfig> = {
    name: 'GeoPoint',

    getValueType(): ValueType {
        return ValueTypes.GEO_POINT;
    },

    readConfig(_raw: Record<string, Record<string, unknown>[]>): GeoPointConfig {
        return {};
    },

    createDefaultValue(raw: unknown): Value {
        if (typeof raw !== 'string') {
            return ValueTypes.GEO_POINT.newNullValue();
        }
        return ValueTypes.GEO_POINT.newValue(raw);
    },

    validate(value: Value, _config: GeoPointConfig): ValidationResult[] {
        const results: ValidationResult[] = [];
        if (value.isNull()) {
            return results;
        }

        if (!ValueTypes.GEO_POINT.isValid(value.getObject())) {
            results.push({message: 'Value is not a valid geo point'});
        }

        return results;
    },

    valueBreaksRequired(value: Value): boolean {
        return value.isNull() || !value.getType().equals(ValueTypes.GEO_POINT);
    },
};
