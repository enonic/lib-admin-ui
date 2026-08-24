import {Input} from '@enonic/ui';
import type {JSX, ReactElement} from 'react';

import type {Value} from '../../../data/Value';
import {ValueTypes} from '../../../data/ValueTypes';
import {GeoPoint} from '../../../util/GeoPoint';
import type {GeoPointConfig} from '../../descriptor';
import type {InputTypeComponentProps} from '../../types';
import {displayValue, getFirstError, getInputAccessibleName, handleMobileCompletionKeyDown} from '../../utils';

const GEO_POINT_INPUT_NAME = 'GeoPointInput';

export type GeoPointInputProps = InputTypeComponentProps<GeoPointConfig>;

function valueToString(value: Value): string {
    return value.getGeoPoint().toString() ?? '';
}

export const GeoPointInput = ({
    value,
    rawValue,
    onChange,
    onBlur,
    onMobileComplete,
    input,
    enabled,
    index,
    errors,
    inputRef,
}: GeoPointInputProps): ReactElement => {
    const display = displayValue(value, rawValue, valueToString);

    const handleChange = (e: JSX.TargetedEvent<HTMLInputElement>) => {
        const inputValue = e.currentTarget.value;

        if (inputValue === '') {
            onChange(ValueTypes.GEO_POINT.newNullValue());
            return;
        }

        if (GeoPoint.isValidString(inputValue)) {
            onChange(ValueTypes.GEO_POINT.newValue(inputValue), inputValue);
            return;
        }

        onChange(ValueTypes.GEO_POINT.newNullValue(), inputValue);
    };

    return (
        <Input
            ref={inputRef}
            data-component={GEO_POINT_INPUT_NAME}
            data-mobile-focus-target
            aria-label={getInputAccessibleName(input, index)}
            type='text'
            value={display}
            onChange={handleChange}
            onBlur={onBlur}
            enterKeyHint={onMobileComplete ? 'next' : undefined}
            onKeyDown={onMobileComplete ? event => handleMobileCompletionKeyDown(event, onMobileComplete) : undefined}
            disabled={!enabled}
            error={getFirstError(errors)}
        />
    );
};

GeoPointInput.displayName = GEO_POINT_INPUT_NAME;
