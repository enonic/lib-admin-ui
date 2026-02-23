import type {Value} from '../../../data/Value';
import type {ValueType} from '../../../data/ValueType';
import {ValueTypes} from '../../../data/ValueTypes';
import {i18n} from '../../../util/Messages';
import {StringHelper} from '../../../util/StringHelper';
import type {TextLineConfig} from './InputTypeConfig';
import type {InputTypeDescriptor} from './InputTypeDescriptor';
import type {ValidationResult} from './ValidationResult';

export const TextLineDescriptor: InputTypeDescriptor<TextLineConfig> = {
    name: 'TextLine',

    getValueType(): ValueType {
        return ValueTypes.STRING;
    },

    readConfig(raw: Record<string, Record<string, unknown>[]>): TextLineConfig {
        const maxLengthVal = Number(raw.maxLength?.[0]?.value);
        const showCounter = (raw.showCounter?.[0]?.value as boolean) || false;

        const regexpStr = raw.regexp?.[0]?.value;
        let regexp: RegExp | undefined;
        if (typeof regexpStr === 'string' && !StringHelper.isBlank(regexpStr)) {
            try {
                regexp = new RegExp(regexpStr);
            } catch {
                console.warn(`TextLine: invalid regexp in config: "${regexpStr}"`);
            }
        }

        return {
            regexp,
            maxLength: maxLengthVal > 0 ? maxLengthVal : -1,
            showCounter,
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
