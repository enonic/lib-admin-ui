import {Input} from '@enonic/ui';

import {ValueTypes} from '../../data/ValueTypes';
import {getFirstError} from './types';
import type {InputTypeComponentProps} from './types';
import type {TextLineConfig} from '../inputtype/descriptor/InputTypeConfig';

export function TextLineInput({
    value, onChange, config, enabled, errors,
}: InputTypeComponentProps<TextLineConfig>) {
    const stringValue = value.isNull() ? '' : (value.getString() ?? '');

    const handleChange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        onChange(ValueTypes.STRING.newValue(target.value));
    };

    return (
        <Input
            value={stringValue}
            onChange={handleChange}
            disabled={!enabled}
            error={getFirstError(errors)}
            maxLength={config.maxLength > 0 ? config.maxLength : undefined}
        />
    );
}
