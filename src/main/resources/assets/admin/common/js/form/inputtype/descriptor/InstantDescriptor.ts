import {Value} from '../../../data/Value';
import {ValueType} from '../../../data/ValueType';
import {ValueTypes} from '../../../data/ValueTypes';
import {Instant as InstantUtil} from '../../../util/Instant';
import {InputTypeDescriptor} from './InputTypeDescriptor';
import {InstantConfig} from './InputTypeConfig';
import {ValidationResult} from './ValidationResult';
import {RelativeTimeParser} from '../time/RelativeTimeParser';

const INSTANT_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?Z$/;

export const InstantDescriptor: InputTypeDescriptor<InstantConfig> = {

    name: 'Instant',

    getValueType(): ValueType {
        return ValueTypes.INSTANT;
    },

    readConfig(_raw: Record<string, Record<string, unknown>[]>): InstantConfig {
        return {};
    },

    createDefaultValue(raw: unknown): Value {
        if (typeof raw !== 'string') {
            return ValueTypes.INSTANT.newNullValue();
        }

        if (INSTANT_PATTERN.test(raw)) {
            return ValueTypes.INSTANT.newValue(raw);
        }

        const value = InstantUtil.fromDate(RelativeTimeParser.parseToInstant(raw));
        return new Value(value, ValueTypes.INSTANT);
    },

    validate(value: Value, _config: InstantConfig): ValidationResult[] {
        const results: ValidationResult[] = [];
        if (value.isNull()) {
            return results;
        }

        const str = value.getString();
        if (str && !INSTANT_PATTERN.test(str)) {
            results.push({message: 'Value is not a valid instant'});
        }

        return results;
    },

    valueBreaksRequired(value: Value): boolean {
        return value.isNull() || !value.getType().equals(ValueTypes.INSTANT);
    },
};
