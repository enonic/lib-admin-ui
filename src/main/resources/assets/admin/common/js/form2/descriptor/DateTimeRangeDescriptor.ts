import type {PropertySet} from '../../data/PropertySet';
import type {Value} from '../../data/Value';
import type {ValueType} from '../../data/ValueType';
import {ValueTypes} from '../../data/ValueTypes';
import {LocalDateTime} from '../../util/LocalDateTime';
import type {DateTimeRangeConfig} from './InputTypeConfig';
import type {InputTypeDescriptor} from './InputTypeDescriptor';
import type {ValidationResult} from './ValidationResult';

export const DateTimeRangeDescriptor: InputTypeDescriptor<DateTimeRangeConfig> = {
    name: 'DateTimeRange',

    getValueType(): ValueType {
        return ValueTypes.DATA;
    },

    readConfig(raw: Record<string, Record<string, unknown>[]>): DateTimeRangeConfig {
        const readVal = (name: string): string => {
            return (raw[name]?.[0]?.value as string) ?? '';
        };

        const parseTime = (name: string): {hours: number; minutes: number} | undefined => {
            const time = readVal(name);
            if (!time) return undefined;
            const parts = time.split(':');
            return {hours: parseInt(parts[0] || '0', 10), minutes: parseInt(parts[1] || '0', 10)};
        };

        const useTimezone = readVal('timezone') === 'true';
        const fromLabel = readVal('fromLabel') || 'Date from';
        const toLabel = readVal('toLabel') || 'Date to';

        return {
            useTimezone,
            fromLabel,
            toLabel,
            errorNoStart: readVal('errorNoStart') || `${fromLabel} is required when ${toLabel} is set`,
            errorEndInPast: readVal('errorEndInPast') || `${toLabel} cannot be in the past`,
            errorEndBeforeStart: readVal('errorEndBeforeStart') || `${toLabel} cannot be before ${fromLabel}`,
            errorStartEqualsEnd: readVal('errorStartEqualsEnd') || `${fromLabel} and ${toLabel} cannot be equal`,
            defaultFromTime: parseTime('defaultFromTime'),
            defaultToTime: parseTime('defaultToTime'),
            fromPlaceholder: readVal('fromPlaceholder'),
            toPlaceholder: readVal('toPlaceholder'),
            optionalFrom: Boolean(readVal('optionalFrom')),
        };
    },

    createDefaultValue(_raw: unknown): Value {
        return ValueTypes.DATA.newNullValue();
    },

    validate(value: Value, config: DateTimeRangeConfig): ValidationResult[] {
        const results: ValidationResult[] = [];
        if (value.isNull()) {
            return results;
        }

        if (!value.getType().equals(ValueTypes.DATA)) {
            results.push({message: 'Value is not a valid date-time range'});
            return results;
        }

        const pSet: PropertySet = value.getPropertySet();
        if (!pSet) {
            return results;
        }

        const fromProp = pSet.getProperty('from');
        const toProp = pSet.getProperty('to');

        const fromValue = fromProp?.hasNonNullValue() ? fromProp.getLocalDateTime() : undefined;
        const toValue = toProp?.hasNonNullValue() ? toProp.getLocalDateTime() : undefined;

        if (toValue && !fromValue && !config.optionalFrom) {
            results.push({message: config.errorNoStart});
            return results;
        }

        if (toValue) {
            const toDate = toValue.toDate();
            const now = new Date();

            if (toDate < now) {
                results.push({message: config.errorEndInPast});
                return results;
            }

            const effectiveFrom = fromValue ?? LocalDateTime.fromDate(now);
            const fromDate = effectiveFrom.toDate();

            if (toDate < fromDate) {
                results.push({message: config.errorEndBeforeStart});
            } else if (toValue.equals(effectiveFrom)) {
                results.push({message: config.errorStartEqualsEnd});
            }
        }

        return results;
    },

    valueBreaksRequired(value: Value): boolean {
        if (value.isNull() || !value.getType().equals(ValueTypes.DATA)) {
            return true;
        }

        const pSet: PropertySet = value.getPropertySet();
        const from = pSet?.getProperty('from');
        const to = pSet?.getProperty('to');

        const validTypes = ['DateTime', 'LocalDateTime'];

        if (from && !validTypes.includes(from.getType().toString())) {
            return true;
        }
        if (to && !validTypes.includes(to.getType().toString())) {
            return true;
        }

        return false;
    },
};
