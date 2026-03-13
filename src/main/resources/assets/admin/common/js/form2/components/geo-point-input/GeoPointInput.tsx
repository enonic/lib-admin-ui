import {Input} from '@enonic/ui';
import {type JSX, type ReactElement, useEffect, useRef, useState} from 'react';
import {ValueTypes} from '../../../data/ValueTypes';
import {GeoPoint} from '../../../util/GeoPoint';
import type {GeoPointConfig} from '../../descriptor';
import type {InputTypeComponentProps} from '../../types';
import {getFirstError} from '../../utils';

const GEO_POINT_INPUT_NAME = 'GeoPointInput';

export type GeoPointInputProps = InputTypeComponentProps<GeoPointConfig>;

function valueToString(value: GeoPointInputProps['value']): string {
    return value.isNull() ? '' : (value.getGeoPoint().toString() ?? '');
}

export const GeoPointInput = ({value, onChange, onBlur, enabled, errors}: GeoPointInputProps): ReactElement => {
    const [rawInput, setRawInput] = useState(() => valueToString(value));
    const lastEmitted = useRef<string | undefined>(undefined);

    // Sync from parent only on external value changes (e.g. form reset).
    // Skip when the string representation matches what we last emitted.
    useEffect(() => {
        const parentStr = valueToString(value);
        if (lastEmitted.current === parentStr) return;
        setRawInput(parentStr);
    }, [value]);

    const handleChange = (e: JSX.TargetedEvent<HTMLInputElement>) => {
        const inputValue = e.currentTarget.value;
        setRawInput(inputValue);

        if (inputValue === '') {
            lastEmitted.current = '';
            onChange(ValueTypes.GEO_POINT.newNullValue());
            return;
        }

        if (GeoPoint.isValidString(inputValue)) {
            const newValue = ValueTypes.GEO_POINT.newValue(inputValue);
            lastEmitted.current = valueToString(newValue);
            onChange(newValue, inputValue);
            return;
        }

        lastEmitted.current = '';
        onChange(ValueTypes.GEO_POINT.newNullValue(), inputValue);
    };

    return (
        <Input
            data-component={GEO_POINT_INPUT_NAME}
            type='text'
            value={rawInput}
            onChange={handleChange}
            onBlur={onBlur}
            disabled={!enabled}
            error={getFirstError(errors)}
        />
    );
};

GeoPointInput.displayName = GEO_POINT_INPUT_NAME;
