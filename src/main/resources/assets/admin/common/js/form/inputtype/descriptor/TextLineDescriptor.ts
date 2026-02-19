import {Value} from '../../../data/Value';
import {ValueType} from '../../../data/ValueType';
import {ValueTypes} from '../../../data/ValueTypes';
import {i18n} from '../../../util/Messages';
import {StringHelper} from '../../../util/StringHelper';
import {InputTypeDescriptor} from './InputTypeDescriptor';
import {TextLineConfig} from './InputTypeConfig';
import {ValidationResult} from './ValidationResult';

export const TextLineDescriptor: InputTypeDescriptor<TextLineConfig> = {

    name: 'TextLine',

    getValueType(): ValueType {
        return ValueTypes.STRING;
    },

    readConfig(raw: Record<string, Record<string, unknown>[]>): TextLineConfig {
        const maxLengthEntry = raw['maxLength']?.[0] ?? {};
        const maxLengthVal = maxLengthEntry['value'] as number;

        const showCounterEntry = raw['showCounter']?.[0] ?? {};

        const regexpEntry = raw['regexp']?.[0] ?? {};
        const regexpStr = regexpEntry['value'] as string;

        return {
            regexp: !StringHelper.isBlank(regexpStr) ? new RegExp(regexpStr) : null,
            maxLength: maxLengthVal > 0 ? maxLengthVal : -1,
            showCounter: (showCounterEntry['value'] as boolean) || false,
        };
    },

    createDefaultValue(raw: unknown): Value {
        if (typeof raw !== 'string') {
            return ValueTypes.STRING.newNullValue();
        }
        return ValueTypes.STRING.newValue(raw);
    },

    validate(value: Value, config: TextLineConfig): ValidationResult[] {
        const results: ValidationResult[] = [];
        if (value.isNull()) {
            return results;
        }

        const str = value.getString();

        if (config.maxLength > 0 && str.length > config.maxLength) {
            results.push({message: i18n('field.value.breaks.maxlength', config.maxLength)});
        }

        if (config.regexp && !StringHelper.isEmpty(str) && !config.regexp.test(str)) {
            results.push({message: i18n('field.value.invalid')});
        }

        return results;
    },

    valueBreaksRequired(value: Value): boolean {
        return value.isNull() || !value.getType().equals(ValueTypes.STRING) || StringHelper.isBlank(value.getString());
    },
};
