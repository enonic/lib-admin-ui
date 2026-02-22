import {Input} from '@enonic/ui';
import type {JSX} from 'preact';

import {ValueTypes} from '../../data/ValueTypes';
import {i18n} from '../../util/Messages';
import type {TextLineConfig} from './descriptor/InputTypeConfig';
import type {InputTypeComponentProps} from './types';
import {getFirstError} from './types';

export function getCounterDescription(
    length: number,
    config: {maxLength: number; showCounter: boolean},
): string | undefined {
    const hasMaxLength = config.maxLength > 0;

    if (config.showCounter && hasMaxLength) {
        const remaining = config.maxLength - length;
        return `${i18n('field.value.chars.total', length)} / ${i18n('field.value.chars.left.short', remaining)}`;
    }

    if (hasMaxLength) {
        return i18n('field.value.chars.left.long', config.maxLength - length);
    }

    if (config.showCounter) {
        return i18n('field.value.chars.total', length);
    }

    return undefined;
}

export function TextLineInput({
    value,
    onChange,
    onBlur,
    config,
    enabled,
    errors,
}: InputTypeComponentProps<TextLineConfig>) {
    const stringValue = value.isNull() ? '' : (value.getString() ?? '');

    const handleChange = (e: JSX.TargetedEvent<HTMLInputElement>) => {
        onChange(ValueTypes.STRING.newValue(e.currentTarget.value));
    };

    return (
        <Input
            value={stringValue}
            onChange={handleChange}
            onBlur={onBlur}
            disabled={!enabled}
            error={getFirstError(errors)}
            maxLength={config.maxLength > 0 ? config.maxLength : undefined}
            description={getCounterDescription(stringValue.length, config)}
        />
    );
}
